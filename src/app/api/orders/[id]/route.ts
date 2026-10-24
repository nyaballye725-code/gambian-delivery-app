import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { orderItems, orders, products, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/demo-data";
import { hydrateOrders } from "@/lib/order-query";

export const dynamic = "force-dynamic";
const validStatuses = ["pending", "confirmed", "preparing", "ready", "picked_up", "delivered", "cancelled"] as const;
type Status = (typeof validStatuses)[number];

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Puts stock back when an order is cancelled or removed before delivery. */
async function restockOrder(tx: Transaction, orderId: string) {
  const lines = await tx
    .select({ productId: orderItems.productId, quantity: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  for (const line of lines) {
    if (!line.productId) continue;
    await tx
      .update(products)
      .set({ stock: sql`${products.stock} + ${line.quantity}` })
      .where(eq(products.id, line.productId));
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const { id } = await context.params;
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const body = await request.json().catch(() => null) as { status?: string; accept?: boolean; driverId?: string | null } | null;
  const updatedAt = new Date();
  let changes: Partial<typeof orders.$inferInsert> = {};

  if (user.role === "admin") {
    if (body?.status && validStatuses.includes(body.status as Status)) {
      const nextStatus = body.status as Status;
      if (order.status === "cancelled" && nextStatus !== "cancelled") {
        return NextResponse.json({ error: "Cancelled orders cannot be reopened. Ask the customer to order again." }, { status: 409 });
      }
      if (order.status === "delivered" && nextStatus !== "delivered") {
        return NextResponse.json({ error: "Delivered orders are final." }, { status: 409 });
      }
      changes.status = nextStatus;
    } else if (body?.status) {
      return NextResponse.json({ error: "That order status is not supported." }, { status: 400 });
    }
    if (body && Object.prototype.hasOwnProperty.call(body, "driverId")) {
      if (!["pending", "confirmed", "preparing", "ready", "picked_up"].includes(order.status) && body.driverId !== order.driverId) {
        return NextResponse.json({ error: "The courier can only change while an order is active." }, { status: 409 });
      }
      if (body.driverId) {
        const [driver] = await db.select({ id: users.id, role: users.role, isActive: users.isActive }).from(users).where(eq(users.id, body.driverId)).limit(1);
        if (!driver || driver.role !== "driver" || !driver.isActive) return NextResponse.json({ error: "Choose an active driver account." }, { status: 400 });
      }
      changes.driverId = body.driverId || null;
    }
  } else if (user.role === "driver") {
    if (body?.accept) {
      if (!user.isAvailable) return NextResponse.json({ error: "Go online before accepting a delivery." }, { status: 409 });
      if (order.driverId && order.driverId !== user.id) return NextResponse.json({ error: "Another driver has accepted this order." }, { status: 409 });
      if (order.driverId === user.id) return NextResponse.json({ error: "You already have this delivery." }, { status: 409 });
      if (!["pending", "confirmed", "ready"].includes(order.status)) return NextResponse.json({ error: "This order is no longer available." }, { status: 409 });
      changes.driverId = user.id;
    } else {
      if (order.driverId !== user.id) return NextResponse.json({ error: "This delivery is not assigned to you." }, { status: 403 });
      if (body?.status === "picked_up" && order.status === "ready") {
        changes.status = "picked_up";
      } else if (body?.status === "delivered" && order.status === "picked_up") {
        changes.status = "delivered";
      } else {
        return NextResponse.json({ error: "That delivery step is not available yet." }, { status: 409 });
      }
    }
  } else {
    if (order.customerId !== user.id) return NextResponse.json({ error: "You can only update your own orders." }, { status: 403 });
    if (body?.status !== "cancelled" || !["pending", "confirmed"].includes(order.status)) {
      return NextResponse.json({ error: "This order can no longer be cancelled." }, { status: 409 });
    }
    changes.status = "cancelled";
  }

  if (Object.keys(changes).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  changes.updatedAt = updatedAt;
  const cancelledNow = changes.status === "cancelled" && order.status !== "cancelled";
  const updated = await db.transaction(async (tx) => {
    const [row] = await tx.update(orders).set(changes).where(eq(orders.id, id)).returning();
    if (cancelledNow) await restockOrder(tx, id);
    return row;
  });
  const [hydrated] = await hydrateOrders([updated]);
  return NextResponse.json({ order: hydrated });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const { id } = await context.params;
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const allowed = user.role === "admin" || (user.role === "customer" && order.customerId === user.id && ["pending", "cancelled"].includes(order.status));
  if (!allowed) return NextResponse.json({ error: "Only admins or the customer of a pending order can remove it." }, { status: 403 });
  await db.transaction(async (tx) => {
    // A cancelled order has already returned its stock; anything else still
    // holds it, so give it back before the rows disappear.
    if (order.status !== "cancelled") await restockOrder(tx, id);
    await tx.delete(orders).where(eq(orders.id, id));
  });
  return NextResponse.json({ ok: true, id });
}
