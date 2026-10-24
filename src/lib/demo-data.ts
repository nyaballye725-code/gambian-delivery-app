import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { orderItems, orders, products, stores, users } from "@/db/schema";

export const demoPassword = "jotna2026";

export const demoAccounts = [
  { role: "admin", name: "Admin", email: "admin@jotna.gm", password: demoPassword },
  { role: "customer", name: "Aisha", email: "aisha@jotna.gm", password: demoPassword },
  { role: "driver", name: "Lamin", email: "lamin@jotna.gm", password: demoPassword },
] as const;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const ids = {
  admin: "10000000-0000-4000-8000-000000000001",
  aisha: "10000000-0000-4000-8000-000000000002",
  abdoulie: "10000000-0000-4000-8000-000000000003",
  lamin: "10000000-0000-4000-8000-000000000004",
  fatou: "10000000-0000-4000-8000-000000000005",
  farato: "20000000-0000-4000-8000-000000000001",
  green: "20000000-0000-4000-8000-000000000002",
  kora: "20000000-0000-4000-8000-000000000003",
  ocean: "20000000-0000-4000-8000-000000000004",
  kerr: "20000000-0000-4000-8000-000000000005",
};

let seedTask: Promise<void> | undefined;

export async function ensureSeeded() {
  if (!seedTask) {
    seedTask = seedDatabase().catch((error: unknown) => {
      seedTask = undefined;
      throw error;
    });
  }
  await seedTask;
}

