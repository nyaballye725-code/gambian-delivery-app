#!/usr/bin/env node
/**
 * End-to-end API smoke test for Jotna.
 *
 * Start the app first (`npm run dev` or `npm run build && npm start`) and run:
 *
 *   npm run test:api
 *   BASE_URL=http://localhost:3000 npm run test:api
 *
 * The script exercises the real HTTP surface for all three roles: signup,
 * login, catalogue, stock reservation, the full delivery lifecycle, role
 * permissions, cancellation and restocking. It leaves the demo database in a
 * usable state (stock is restored at the end).
 */

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const stamp = Date.now().toString(36);
// A distinct forwarded address keeps repeated runs out of each other's
// rate-limit bucket when testing against a shared local server.
const testAddress = `203.0.113.${Number.parseInt(stamp.slice(-2), 36) % 250}`;

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

class Client {
  constructor(label) {
    this.label = label;
    this.cookie = "";
  }

  async request(path, init = {}) {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
    headers.set("x-forwarded-for", testAddress);
    if (this.cookie) headers.set("cookie", this.cookie);

    const response = await fetch(`${BASE_URL}${path}`, { ...init, headers, redirect: "manual" });
    const setCookies = response.headers.getSetCookie?.() ?? [];
    for (const cookie of setCookies) {
      const [pair] = cookie.split(";");
      if (pair.startsWith("jotna_session=")) this.cookie = pair;
    }
    const text = await response.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { raw: text.slice(0, 200) };
    }
    return { status: response.status, body, headers: response.headers };
  }

  get(path) { return this.request(path); }
  post(path, body) { return this.request(path, { method: "POST", body: JSON.stringify(body) }); }
  patch(path, body) { return this.request(path, { method: "PATCH", body: JSON.stringify(body) }); }
  delete(path) { return this.request(path, { method: "DELETE" }); }
}

