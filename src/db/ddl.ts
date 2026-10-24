/**
 * Idempotent schema DDL.
 *
 * The app applies this on first database access so that a brand new Postgres
 * database (or the embedded PGlite database used for local previews) is ready
 * before the first query runs. Every statement is safe to run repeatedly, which
 * keeps it in sync with `src/db/schema.ts` without a separate migration step.
 *
 * When you change the Drizzle schema, update the matching statement here too.
 * For managed Postgres you can alternatively run `npm run db:generate` and
 * apply the generated SQL in `drizzle/` — this bootstrap is a no-op on a
 * database that is already up to date.
 */

export const schemaStatements: string[] = [
  // Enums -------------------------------------------------------------------
  `DO $$ BEGIN
    CREATE TYPE "user_role" AS ENUM ('admin', 'customer', 'driver');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    CREATE TYPE "order_status" AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,

  // Tables ------------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "password_hash" text NOT NULL,
    "role" "user_role" DEFAULT 'customer' NOT NULL,
    "phone" text DEFAULT '' NOT NULL,
    "city" text DEFAULT 'Banjul' NOT NULL,
    "is_available" boolean DEFAULT true NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "users_email_unique" UNIQUE("email")
  )`,
  `CREATE TABLE IF NOT EXISTS "stores" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "category" text NOT NULL,
    "location" text NOT NULL,
    "emoji" varchar(12) DEFAULT '🍽️' NOT NULL,
    "delivery_fee" integer DEFAULT 35 NOT NULL,
    "rating" numeric(2, 1) DEFAULT '4.8' NOT NULL,
    "is_open" boolean DEFAULT true NOT NULL,
    "prep_time" text DEFAULT '20–30 min' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "products" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "store_id" uuid NOT NULL,
    "name" text NOT NULL,
    "description" text DEFAULT '' NOT NULL,
    "category" text DEFAULT 'Popular' NOT NULL,
    "price" integer NOT NULL,
    "stock" integer DEFAULT 40 NOT NULL,
    "emoji" varchar(12) DEFAULT '🍲' NOT NULL,
    "is_available" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "orders" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "order_number" varchar(32) NOT NULL,
    "customer_id" uuid NOT NULL,
    "driver_id" uuid,
    "store_id" uuid,
    "store_name" text NOT NULL,
    "status" "order_status" DEFAULT 'pending' NOT NULL,
    "subtotal" integer NOT NULL,
    "delivery_fee" integer NOT NULL,
    "total" integer NOT NULL,
    "payment_method" text DEFAULT 'Cash on delivery' NOT NULL,
    "delivery_address" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
  )`,
  `CREATE TABLE IF NOT EXISTS "order_items" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "order_id" uuid NOT NULL,
    "product_id" uuid,
    "product_name" text NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" integer NOT NULL
  )`,

  // Foreign keys ------------------------------------------------------------
  `DO $$ BEGIN
    ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk"
      FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE cascade;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk"
      FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE restrict;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "orders" ADD CONSTRAINT "orders_driver_id_users_id_fk"
      FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE set null;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_stores_id_fk"
      FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE set null;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk"
      FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk"
      FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE set null;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,

  // Indexes -----------------------------------------------------------------
  `CREATE INDEX IF NOT EXISTS "orders_customer_id_idx" ON "orders" ("customer_id")`,
  `CREATE INDEX IF NOT EXISTS "orders_driver_id_idx" ON "orders" ("driver_id")`,
  `CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status")`,
  `CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" ("created_at" DESC)`,
  `CREATE INDEX IF NOT EXISTS "orders_store_id_idx" ON "orders" ("store_id")`,
  `CREATE INDEX IF NOT EXISTS "products_store_id_idx" ON "products" ("store_id")`,
  `CREATE INDEX IF NOT EXISTS "order_items_order_id_idx" ON "order_items" ("order_id")`,
  `CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role")`,
];