async function seedDatabase() {
  const [existing] = await db.select({ id: users.id }).from(users).limit(1);
  if (existing) return;

  await db.transaction(async (tx) => {
    const [insideTransaction] = await tx.select({ id: users.id }).from(users).limit(1);
    if (insideTransaction) return;

    const passwordHash = hashPassword(demoPassword);
    await tx.insert(users).values([
      { id: ids.admin, name: "Jotna Operations", email: "admin@jotna.gm", passwordHash, role: "admin", phone: "+220 700 0100", city: "Banjul" },
      { id: ids.aisha, name: "Aisha Jallow", email: "aisha@jotna.gm", passwordHash, role: "customer", phone: "+220 345 7812", city: "Kololi" },
      { id: ids.abdoulie, name: "Abdoulie Sowe", email: "abdoulie@jotna.gm", passwordHash, role: "customer", phone: "+220 222 4186", city: "Bakau" },
      { id: ids.lamin, name: "Lamin Touray", email: "lamin@jotna.gm", passwordHash, role: "driver", phone: "+220 777 4032", city: "Serekunda", isAvailable: true },
      { id: ids.fatou, name: "Fatou Manneh", email: "fatou@jotna.gm", passwordHash, role: "driver", phone: "+220 366 5029", city: "Kololi", isAvailable: true },
    ]).onConflictDoNothing();

    await tx.insert(stores).values([
      { id: ids.farato, name: "Farato Kitchen", category: "Gambian favourites", location: "Senegambia", emoji: "🍛", deliveryFee: 40, rating: "4.9", prepTime: "20–30 min" },
      { id: ids.green, name: "Green Basket Market", category: "Groceries & produce", location: "Kotu", emoji: "🥬", deliveryFee: 35, rating: "4.8", prepTime: "15–25 min" },
      { id: ids.kora, name: "Kora Café", category: "Coffee & bakery", location: "Fajara", emoji: "☕", deliveryFee: 35, rating: "4.7", prepTime: "15–20 min" },
      { id: ids.ocean, name: "Ocean Breeze Grill", category: "Seafood & grill", location: "Cape Point, Bakau", emoji: "🐟", deliveryFee: 55, rating: "4.9", prepTime: "25–35 min" },
      { id: ids.kerr, name: "Kerr Momodou Groceries", category: "Everyday essentials", location: "Manjai Kunda", emoji: "🧺", deliveryFee: 45, rating: "4.6", prepTime: "20–30 min" },
    ]).onConflictDoNothing();

    const productRows = [
      { id: "30000000-0000-4000-8000-000000000001", storeId: ids.farato, name: "Domoda & rice", description: "Slow-cooked groundnut stew with tender beef and steamed rice.", category: "Local favourites", price: 220, emoji: "🥘" },
      { id: "30000000-0000-4000-8000-000000000002", storeId: ids.farato, name: "Jollof & grilled chicken", description: "Smoky party jollof, flame-grilled chicken and fresh salad.", category: "Local favourites", price: 260, emoji: "🍗" },
      { id: "30000000-0000-4000-8000-000000000003", storeId: ids.farato, name: "Benachin (one-pot rice)", description: "Colourful tomato rice with seasonal vegetables and fish.", category: "Local favourites", price: 240, emoji: "🍚" },
      { id: "30000000-0000-4000-8000-000000000004", storeId: ids.green, name: "Market fruit box", description: "A fresh mix of mango, oranges, bananas and local seasonal fruit.", category: "Fresh produce", price: 180, emoji: "🥭" },
      { id: "30000000-0000-4000-8000-000000000005", storeId: ids.green, name: "Avocado & tomato basket", description: "Ripe avocados, garden tomatoes and red onions from the market.", category: "Fresh produce", price: 145, emoji: "🥑" },
      { id: "30000000-0000-4000-8000-000000000006", storeId: ids.green, name: "Fresh baguette", description: "Warm, crusty bakery baguette, baked this morning.", category: "Bakery", price: 35, emoji: "🥖" },
      { id: "30000000-0000-4000-8000-000000000007", storeId: ids.kora, name: "Iced bissap latte", description: "A bright, chilled hibiscus drink with a creamy twist.", category: "Drinks", price: 95, emoji: "🧋" },
      { id: "30000000-0000-4000-8000-000000000008", storeId: ids.kora, name: "Banana bread slice", description: "House-baked banana bread with a little local honey.", category: "Bakery", price: 75, emoji: "🍰" },
      { id: "30000000-0000-4000-8000-000000000009", storeId: ids.ocean, name: "Yassa chicken plate", description: "Grilled chicken with lemon-onion yassa and fragrant rice.", category: "Grill", price: 285, emoji: "🍗" },
      { id: "30000000-0000-4000-8000-000000000010", storeId: ids.ocean, name: "Grilled barracuda", description: "Catch of the day, chargrilled with lime, chilli and plantain.", category: "Seafood", price: 420, emoji: "🐠" },
      { id: "30000000-0000-4000-8000-000000000011", storeId: ids.kerr, name: "Jus d'orange, 1 L", description: "Chilled orange juice for the whole family.", category: "Essentials", price: 110, emoji: "🍊" },
      { id: "30000000-0000-4000-8000-000000000012", storeId: ids.kerr, name: "Rice, 5 kg bag", description: "Everyday long-grain rice, locally stocked.", category: "Essentials", price: 395, emoji: "🍚" },
    ];
    await tx.insert(products).values(productRows).onConflictDoNothing();

    const now = Date.now();
    const orderRows = [
      { id: "40000000-0000-4000-8000-000000000001", orderNumber: "JT-10482", customerId: ids.aisha, driverId: ids.lamin, storeId: ids.farato, storeName: "Farato Kitchen", status: "preparing" as const, subtotal: 480, deliveryFee: 40, total: 520, paymentMethod: "Cash on delivery", deliveryAddress: "Bakau New Town, near the market", createdAt: new Date(now - 18 * 60_000), updatedAt: new Date(now - 6 * 60_000) },
      { id: "40000000-0000-4000-8000-000000000002", orderNumber: "JT-10481", customerId: ids.abdoulie, driverId: ids.fatou, storeId: ids.green, storeName: "Green Basket Market", status: "picked_up" as const, subtotal: 325, deliveryFee: 35, total: 360, paymentMethod: "QMoney", deliveryAddress: "Kotu South, near the turntable", createdAt: new Date(now - 32 * 60_000), updatedAt: new Date(now - 8 * 60_000) },
      { id: "40000000-0000-4000-8000-000000000003", orderNumber: "JT-10480", customerId: ids.aisha, driverId: ids.lamin, storeId: ids.ocean, storeName: "Ocean Breeze Grill", status: "delivered" as const, subtotal: 420, deliveryFee: 55, total: 475, paymentMethod: "Cash on delivery", deliveryAddress: "Kololi Beach Road, Palma Rima", createdAt: new Date(now - 29 * 60 * 60_000), updatedAt: new Date(now - 28 * 60 * 60_000) },
      { id: "40000000-0000-4000-8000-000000000004", orderNumber: "JT-10479", customerId: ids.abdoulie, driverId: null, storeId: ids.kora, storeName: "Kora Café", status: "ready" as const, subtotal: 265, deliveryFee: 35, total: 300, paymentMethod: "Wave", deliveryAddress: "Fajara, Atlantic Boulevard", createdAt: new Date(now - 44 * 60_000), updatedAt: new Date(now - 4 * 60_000) },
      { id: "40000000-0000-4000-8000-000000000005", orderNumber: "JT-10478", customerId: ids.aisha, driverId: null, storeId: ids.green, storeName: "Green Basket Market", status: "pending" as const, subtotal: 325, deliveryFee: 35, total: 360, paymentMethod: "Cash on delivery", deliveryAddress: "Kololi, Senegambia strip", createdAt: new Date(now - 58 * 60_000), updatedAt: new Date(now - 58 * 60_000) },
      { id: "40000000-0000-4000-8000-000000000006", orderNumber: "JT-10477", customerId: ids.abdoulie, driverId: ids.fatou, storeId: ids.farato, storeName: "Farato Kitchen", status: "delivered" as const, subtotal: 480, deliveryFee: 40, total: 520, paymentMethod: "QMoney", deliveryAddress: "Bakau Cape Point, near the junction", createdAt: new Date(now - 54 * 60 * 60_000), updatedAt: new Date(now - 53 * 60 * 60_000) },
      { id: "40000000-0000-4000-8000-000000000007", orderNumber: "JT-10476", customerId: ids.aisha, driverId: null, storeId: ids.ocean, storeName: "Ocean Breeze Grill", status: "confirmed" as const, subtotal: 285, deliveryFee: 55, total: 340, paymentMethod: "Cash on delivery", deliveryAddress: "Kololi, Senegambia strip", createdAt: new Date(now - 12 * 60_000), updatedAt: new Date(now - 9 * 60_000) },
    ];
    await tx.insert(orders).values(orderRows).onConflictDoNothing();

    await tx.insert(orderItems).values([
      { orderId: orderRows[0].id, productId: productRows[0].id, productName: "Domoda & rice", quantity: 1, unitPrice: 220 },
      { orderId: orderRows[0].id, productId: productRows[1].id, productName: "Jollof & grilled chicken", quantity: 1, unitPrice: 260 },
      { orderId: orderRows[1].id, productId: productRows[3].id, productName: "Market fruit box", quantity: 1, unitPrice: 180 },
      { orderId: orderRows[1].id, productId: productRows[4].id, productName: "Avocado & tomato basket", quantity: 1, unitPrice: 145 },
      { orderId: orderRows[2].id, productId: productRows[9].id, productName: "Grilled barracuda", quantity: 1, unitPrice: 420 },
      { orderId: orderRows[3].id, productId: productRows[6].id, productName: "Iced bissap latte", quantity: 2, unitPrice: 95 },
      { orderId: orderRows[3].id, productId: productRows[7].id, productName: "Banana bread slice", quantity: 1, unitPrice: 75 },
      { orderId: orderRows[4].id, productId: productRows[3].id, productName: "Market fruit box", quantity: 1, unitPrice: 180 },
      { orderId: orderRows[4].id, productId: productRows[4].id, productName: "Avocado & tomato basket", quantity: 1, unitPrice: 145 },
      { orderId: orderRows[5].id, productId: productRows[0].id, productName: "Domoda & rice", quantity: 1, unitPrice: 220 },
      { orderId: orderRows[5].id, productId: productRows[1].id, productName: "Jollof & grilled chicken", quantity: 1, unitPrice: 260 },
      { orderId: orderRows[6].id, productId: productRows[8].id, productName: "Yassa chicken plate", quantity: 1, unitPrice: 285 },
    ]).onConflictDoNothing();
  });
}
