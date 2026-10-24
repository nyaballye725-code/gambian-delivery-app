import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, users } from "@/db/schema";
import type { SessionUser } from "@/lib/auth";

export async function listOrdersForUser(user: SessionUser) {
  let rows: (typeof orders.$inferSelect)[];
  if (user.role === "customer") {
    rows = await db.select().from(orders).where(eq(orders.customerId, user.id)).orderBy(desc(orders.createdAt));
  } else if (user.role === "driver") {
    rows = await db.select().from(orders).where(or(
      eq(orders.driverId, user.id),
      and(isNull(orders.driverId), inArray(orders.status, ["pending", "confirmed", "ready"])),
    )).orderBy(desc(orders.createdAt));
  } else {
    rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  }
  return hydrateOrders(rows);
}

export async function hydrateOrders(rows: (typeof orders.$inferSelect)[]) {
  if (rows.length === 0) return [];
  const orderIds = rows.map((order) => order.id);
  const peopleIds = new Set<string>();
  for (const order of rows) {
    peopleIds.add(order.customerId);
    if (order.driverId) peopleIds.add(order.driverId);
  }
  const [people, lines] = await Promise.all([
    db.select({ id: users.id, name: users.name, phone: users.phone }).from(users).where(inArray(users.id, [...peopleIds])),
    db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds)),
  ]);
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const itemsByOrder = new Map<string, typeof lines>();
  for (const line of lines) {
    const orderLines = itemsByOrder.get(line.orderId) ?? [];
    orderLines.push(line);
    itemsByOrder.set(line.orderId, orderLines);
  }
  return rows.map((order) => ({
    ...order,
    customerName: peopleById.get(order.customerId)?.name ?? "Customer",
    customerPhone: peopleById.get(order.customerId)?.phone ?? "",
    driverName: order.driverId ? peopleById.get(order.driverId)?.name ?? null : null,
    driverPhone: order.driverId ? peopleById.get(order.driverId)?.phone ?? null : null,
    items: itemsByOrder.get(order.id) ?? [],
  }));
}
