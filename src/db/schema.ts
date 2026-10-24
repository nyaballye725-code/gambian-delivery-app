import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "customer", "driver"]);
export const orderStatus = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "picked_up",
  "delivered",
  "cancelled",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("customer"),
  phone: text("phone").notNull().default(""),
  city: text("city").notNull().default("Banjul"),
  isAvailable: boolean("is_available").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stores = pgTable("stores", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  emoji: varchar("emoji", { length: 12 }).notNull().default("🍽️"),
  deliveryFee: integer("delivery_fee").notNull().default(35),
  rating: numeric("rating", { precision: 2, scale: 1 }).notNull().default("4.8"),
  isOpen: boolean("is_open").notNull().default(true),
  prepTime: text("prep_time").notNull().default("20–30 min"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("Popular"),
  price: integer("price").notNull(),
  stock: integer("stock").notNull().default(40),
  emoji: varchar("emoji", { length: 12 }).notNull().default("🍲"),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: varchar("order_number", { length: 32 }).notNull().unique(),
  customerId: uuid("customer_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  driverId: uuid("driver_id").references(() => users.id, { onDelete: "set null" }),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "set null" }),
  storeName: text("store_name").notNull(),
  status: orderStatus("status").notNull().default("pending"),
  subtotal: integer("subtotal").notNull(),
  deliveryFee: integer("delivery_fee").notNull(),
  total: integer("total").notNull(),
  paymentMethod: text("payment_method").notNull().default("Cash on delivery"),
  deliveryAddress: text("delivery_address").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(),
});
