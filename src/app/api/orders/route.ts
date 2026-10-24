import { randomBytes } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, stores } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/demo-data";
import { hydrateOrders, listOrdersForUser } from "@/lib/order-query";

export const dynamic = "force-dynamic";

class OrderError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "OrderError";
  }
}

export async function GET() {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to view orders." }, { status: 401 });
  return NextResponse.json({ orders: await listOrdersForUser(user) });
}

export async function POST(request: Request) {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in before placing an order." }, { status: 401 });
  if (user.role !== "customer") {
    return NextResponse.json({ error: "Only customer accounts can place orders." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as {
    items?: { productId?: string; quantity?: number }[];
    deliveryAddress?: string;
    paymentMethod?: string;
  } | null;
  const address = body?.deliveryAddress?.trim();
  if (!address || address.length < 5 || address.length > 240) {
    return NextResponse.json({ error: "Add a delivery address (at least 5 characters)." }, { status: 400 });
  }
  if (!Array.isArray(body?.items) || body.items.length === 0 || body.items.length > 30) {
    return NextResponse.json({ error: "Add at least one item to your basket." }, { status: 400 });
  }

  const quantities = new Map<string, number>();
  for (const item of body.items) {
    if (!item.productId || !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 20) {
      return NextResponse.json({ error: "One or more basket quantities are invalid." }, { status: 400 });
    }
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + Number(item.quantity));
  }
  if ([...quantities.values()].some((quantity) => quantity > 20)) {
    return NextResponse.json({ error: "A maximum of 20 of each item can be ordered." }, { status: 400 });
  }

  const productIds = [...quantities.keys()];
  const paymentMethod = ["Cash on delivery", "QMoney", "Wave"].includes(body?.paymentMethod ?? "") ? body?.paymentMethod ?? "Cash on delivery" : "Cash on delivery";
  const orderNumber = `JT-${Date.now().toString().slice(-6)}-${randomBytes(1).toString("hex").toUpperCase()}`;

  try {
    const created = await db.transaction(async (tx) => {
      // Lock the rows we are about to decrement so two shoppers cannot both
      // buy the last portion.
      const productRows = await tx
        .select()
        .from(products)
        .where(inArray(products.id, productIds))
        .for("update");

      if (productRows.length !== productIds.length || productRows.some((product) => !product.isAvailable)) {
        throw new OrderError(409, "A basket item is no longer available. Please refresh your basket.");
      }
      for (const product of productRows) {
        const quantity = quantities.get(product.id) ?? 0;
        if (product.stock < quantity) {
          throw new OrderError(
            409,
            product.stock === 0
              ? `${product.name} just sold out. Please remove it from your basket.`
              : `Only ${product.stock} × ${product.name} left. Please adjust your basket.`,
          );
        }
      }

      const storeId = productRows[0]?.storeId;
      if (!storeId || productRows.some((product) => product.storeId !== storeId)) {
        throw new OrderError(400, "Please order from one shop at a time.");
      }
      const [store] = await tx.select().from(stores).where(eq(stores.id, storeId)).limit(1);
      if (!store || !store.isOpen) throw new OrderError(409, "This shop is currently closed.");

      for (const product of productRows) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${quantities.get(product.id) ?? 0}` })
          .where(eq(products.id, product.id));
      }

      const subtotal = productRows.reduce((sum, product) => sum + product.price * (quantities.get(product.id) ?? 0), 0);
      const [order] = await tx.insert(orders).values({
        orderNumber,
        customerId: user.id,
        storeId: store.id,
        storeName: store.name,
        status: "pending",
        subtotal,
        deliveryFee: store.deliveryFee,
        total: subtotal + store.deliveryFee,
        paymentMethod,
        deliveryAddress: address,
      }).returning();

      await tx.insert(orderItems).values(productRows.map((product) => ({
        orderId: order.id,
        productId: product.id,
        productName: product.name,
        quantity: quantities.get(product.id) ?? 1,
        unitPrice: product.price,
      })));
      return order;
    });

    const [order] = await hydrateOrders([created]);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