async function main() {
  console.log(`Jotna API smoke test → ${BASE_URL}`);

  section("Health & public access");
  const health = await (new Client("anon")).get("/api/health");
  check("health endpoint is green", health.status === 200 && health.body?.ok === true, `status ${health.status}`);
  const anonymous = new Client("anon");
  const anonymousOrders = await anonymous.get("/api/orders");
  check("orders require a session", anonymousOrders.status === 401, `status ${anonymousOrders.status}`);
  const anonymousMe = await anonymous.get("/api/auth/me");
  check("anonymous /me returns null user", anonymousMe.status === 200 && anonymousMe.body?.user === null);

  section("Demo mode");
  const demoMe = await anonymousMe;
  check("demo mode is advertised on /api/auth/me", demoMe.body?.demoMode === true && demoMe.body?.demoAccounts?.length === 3);
  check("/api/auth/me never exposes demo passwords", !JSON.stringify(demoMe.body?.demoAccounts ?? []).includes("jotna2026"));
  const demoClient = new Client("demo");
  const demoEntry = await demoClient.post("/api/auth/demo", { role: "customer" });
  check("one-click demo entry creates a session", demoEntry.status === 200 && demoEntry.body?.user?.role === "customer", `status ${demoEntry.status}`);
  const demoSession = await demoClient.get("/api/auth/me");
  check("demo session is a real signed-in session", demoSession.body?.user?.email === "aisha@jotna.gm");
  const badDemoRole = await (new Client("demo-bad")).post("/api/auth/demo", { role: "owner" });
  check("unknown demo roles are rejected", badDemoRole.status === 400, `status ${badDemoRole.status}`);
  const demoDriver = new Client("demo-driver");
  const demoDriverEntry = await demoDriver.post("/api/auth/demo", { role: "driver" });
  check("demo entry works for riders too", demoDriverEntry.body?.user?.role === "driver", `status ${demoDriverEntry.status}`);

  section("Admin sign-in & workspace");
  const admin = new Client("admin");
  const adminLogin = await admin.post("/api/auth/login", { email: "admin@jotna.gm", password: "jotna2026" });
  check("admin can sign in", adminLogin.status === 200 && adminLogin.body?.user?.role === "admin", `status ${adminLogin.status}`);
  const badLogin = await (new Client("bad")).post("/api/auth/login", { email: "admin@jotna.gm", password: "wrong-password" });
  check("wrong password is rejected", badLogin.status === 401, `status ${badLogin.status}`);
  const adminMe = await admin.get("/api/auth/me");
  check("session cookie restores the admin", adminMe.body?.user?.email === "admin@jotna.gm");
  const adminUsers = await admin.get("/api/users");
  check("admin can list accounts", adminUsers.status === 200 && Array.isArray(adminUsers.body?.users));

  section("Customer sign-up");
  const customer = new Client("customer");
  const customerEmail = `smoke-${stamp}@example.gm`;
  const register = await customer.post("/api/auth/register", {
    name: "Smoke Test Customer",
    email: customerEmail,
    password: "smoke-password-1",
    city: "Brikama",
  });
  check("a customer can create an account", register.status === 201 && register.body?.user?.role === "customer", `status ${register.status}`);
  check("signup never leaks the password hash", !("passwordHash" in (register.body?.user ?? {})));
  const duplicate = await (new Client("dupe")).post("/api/auth/register", {
    name: "Duplicate", email: customerEmail, password: "another-password",
  });
  check("duplicate email is rejected", duplicate.status === 409, `status ${duplicate.status}`);
  const weak = await (new Client("weak")).post("/api/auth/register", {
    name: "Weak", email: `weak-${stamp}@example.gm`, password: "short",
  });
  check("short passwords are rejected", weak.status === 400, `status ${weak.status}`);

  section("Catalogue & stock");
  const stores = await customer.get("/api/stores");
  check("customers can browse shops", stores.status === 200 && stores.body?.stores?.length > 0);
  const products = await customer.get("/api/products");
  check("customers can browse products", products.status === 200 && products.body?.products?.length > 0);
  const product = products.body.products[0];
  const originalStock = product.stock;
  const store = stores.body.stores.find((item) => item.id === product.storeId);
  check("catalogue product belongs to a listed shop", Boolean(store));

  section("Placing an order");
  const address = "Brikama, near the market";
  const orderResponse = await customer.post("/api/orders", {
    items: [{ productId: product.id, quantity: 2 }],
    deliveryAddress: address,
    paymentMethod: "Wave",
  });
  const order = orderResponse.body?.order;
  check("customer can place an order", orderResponse.status === 201, `status ${orderResponse.status}`);
  check("order totals are computed server-side", order?.subtotal === product.price * 2 && order?.total === product.price * 2 + store.deliveryFee);
  check("order starts as pending", order?.status === "pending");
  check("order belongs to the signed-in customer", order?.customerId === register.body.user.id);

  const afterOrder = await customer.get("/api/products");
  const stockedProduct = afterOrder.body.products.find((item) => item.id === product.id);
  check("stock is reserved when an order is placed", stockedProduct?.stock === originalStock - 2, `stock ${stockedProduct?.stock} vs ${originalStock - 2}`);

  section("Stock limits");
  await admin.patch(`/api/products/${product.id}`, { stock: 1 });
  const tooMany = await customer.post("/api/orders", {
    items: [{ productId: product.id, quantity: 2 }], deliveryAddress: address,
  });
  check("cannot order more than the remaining stock", tooMany.status === 409, `status ${tooMany.status}`);
  check("stock error explains the problem", /Only 1/i.test(tooMany.body?.error ?? ""), tooMany.body?.error);

  section("Cancellation returns stock");
  const cancel = await customer.patch(`/api/orders/${order.id}`, { status: "cancelled" });
  check("customer can cancel a pending order", cancel.status === 200 && cancel.body?.order?.status === "cancelled", `status ${cancel.status}`);
  const afterCancel = await customer.get("/api/products");
  check("cancelled order puts stock back", afterCancel.body.products.find((item) => item.id === product.id)?.stock === 3, "expected 3 in stock (1 + 2 returned)");
  const cancelAgain = await customer.patch(`/api/orders/${order.id}`, { status: "cancelled" });
  check("cancelling twice is refused", cancelAgain.status === 409, `status ${cancelAgain.status}`);

  section("Role permissions");
  const driverBlockedOrder = await admin.post("/api/orders", { items: [{ productId: product.id, quantity: 1 }], deliveryAddress: address });
  check("admin accounts cannot place customer orders", driverBlockedOrder.status === 403, `status ${driverBlockedOrder.status}`);
  const customerUsers = await customer.get("/api/users");
  check("customers cannot list staff accounts", customerUsers.status === 403, `status ${customerUsers.status}`);
  const customerStoresWrite = await customer.post("/api/stores", { name: "Nope", category: "Nope", location: "Nope", deliveryFee: 10 });
  check("customers cannot create shops", customerStoresWrite.status === 403, `status ${customerStoresWrite.status}`);

  section("Delivery lifecycle");
  await admin.patch(`/api/products/${product.id}`, { stock: 10 });
  const deliveryOrderResponse = await customer.post("/api/orders", {
    items: [{ productId: product.id, quantity: 1 }], deliveryAddress: address, paymentMethod: "Cash on delivery",
  });
  const deliveryOrder = deliveryOrderResponse.body?.order;
  check("second order created", deliveryOrderResponse.status === 201, `status ${deliveryOrderResponse.status}`);

  const confirm = await admin.patch(`/api/orders/${deliveryOrder.id}`, { status: "confirmed" });
  check("admin can confirm an order", confirm.status === 200 && confirm.body?.order?.status === "confirmed", `status ${confirm.status}`);
  const preparing = await admin.patch(`/api/orders/${deliveryOrder.id}`, { status: "preparing" });
  check("admin can mark it preparing", preparing.body?.order?.status === "preparing");
  const ready = await admin.patch(`/api/orders/${deliveryOrder.id}`, { status: "ready" });
  check("admin can mark it ready", ready.body?.order?.status === "ready");

  const driver = new Client("driver");
  const driverLogin = await driver.post("/api/auth/login", { email: "lamin@jotna.gm", password: "jotna2026" });
  check("driver can sign in", driverLogin.status === 200 && driverLogin.body?.user?.role === "driver");
  const driverId = driverLogin.body.user.id;
  const queue = await driver.get("/api/orders");
  check("driver sees unassigned orders in the queue", queue.body?.orders?.some((item) => item.id === deliveryOrder.id));

  await driver.patch("/api/auth/me", { isAvailable: false });
  const offlineAccept = await driver.patch(`/api/orders/${deliveryOrder.id}`, { accept: true });
  check("offline drivers cannot accept deliveries", offlineAccept.status === 409, `status ${offlineAccept.status}`);
  await driver.patch("/api/auth/me", { isAvailable: true });

  const accept = await driver.patch(`/api/orders/${deliveryOrder.id}`, { accept: true });
  check("online driver can accept a delivery", accept.status === 200 && accept.body?.order?.driverId === driverId, `status ${accept.status}`);

  const driverAccounts = await admin.get("/api/users?role=driver");
  const otherDriver = driverAccounts.body.users.find((account) => account.id !== driverId);
  const reassign = await admin.patch(`/api/orders/${deliveryOrder.id}`, { driverId: otherDriver.id });
  check("admin can reassign an active delivery", reassign.status === 200 && reassign.body?.order?.driverId === otherDriver.id, `status ${reassign.status}`);
  const backToMe = await admin.patch(`/api/orders/${deliveryOrder.id}`, { driverId: driverId });
  check("admin can hand the job back", backToMe.body?.order?.driverId === driverId);

  const wrongStep = await driver.patch(`/api/orders/${deliveryOrder.id}`, { status: "delivered" });
  check("driver cannot skip the pickup step", wrongStep.status === 409, `status ${wrongStep.status}`);
  const pickedUp = await driver.patch(`/api/orders/${deliveryOrder.id}`, { status: "picked_up" });
  check("driver can mark the order picked up", pickedUp.body?.order?.status === "picked_up", `status ${pickedUp.status}`);
  const delivered = await driver.patch(`/api/orders/${deliveryOrder.id}`, { status: "delivered" });
  check("driver can complete the delivery", delivered.body?.order?.status === "delivered", `status ${delivered.status}`);

  const reopen = await admin.patch(`/api/orders/${deliveryOrder.id}`, { status: "pending" });
  check("delivered orders cannot be reopened", reopen.status === 409, `status ${reopen.status}`);
  const lateAssign = await admin.patch(`/api/orders/${deliveryOrder.id}`, { driverId: otherDriver.id });
  check("couriers cannot be swapped on a finished order", lateAssign.status === 409, `status ${lateAssign.status}`);
  const cancelDelivered = await customer.patch(`/api/orders/${deliveryOrder.id}`, { status: "cancelled" });
  check("customers cannot cancel a delivered order", cancelDelivered.status === 409, `status ${cancelDelivered.status}`);

  const otherCustomer = await (await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": testAddress },
    body: JSON.stringify({ name: "Other Customer", email: `other-${stamp}@example.gm`, password: "other-password" }),
  })).json();
  check("second customer created for ownership checks", Boolean(otherCustomer?.user?.id));
  const otherClient = new Client("other");
  await otherClient.post("/api/auth/login", { email: `other-${stamp}@example.gm`, password: "other-password" });
  const foreignOrder = await otherClient.patch(`/api/orders/${deliveryOrder.id}`, { status: "cancelled" });
  check("customers cannot touch someone else's order", foreignOrder.status === 403, `status ${foreignOrder.status}`);

  section("Sign out");
  const logout = await customer.post("/api/auth/logout", {});
  check("logout succeeds", logout.status === 200);
  const afterLogout = await customer.get("/api/auth/me");
  check("session is cleared after logout", afterLogout.body?.user === null);

  section("Cleanup");
  await admin.patch(`/api/products/${product.id}`, { stock: originalStock });
  const restored = await admin.get("/api/products");
  check("demo stock restored", restored.body.products.find((item) => item.id === product.id)?.stock === originalStock);

  console.log(`\n${failed === 0 ? "All checks passed" : "Some checks failed"}: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("Failed checks:");
    for (const name of failures) console.log(` - ${name}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("\nSmoke test crashed:", error);
  process.exitCode = 1;
});
