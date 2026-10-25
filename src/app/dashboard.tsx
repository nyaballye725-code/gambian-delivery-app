"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bike,
  CalendarDays,
  Carrot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Coffee,
  CreditCard,
  Filter,
  Home,
  Info,
  LayoutDashboard,
  Leaf,
  LogOut,
  MapPin,
  Menu,
  Minus,
  Navigation,
  Package,
  Pencil,
  Phone,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store as StoreIcon,
  Trash2,
  Utensils,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";

type Role = "admin" | "customer" | "driver";
type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "picked_up" | "delivered" | "cancelled";
type View = "overview" | "orders" | "stores" | "drivers" | "customers" | "home" | "browse" | "deliveries" | "profile";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  city: string;
  isAvailable: boolean;
  isActive: boolean;
};
type StoreRecord = {
  id: string;
  name: string;
  category: string;
  location: string;
  emoji: string;
  deliveryFee: number;
  rating: string | number;
  isOpen: boolean;
  prepTime: string;
};
type ProductRecord = {
  id: string;
  storeId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  emoji: string;
  isAvailable: boolean;
};
type OrderLine = { id: string; productId: string | null; productName: string; quantity: number; unitPrice: number };
type OrderRecord = {
  id: string;
  orderNumber: string;
  customerId: string;
  driverId: string | null;
  storeId: string | null;
  storeName: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerPhone: string;
  driverName: string | null;
  driverPhone: string | null;
  items: OrderLine[];
};
type UserRecord = SessionUser & { createdAt: string };
type DialogState =
  | { type: "store"; store?: StoreRecord }
  | { type: "product"; product?: ProductRecord; storeId?: string }
  | { type: "user"; accountRole: "customer" | "driver"; user?: UserRecord }
  | { type: "checkout"; store: StoreRecord }
  | null;
type WorkspaceData = { orders: OrderRecord[]; stores: StoreRecord[]; products: ProductRecord[]; users: UserRecord[] };
type DemoAccount = { role: Role; email: string; name: string; color: string; description: string };

const ORDER_STATUSES: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "picked_up", "delivered", "cancelled"];

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(path, { ...init, headers, cache: "no-store" });
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

async function getWorkspace(role: Role): Promise<WorkspaceData> {
  const [orderData, storeData, productData, userData] = await Promise.all([
    api<{ orders: OrderRecord[] }>("/api/orders"),
    api<{ stores: StoreRecord[] }>("/api/stores"),
    api<{ products: ProductRecord[] }>("/api/products"),
    role === "admin" ? api<{ users: UserRecord[] }>("/api/users") : Promise.resolve({ users: [] as UserRecord[] }),
  ]);
  return { orders: orderData.orders, stores: storeData.stores, products: productData.products, users: userData.users };
}

function money(amount: number) {
  return `D ${Number(amount || 0).toLocaleString("en-GM")}`;
}
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}
function dateTime(value: string) {
  return new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function humanTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
function statusLabel(status: OrderStatus) {
  return ({ pending: "Pending", confirmed: "Confirmed", preparing: "Preparing", ready: "Ready for pickup", picked_up: "On the way", delivered: "Delivered", cancelled: "Cancelled" })[status];
}
function orderIsActive(order: OrderRecord) {
  return order.status !== "delivered" && order.status !== "cancelled";
}

function Avatar({ name, color = "green", size = "normal" }: { name: string; color?: string; size?: "normal" | "large" | "small" }) {
  return <span className={`avatar avatar-${color} avatar-${size}`}>{initials(name)}</span>;
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status-badge status-${status}`}><span className="status-dot" />{statusLabel(status)}</span>;
}

const TRACKING_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "Order placed" },
  { status: "confirmed", label: "Confirmed by the shop" },
  { status: "preparing", label: "Being prepared" },
  { status: "ready", label: "Ready for a rider" },
  { status: "picked_up", label: "On the way" },
  { status: "delivered", label: "Delivered" },
];

function OrderTracker({ order }: { order: OrderRecord }) {
  if (order.status === "cancelled") return null;
  const found = TRACKING_STEPS.findIndex((step) => step.status === order.status);
  const current = found < 0 ? 0 : found;
  const label = TRACKING_STEPS[current].label;
  const progress = ((current + 1) / TRACKING_STEPS.length) * 100;
  return (
    <div className={`order-tracker ${order.status === "delivered" ? "order-tracker-done" : ""}`}>
      <div className="order-tracker-track" role="progressbar" aria-valuemin={1} aria-valuemax={TRACKING_STEPS.length} aria-valuenow={current + 1} aria-label={`Order progress: ${label}`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="order-tracker-caption"><strong>{label}</strong><small>{order.status === "delivered" ? "Enjoy your order" : `Step ${current + 1} of ${TRACKING_STEPS.length}`}</small></div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <button type="button" className={`toggle ${checked ? "toggle-on" : ""}`} role="switch" aria-checked={checked} aria-label={label || "Toggle setting"} onClick={onChange}>
      <span />
    </button>
  );
}

function ModalFrame({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const cardRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !cardRef.current) return;
      const focusable = [...cardRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    // Move focus into the dialog once it has rendered.
    const frame = window.requestAnimationFrame(() => {
      const target = cardRef.current?.querySelector<HTMLElement>("input, select, textarea") ?? cardRef.current?.querySelector<HTMLElement>("button");
      target?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={cardRef} className={`modal-card ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <header className="modal-head">
          <div><h2 id="dialog-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
          <button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}

function LoginScreen({ onLogin, onRegister, onDemo, demoMode, demoAccounts }: {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (details: { name: string; email: string; password: string; city: string }) => Promise<void>;
  onDemo: (role: Role) => Promise<void>;
  demoMode: boolean;
  demoAccounts: DemoAccount[];
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [city, setCity] = useState("Brikama");
  const [email, setEmail] = useState(demoAccounts[0]?.email ?? "");
  const [password, setPassword] = useState(demoMode ? "jotna2026" : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeDemo, setActiveDemo] = useState<Role | "">("");

  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setError("");
    setActiveDemo("");
    if (next === "signup") {
      setEmail("");
      setPassword("");
    } else {
      setEmail(demoAccounts[0]?.email ?? "");
      setPassword(demoMode ? "jotna2026" : "");
    }
  }

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        await onRegister({ name, email, password, city });
      } else {
        await onLogin(email, password);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We couldn't sign you in. Try again.");
      setBusy(false);
    }
  }

  async function enterDemo(role: Role) {
    setError("");
    setBusy(true);
    setActiveDemo(role);
    try {
      await onDemo(role);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "That demo account isn't available right now.");
      setBusy(false);
      setActiveDemo("");
    }
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <a href="#" className="brand brand-dark" aria-label="Jotna home"><span className="brand-mark"><Navigation size={18} fill="currentColor" /></span><span>jotna<span className="brand-period">.</span></span></a>
        <div className="story-copy">
          <span className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> THE GAMBIA, DELIVERED</span>
          <h1>Good things<br />are <em>on the way.</em></h1>
          <p>From the kitchen down the road to the market around the corner. Your neighbourhood, a little closer.</p>
          <div className="story-art" aria-label="Illustration of a local delivery journey">
            <div className="art-sun" />
            <div className="art-hill art-hill-back" />
            <div className="art-hill art-hill-front" />
            <div className="route-line"><span className="route-pin route-pin-start"><StoreIcon size={16} /></span><span className="route-pin route-pin-end"><MapPin size={17} /></span></div>
            <div className="delivery-float"><span className="delivery-emoji">🛵</span><span><strong>On the way</strong><small>Senegambia · 12 min</small></span><span className="float-check"><Check size={13} /></span></div>
            <div className="food-float"><span>🍲</span><span>Local favourites</span><Star size={13} fill="currentColor" /></div>
            <div className="art-skyline"><i /><i /><i /><i /><i /><i /><i /><i /></div>
          </div>
        </div>
        <div className="story-foot"><span>Made for our coast.</span><span className="flag-mark">🇬🇲</span><span>Rooted in The Gambia</span></div>
      </section>
      <section className="login-panel">
        <div className="login-panel-inner">
          <div className="login-mobile-brand"><a href="#" className="brand brand-dark"><span className="brand-mark"><Navigation size={18} fill="currentColor" /></span><span>jotna<span className="brand-period">.</span></span></a><span className="mini-country">🇬🇲 &nbsp; THE GAMBIA</span></div>
          <div className="login-heading">
            <span className="eyebrow"><span className="eyebrow-dot" /> YOUR LOCAL DELIVERY CREW</span>
            <h2>{mode === "signin" ? "Welcome back" : "Join the neighbourhood"}</h2>
            <p>{mode === "signin" ? "Sign in to see what’s moving around your neighbourhood." : "Create a customer account and order from local shops in minutes."}</p>
          </div>
          <div className="auth-tabs" role="tablist" aria-label="Sign in or create an account">
            <button type="button" role="tab" aria-selected={mode === "signin"} className={`auth-tab ${mode === "signin" ? "auth-tab-active" : ""}`} onClick={() => switchMode("signin")}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === "signup"} className={`auth-tab ${mode === "signup" ? "auth-tab-active" : ""}`} onClick={() => switchMode("signup")}>Create account</button>
          </div>
          <form className="login-form" onSubmit={(event) => submit(event)}>
            {mode === "signup" && <>
              <label className="field-label" htmlFor="signup-name">Full name</label>
              <div className="input-wrap"><span className="input-leading">✳</span><input id="signup-name" name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Awa Ceesay" required minLength={2} maxLength={100} /></div>
              <label className="field-label" htmlFor="signup-city">Neighbourhood</label>
              <div className="input-wrap"><span className="input-leading"><MapPin size={15} /></span><input id="signup-city" name="city" autoComplete="address-level2" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Serekunda" maxLength={80} /></div>
            </>}
            <label className="field-label" htmlFor="login-email">Email address</label>
            <div className="input-wrap"><span className="input-leading">@</span><input id="login-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></div>
            <div className="password-row"><label className="field-label" htmlFor="login-password">Password</label>{mode === "signup" ? <span>At least 8 characters</span> : demoMode ? <span>Demo: <strong>jotna2026</strong></span> : <span>&nbsp;</span>}</div>
            <div className="input-wrap"><span className="input-leading"><span className="lock-symbol">⌑</span></span><input id="login-password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "signup" ? "Choose a password" : undefined} required minLength={mode === "signup" ? 8 : undefined} /></div>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="button button-dark button-full login-submit" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : <>{mode === "signin" ? "Sign in" : "Create my account"} <ArrowRight size={17} /></>}</button>
          </form>
          {mode === "signin" ? (demoMode ? <>
            <div className="login-divider"><span />or step into a demo account<span /></div>
            <div className="demo-banner"><span className="demo-banner-badge">DEMO MODE</span><span>Sample data — orders, shops and riders are all playable.</span></div>
            <div className="demo-list">
              {demoAccounts.map((account) => (
                <button key={account.role} type="button" className={`demo-account ${activeDemo === account.role ? "demo-active" : ""}`} disabled={busy} onClick={() => void enterDemo(account.role)}>
                  <Avatar name={account.name} color={account.color} size="small" />
                  <span className="demo-account-copy"><strong>{account.name}<span className="demo-role-tag">{account.role}</span></strong><small>{account.description}</small></span>
                  <span className="demo-enter">{activeDemo === account.role ? <span className="spinner spinner-dark" /> : <ArrowRight size={16} />}</span>
                </button>
              ))}
            </div>
            <p className="demo-note"><Info size={13} /> One click signs you in — no password needed. Turn this off with <code>DEMO_MODE=false</code>.</p>
          </> : <p className="auth-footnote">Demo access is turned off for this deployment. <button type="button" className="text-button" onClick={() => switchMode("signup")}>Create an account</button> or ask an admin for credentials.</p>) : <p className="auth-footnote">Riders and shop accounts are created by the Jotna operations team. <button type="button" className="text-button" onClick={() => switchMode("signin")}>Sign in instead</button></p>}
          <div className="login-foot"><span>🇬🇲 &nbsp; Built for The Gambia</span><span>GMD · Greater Banjul Area</span></div>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value, note, icon: Icon, tone = "green", trend }: { label: string; value: string; note: string; icon: LucideIcon; tone?: string; trend?: string }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-${tone}`}><Icon size={19} strokeWidth={1.8} /></div>
      <div className="metric-heading"><span>{label}</span>{trend && <span className="metric-trend"><ArrowUpRight size={13} />{trend}</span>}</div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-note">{note}</span>
    </article>
  );
}

function OrderTable({
  orders,
  role,
  search,
  drivers,
  onStatusChange,
  onAssignDriver,
  onDelete,
  onCancel,
  onRefresh,
}: {
  orders: OrderRecord[];
  role: Role;
  search: string;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onAssignDriver: (id: string, driverId: string | null) => void;
  drivers: UserRecord[];
  onDelete: (order: OrderRecord) => void;
  onCancel: (order: OrderRecord) => void;
  onRefresh: () => void;
}) {
  const [filter, setFilter] = useState("all");
  const filtered = orders.filter((order) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [order.orderNumber, order.customerName, order.storeName, order.deliveryAddress].some((value) => value.toLowerCase().includes(term));
    return matchesSearch && (filter === "all" || order.status === filter);
  });
  return (
    <section className="surface-card order-table-card">
      <div className="table-toolbar">
        <div><h3>{role === "customer" ? "Your order history" : "All orders"}</h3><p>{filtered.length} {filtered.length === 1 ? "order" : "orders"} {filter !== "all" ? `· ${statusLabel(filter as OrderStatus).toLowerCase()}` : "across the neighbourhood"}</p></div>
        <div className="toolbar-actions"><label className="select-filter"><Filter size={14} /><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All statuses</option>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select><ChevronDown size={14} /></label><button type="button" className="button button-soft button-small" onClick={onRefresh}>Refresh</button></div>
      </div>
      {filtered.length === 0 ? <EmptyState icon={ShoppingBag} title="No orders to show" body={search ? "Try another search or clear your filters." : "Orders will show up here as soon as they come in."} /> : (
        <div className="table-scroll"><table className="data-table orders-table"><thead><tr><th>Order</th><th>{role === "customer" ? "Shop" : "Customer"}</th><th>Placed</th><th>Status</th><th>Total</th><th>Courier</th><th /></tr></thead><tbody>
          {filtered.map((order) => <tr key={order.id}>
            <td><strong className="order-id">{order.orderNumber}</strong><span className="table-sub">{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span></td>
            <td><div className="person-cell">{role === "customer" ? <span className="table-store-emoji">{order.storeName.includes("Market") || order.storeName.includes("Groceries") ? "🧺" : "🍽️"}</span> : <Avatar name={order.customerName} size="small" />}<span><strong>{role === "customer" ? order.storeName : order.customerName}</strong><small>{role === "customer" ? order.deliveryAddress : order.storeName}</small></span></div></td>
            <td><strong>{dateTime(order.createdAt)}</strong><span className="table-sub">{shortDate(order.createdAt)}</span></td>
            <td>{role === "admin" ? <label className="inline-status"><span className={`status-dot status-dot-${order.status}`} /><select value={order.status} aria-label={`Status for ${order.orderNumber}`} onChange={(event) => onStatusChange(order.id, event.target.value as OrderStatus)}>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select><ChevronDown size={12} /></label> : <StatusBadge status={order.status} />}</td>
            <td><strong>{money(order.total)}</strong><span className="table-sub">{order.paymentMethod}</span></td>
            <td>{role === "admin" ? <label className="inline-status courier-select"><span className={`status-dot ${order.driverId ? "status-dot-picked_up" : "status-dot-pending"}`} /><select value={order.driverId ?? ""} aria-label={`Courier for ${order.orderNumber}`} disabled={["delivered", "cancelled"].includes(order.status)} onChange={(event) => onAssignDriver(order.id, event.target.value || null)}><option value="">Unassigned</option>{drivers.filter((driver) => driver.isActive).map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}</select><ChevronDown size={12} /></label> : order.driverName ? <div className="driver-cell"><Avatar name={order.driverName} size="small" /><span>{order.driverName}</span></div> : <span className="unassigned-text">{role === "customer" ? "Finding a rider" : "Unassigned"}</span>}</td>
            <td><div className="row-actions">{role === "customer" && ["pending", "confirmed"].includes(order.status) && <button type="button" className="text-button danger-text" onClick={() => onCancel(order)}>Cancel</button>}{role === "admin" && <button type="button" className="icon-button row-delete" aria-label={`Delete ${order.orderNumber}`} onClick={() => onDelete(order)}><Trash2 size={15} /></button>}</div></td>
          </tr>)}
        </tbody></table></div>
      )}
    </section>
  );
}

function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={22} /></span><strong>{title}</strong><p>{body}</p>{action}</div>;
}

export default function DashboardApp() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [team, setTeam] = useState<UserRecord[]>([]);
  const [view, setView] = useState<View>("overview");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [dialogSaving, setDialogSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [browseCategory, setBrowseCategory] = useState("Everything");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartStoreId, setCartStoreId] = useState<string | null>(null);
  const [driverTab, setDriverTab] = useState<"available" | "active" | "completed">("available");
  const [profileSaving, setProfileSaving] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [demoMode, setDemoMode] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3400);
  }, []);

  const applyWorkspace = useCallback((data: WorkspaceData, role: Role) => {
    setOrders(data.orders);
    setStores(data.stores);
    setProducts(data.products);
    setTeam(data.users);
    if (role === "admin") {
      // Keep the merchant panel pointed at a shop that still exists.
      setSelectedStoreId((current) => (current && data.stores.some((store) => store.id === current) ? current : data.stores[0]?.id ?? null));
    }
  }, []);

  const loadData = useCallback(async (role: Role, options?: { quiet?: boolean }) => {
    if (!options?.quiet) setDataLoading(true);
    try {
      const data = await getWorkspace(role);
      applyWorkspace(data, role);
      return data;
    } finally {
      if (!options?.quiet) setDataLoading(false);
    }
  }, [applyWorkspace]);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      try {
        const result = await api<{ user: SessionUser | null; demoMode?: boolean; demoAccounts?: DemoAccount[] }>("/api/auth/me");
        if (!mounted) return;
        setDemoMode(Boolean(result.demoMode));
        setDemoAccounts(result.demoAccounts ?? []);
        setUser(result.user);
        if (result.user) {
          const data = await getWorkspace(result.user.role);
          if (mounted) {
            applyWorkspace(data, result.user.role);
            setView(result.user.role === "admin" ? "overview" : result.user.role === "customer" ? "home" : "deliveries");
          }
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setBooting(false);
      }
    }
    void bootstrap();
    return () => { mounted = false; };
  }, [applyWorkspace]);

  // A ticking clock keeps “2m ago” style labels honest without impure renders.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // Keep orders, menus and the rider queue fresh while the tab is visible.
  useEffect(() => {
    if (!user) return;
    const role = user.role;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void loadData(role, { quiet: true }).catch(() => undefined);
    }, 25_000);
    return () => window.clearInterval(timer);
  }, [user, loadData]);

  // ⌘K / Ctrl+K focuses the page search.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function openView(next: View) {
    setView(next);
    setSearch("");
    setMobileOpen(false);
    if (next === "stores" && user?.role === "admin") {
      setSelectedStoreId((current) => (current && stores.some((store) => store.id === current) ? current : stores[0]?.id ?? null));
    } else if (next !== "browse") {
      setSelectedStoreId(null);
    }
  }

  async function handleLogin(email: string, password: string) {
    const result = await api<{ user: SessionUser }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setUser(result.user);
    setView(result.user.role === "admin" ? "overview" : result.user.role === "customer" ? "home" : "deliveries");
    await loadData(result.user.role);
  }

  async function handleDemo(role: Role) {
    const result = await api<{ user: SessionUser }>("/api/auth/demo", { method: "POST", body: JSON.stringify({ role }) });
    setUser(result.user);
    setView(result.user.role === "admin" ? "overview" : result.user.role === "customer" ? "home" : "deliveries");
    await loadData(result.user.role);
  }

  async function handleRegister(details: { name: string; email: string; password: string; city: string }) {
    const result = await api<{ user: SessionUser }>("/api/auth/register", { method: "POST", body: JSON.stringify(details) });
    setUser(result.user);
    setView("home");
    await loadData(result.user.role);
  }

  async function refreshData() {
    if (!user) return;
    try {
      await loadData(user.role);
      notify("Everything is up to date.");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Could not refresh your data.");
    }
  }

  async function logout() {
    await api<{ ok: boolean }>("/api/auth/logout", { method: "POST" }).catch(() => ({ ok: true }));
    setUser(null);
    setOrders([]);
    setStores([]);
    setProducts([]);
    setTeam([]);
    setView("overview");
    setSearch("");
  }

  async function updateOrder(orderId: string, changes: { status?: OrderStatus; accept?: boolean }) {
    const before = orders;
    const nextStatus = changes.status;
    if (nextStatus) setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status: nextStatus, updatedAt: new Date().toISOString() } : order));
    try {
      const result = await api<{ order: OrderRecord }>(`/api/orders/${orderId}`, { method: "PATCH", body: JSON.stringify(changes) });
      setOrders((current) => current.map((order) => order.id === orderId ? result.order : order));
      notify(changes.accept ? "You’ve got this delivery." : `Order updated to ${statusLabel(result.order.status).toLowerCase()}.`);
    } catch (reason) {
      setOrders(before);
      notify(reason instanceof Error ? reason.message : "Could not update that order.");
    }
  }

  async function assignDriver(orderId: string, driverId: string | null) {
    const before = orders;
    const driver = team.find((account) => account.id === driverId);
    setOrders((current) => current.map((order) => order.id === orderId ? {
      ...order,
      driverId,
      driverName: driver?.name ?? null,
      driverPhone: driver?.phone ?? null,
    } : order));
    try {
      const result = await api<{ order: OrderRecord }>(`/api/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ driverId }) });
      setOrders((current) => current.map((order) => order.id === orderId ? result.order : order));
      notify(driver ? `${driver.name} is now handling ${result.order.orderNumber}.` : `Courier removed from ${result.order.orderNumber}.`);
    } catch (reason) {
      setOrders(before);
      notify(reason instanceof Error ? reason.message : "Could not update the courier.");
    }
  }

  async function deleteOrder(order: OrderRecord) {
    if (!window.confirm(`Delete ${order.orderNumber}? This will remove its order lines too.`)) return;
    const before = orders;
    setOrders((current) => current.filter((item) => item.id !== order.id));
    try {
      await api(`/api/orders/${order.id}`, { method: "DELETE" });
      notify(`${order.orderNumber} was removed.`);
    } catch (reason) {
      setOrders(before);
      notify(reason instanceof Error ? reason.message : "Could not remove that order.");
    }
  }

  async function cancelOrder(order: OrderRecord) {
    const before = orders;
    setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: "cancelled" } : item));
    try {
      const result = await api<{ order: OrderRecord }>(`/api/orders/${order.id}`, { method: "PATCH", body: JSON.stringify({ status: "cancelled" }) });
      setOrders((current) => current.map((item) => item.id === order.id ? result.order : item));
      notify(`${order.orderNumber} was cancelled.`);
    } catch (reason) {
      setOrders(before);
      notify(reason instanceof Error ? reason.message : "We couldn't cancel that order.");
    }
  }

  async function toggleProduct(product: ProductRecord) {
    const before = products;
    setProducts((current) => current.map((item) => item.id === product.id ? { ...item, isAvailable: !item.isAvailable } : item));
    try {
      const result = await api<{ product: ProductRecord }>(`/api/products/${product.id}`, { method: "PATCH", body: JSON.stringify({ isAvailable: !product.isAvailable }) });
      setProducts((current) => current.map((item) => item.id === product.id ? result.product : item));
      notify(`${product.name} is now ${result.product.isAvailable ? "available" : "hidden"}.`);
    } catch (reason) {
      setProducts(before);
      notify(reason instanceof Error ? reason.message : "Could not update availability.");
    }
  }

  async function toggleStore(store: StoreRecord) {
    const before = stores;
    setStores((current) => current.map((item) => item.id === store.id ? { ...item, isOpen: !item.isOpen } : item));
    try {
      const result = await api<{ store: StoreRecord }>(`/api/stores/${store.id}`, { method: "PATCH", body: JSON.stringify({ isOpen: !store.isOpen }) });
      setStores((current) => current.map((item) => item.id === store.id ? result.store : item));
      notify(`${store.name} is ${result.store.isOpen ? "open" : "closed"} for orders.`);
    } catch (reason) {
      setStores(before);
      notify(reason instanceof Error ? reason.message : "Could not update this shop.");
    }
  }

  async function toggleDriverAvailability(account: UserRecord | SessionUser) {
    const next = !account.isAvailable;
    if (account.id === user?.id) setUser((current) => current ? { ...current, isAvailable: next } : current);
    setTeam((current) => current.map((item) => item.id === account.id ? { ...item, isAvailable: next } : item));
    try {
      const endpoint = account.id === user?.id ? "/api/auth/me" : `/api/users/${account.id}`;
      const result = await api<{ user: SessionUser | UserRecord }>(endpoint, { method: "PATCH", body: JSON.stringify({ isAvailable: next }) });
      if (result.user.id === user?.id) setUser(result.user as SessionUser);
      setTeam((current) => current.map((item) => item.id === account.id ? { ...item, isAvailable: result.user.isAvailable } : item));
      notify(`You’re ${next ? "online and ready" : "offline"}.`);
    } catch (reason) {
      if (account.id === user?.id) setUser((current) => current ? { ...current, isAvailable: !next } : current);
      setTeam((current) => current.map((item) => item.id === account.id ? { ...item, isAvailable: !next } : item));
      notify(reason instanceof Error ? reason.message : "Could not update availability.");
    }
  }

  async function saveDialog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialog) return;
    const fields = new FormData(event.currentTarget);
    setDialogSaving(true);
    try {
      if (dialog.type === "store") {
        const payload = {
          name: String(fields.get("name") ?? ""), category: String(fields.get("category") ?? ""), location: String(fields.get("location") ?? ""),
          emoji: String(fields.get("emoji") ?? "🍽️"), deliveryFee: Number(fields.get("deliveryFee")), prepTime: String(fields.get("prepTime") ?? "20–30 min"),
        };
        const result = dialog.store
          ? await api<{ store: StoreRecord }>(`/api/stores/${dialog.store.id}`, { method: "PATCH", body: JSON.stringify(payload) })
          : await api<{ store: StoreRecord }>("/api/stores", { method: "POST", body: JSON.stringify(payload) });
        setStores((current) => dialog.store ? current.map((item) => item.id === result.store.id ? result.store : item) : [result.store, ...current]);
        if (!dialog.store) setSelectedStoreId(result.store.id);
        notify(dialog.store ? "Shop details saved." : "Your new shop is open for business.");
      } else if (dialog.type === "product") {
        const payload = {
          storeId: String(fields.get("storeId") ?? ""), name: String(fields.get("name") ?? ""), description: String(fields.get("description") ?? ""),
          category: String(fields.get("category") ?? "Popular"), price: Number(fields.get("price")), stock: Number(fields.get("stock")), emoji: String(fields.get("emoji") ?? "🍲"),
        };
        const result = dialog.product
          ? await api<{ product: ProductRecord }>(`/api/products/${dialog.product.id}`, { method: "PATCH", body: JSON.stringify(payload) })
          : await api<{ product: ProductRecord }>("/api/products", { method: "POST", body: JSON.stringify(payload) });
        setProducts((current) => dialog.product ? current.map((item) => item.id === result.product.id ? result.product : item) : [result.product, ...current]);
        setSelectedStoreId(payload.storeId);
        notify(dialog.product ? "Menu item updated." : "Menu item added.");
      } else if (dialog.type === "user") {
        const payload = {
          name: String(fields.get("name") ?? ""), email: String(fields.get("email") ?? ""), phone: String(fields.get("phone") ?? ""),
          city: String(fields.get("city") ?? ""), ...(String(fields.get("password") ?? "") ? { password: String(fields.get("password")) } : {}),
          ...(!dialog.user ? { role: dialog.accountRole } : {}),
        };
        const result = dialog.user
          ? await api<{ user: UserRecord }>(`/api/users/${dialog.user.id}`, { method: "PATCH", body: JSON.stringify(payload) })
          : await api<{ user: UserRecord }>("/api/users", { method: "POST", body: JSON.stringify(payload) });
        setTeam((current) => dialog.user ? current.map((item) => item.id === result.user.id ? result.user : item) : [result.user, ...current]);
        notify(dialog.user ? "Account details saved." : `${dialog.accountRole === "driver" ? "Driver" : "Customer"} account created.`);
      } else {
        const deliveryAddress = String(fields.get("deliveryAddress") ?? "");
        const paymentMethod = String(fields.get("paymentMethod") ?? "Cash on delivery");
        const items = Object.entries(cart).filter(([, quantity]) => quantity > 0).map(([productId, quantity]) => ({ productId, quantity }));
        const result = await api<{ order: OrderRecord }>("/api/orders", { method: "POST", body: JSON.stringify({ items, deliveryAddress, paymentMethod }) });
        setOrders((current) => [result.order, ...current]);
        setCart({});
        setCartStoreId(null);
        setSelectedStoreId(null);
        setView(user?.role === "customer" ? "orders" : "orders");
        notify(`Order ${result.order.orderNumber} is on its way to the kitchen.`);
      }
      setDialog(null);
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "We couldn't save those changes.");
    } finally {
      setDialogSaving(false);
    }
  }

  async function deleteStore(store: StoreRecord) {
    if (!window.confirm(`Remove ${store.name} and its menu? Existing orders will stay in the history.`)) return;
    const oldStores = stores;
    const oldProducts = products;
    setStores((current) => current.filter((item) => item.id !== store.id));
    setProducts((current) => current.filter((item) => item.storeId !== store.id));
    try {
      await api(`/api/stores/${store.id}`, { method: "DELETE" });
      setSelectedStoreId((current) => (current === store.id ? null : current));
      notify(`${store.name} has been removed.`);
    } catch (reason) {
      setStores(oldStores);
      setProducts(oldProducts);
      notify(reason instanceof Error ? reason.message : "Could not remove this shop.");
    }
  }

  async function deleteProduct(product: ProductRecord) {
    if (!window.confirm(`Remove ${product.name} from the menu?`)) return;
    const previous = products;
    setProducts((current) => current.filter((item) => item.id !== product.id));
    try {
      await api(`/api/products/${product.id}`, { method: "DELETE" });
      notify(`${product.name} was removed.`);
    } catch (reason) {
      setProducts(previous);
      notify(reason instanceof Error ? reason.message : "Could not remove this item.");
    }
  }

  async function reactivateUser(account: UserRecord) {
    const previous = team;
    setTeam((current) => current.map((item) => item.id === account.id ? { ...item, isActive: true } : item));
    try {
      const result = await api<{ user: UserRecord }>(`/api/users/${account.id}`, { method: "PATCH", body: JSON.stringify({ isActive: true }) });
      setTeam((current) => current.map((item) => item.id === account.id ? result.user : item));
      notify(`${account.name} can sign in again.`);
    } catch (reason) {
      setTeam(previous);
      notify(reason instanceof Error ? reason.message : "Could not reactivate this account.");
    }
  }

  async function deleteUser(account: UserRecord) {
    if (!window.confirm(`Deactivate ${account.name}? Their order history will be kept.`)) return;
    const previous = team;
    setTeam((current) => current.map((item) => item.id === account.id ? { ...item, isActive: false, isAvailable: false } : item));
    try {
      await api(`/api/users/${account.id}`, { method: "DELETE" });
      notify(`${account.name} has been deactivated.`);
    } catch (reason) {
      setTeam(previous);
      notify(reason instanceof Error ? reason.message : "Could not deactivate this account.");
    }
  }

  function addToCart(product: ProductRecord) {
    if (product.stock < 1) {
      notify(`${product.name} just sold out. Please pick something else.`);
      return;
    }
    const limit = Math.min(20, product.stock);
    if ((cart[product.id] ?? 0) >= limit) {
      notify(product.stock < 20 ? `Only ${product.stock} × ${product.name} available today.` : "You've reached the order limit for this item.");
      return;
    }
    if (cartStoreId && cartStoreId !== product.storeId && Object.values(cart).some((quantity) => quantity > 0)) {
      const replace = window.confirm("Your basket has items from another shop. Start a new basket here?");
      if (!replace) return;
      setCart({});
    }
    setCartStoreId(product.storeId);
    setCart((current) => ({ ...current, [product.id]: Math.min((current[product.id] ?? 0) + 1, limit) }));
    notify(`${product.name} added to your basket.`);
  }

  function changeQuantity(productId: string, change: number) {
    const stock = products.find((product) => product.id === productId)?.stock ?? 20;
    const limit = Math.min(20, Math.max(0, stock));
    setCart((current) => {
      const quantity = Math.max(0, Math.min(limit, (current[productId] ?? 0) + change));
      const next = { ...current, [productId]: quantity };
      if (Object.values(next).every((value) => value === 0)) setCartStoreId(null);
      return next;
    });
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setProfileSaving(true);
    try {
      const result = await api<{ user: SessionUser }>("/api/auth/me", { method: "PATCH", body: JSON.stringify({ name: form.get("profileName"), phone: form.get("profilePhone"), city: form.get("profileCity") }) });
      setUser(result.user);
      notify("Your profile has been saved.");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Could not save your profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  const cartCount = Object.values(cart).reduce((sum, value) => sum + value, 0);
  const cartStore = stores.find((store) => store.id === cartStoreId);
  const cartSubtotal = products.reduce((sum, product) => sum + product.price * (cart[product.id] ?? 0), 0);
  const currentStore = stores.find((store) => store.id === selectedStoreId);
  const teamDrivers = team.filter((account) => account.role === "driver");
  const teamCustomers = team.filter((account) => account.role === "customer");

  if (booting) return <div className="boot-screen"><span className="brand-mark"><Navigation size={18} fill="currentColor" /></span><span className="boot-word">jotna<span>.</span></span><span className="spinner spinner-dark" /></div>;
  if (!user) return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} onDemo={handleDemo} demoMode={demoMode} demoAccounts={demoAccounts} />;

  const adminNavigation: { label: string; view: View; icon: LucideIcon }[] = [
    { label: "Overview", view: "overview", icon: LayoutDashboard },
    { label: "Orders", view: "orders", icon: ShoppingBag },
    { label: "Stores & menus", view: "stores", icon: StoreIcon },
    { label: "Drivers", view: "drivers", icon: Bike },
    { label: "Customers", view: "customers", icon: Users },
  ];
  const customerNavigation: { label: string; view: View; icon: LucideIcon }[] = [
    { label: "My home", view: "home", icon: Home },
    { label: "Browse nearby", view: "browse", icon: StoreIcon },
    { label: "My orders", view: "orders", icon: ShoppingBag },
    { label: "My profile", view: "profile", icon: Settings },
  ];
  const driverNavigation: { label: string; view: View; icon: LucideIcon }[] = [
    { label: "My deliveries", view: "deliveries", icon: Bike },
    { label: "My profile", view: "profile", icon: Settings },
  ];
  const navigation = user.role === "admin" ? adminNavigation : user.role === "customer" ? customerNavigation : driverNavigation;
  const pageTitle: Record<View, string> = {
    overview: "Overview", orders: user.role === "customer" ? "My orders" : "Orders", stores: "Stores & menus", drivers: "Drivers", customers: "Customers",
    home: "Home", browse: "Browse nearby", deliveries: "My deliveries", profile: "My profile",
  };
  const weeklyDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    const count = orders.filter((order) => {
      const date = new Date(order.createdAt);
      return date.getFullYear() === day.getFullYear() && date.getMonth() === day.getMonth() && date.getDate() === day.getDate() && order.status !== "cancelled";
    }).length;
    return { label: day.toLocaleDateString("en-GB", { weekday: "short" }), count, key };
  });
  const peakOrders = Math.max(...weeklyDays.map((day) => day.count), 3);
  const chartPoints = weeklyDays.map((day, index) => `${42 + index * 82},${155 - (day.count / peakOrders) * 106}`).join(" ");
  const chartLine = `M ${chartPoints.replaceAll(" ", " L ")}`;
  const chartArea = `${chartLine} L 534,180 L 42,180 Z`;
  const weekOrders = orders.filter((order) => now - new Date(order.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000 && order.status !== "cancelled");
  const weekVolume = weekOrders.reduce((sum, order) => sum + order.total, 0);
  const activeOrders = orders.filter(orderIsActive);
  const availableDrivers = teamDrivers.filter((driver) => driver.isAvailable && driver.isActive).length;
  const currentCustomerOrders = orders.filter((order) => order.customerId === user.id);
  const openOrders = orders.filter((order) => !order.driverId && ["pending", "confirmed", "ready"].includes(order.status));
  const myDeliveries = orders.filter((order) => order.driverId === user.id);
  const driverActive = myDeliveries.filter(orderIsActive);
  const delivered = myDeliveries.filter((order) => order.status === "delivered");
  const weeklyEarnings = delivered.filter((order) => now - new Date(order.updatedAt).getTime() < 7 * 24 * 60 * 60 * 1000).reduce((sum, order) => sum + order.deliveryFee, 0);
  const activeStore = cartStore ?? currentStore;
  const storeProducts = products.filter((product) => product.storeId === currentStore?.id);
  const filteredStoreProducts = storeProducts.filter((product) => !search || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(search.toLowerCase()));
  const visibleStores = stores.filter((store) => {
    const term = search.trim().toLowerCase();
    const categoryMatch = browseCategory === "Everything" || (browseCategory === "Restaurants" && ["Gambian favourites", "Seafood & grill"].includes(store.category)) || (browseCategory === "Groceries" && (store.category.toLowerCase().includes("grocer") || store.category.toLowerCase().includes("produce") || store.category.toLowerCase().includes("market"))) || (browseCategory === "Coffee & bakery" && store.category.toLowerCase().includes("coffee"));
    return categoryMatch && (!term || `${store.name} ${store.category} ${store.location}`.toLowerCase().includes(term));
  });
  const storesByOrders = [...stores].map((store) => ({ store, count: orders.filter((order) => order.storeId === store.id).length })).sort((a, b) => b.count - a.count).slice(0, 3);

  return (
    <div className="app-frame">
      {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand-row"><a href="#" className="brand brand-light"><span className="brand-mark"><Navigation size={17} fill="currentColor" /></span><span>jotna<span className="brand-period">.</span></span></a><button className="icon-button mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={19} /></button></div>
        <div className="sidebar-location"><span className="location-icon"><MapPin size={14} /></span><span><strong>GREATER BANJUL</strong><small>Delivery zone · The Gambia</small></span><span className="online-pulse" /></div>
        {demoMode && <div className="demo-ribbon"><span>DEMO</span> Sample data you can play with</div>}
        <div className="nav-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            return <button type="button" key={item.view} className={`nav-link ${view === item.view ? "nav-link-active" : ""}`} onClick={() => openView(item.view)}><Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>{item.view === "orders" && user.role === "admin" && activeOrders.length > 0 && <span className="nav-count">{activeOrders.length}</span>}</button>;
          })}
        </nav>
        {user.role === "driver" && <div className="sidebar-online-card"><div><span className={`online-dot ${user.isAvailable ? "" : "offline-dot"}`} /><strong>{user.isAvailable ? "You’re online" : "You’re offline"}</strong></div><p>{user.isAvailable ? "Ready for your next delivery." : "Go online to see nearby orders."}</p><button type="button" className={`button ${user.isAvailable ? "button-outline-light" : "button-lime"} button-small button-full`} onClick={() => void toggleDriverAvailability(user)}>{user.isAvailable ? "Go offline" : "Go online"}</button></div>}
        <div className="sidebar-bottom">
          <div className="sidebar-help"><span className="help-spark">✳</span><div><strong>Here for the neighbourhood</strong><small>Delivering across the coast</small></div><ArrowRight size={15} /></div>
          <div className="sidebar-profile"><Avatar name={user.name} color={user.role === "driver" ? "blue" : user.role === "customer" ? "coral" : "lime"} /><span className="sidebar-profile-info"><strong>{user.name}</strong><small>{user.role === "admin" ? "Workspace admin" : user.role === "driver" ? "Delivery partner" : "Jotna customer"}</small></span><button type="button" className="logout-button" aria-label="Sign out" onClick={() => void logout()}><LogOut size={16} /></button></div>
        </div>
      </aside>

      <main className="main-workspace">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="topbar-page"><span className="topbar-home">Jotna</span><ChevronRight size={14} /><strong>{pageTitle[view]}</strong></div>
          <div className="topbar-spacer" />
          <label className="global-search"><Search size={16} /><input ref={searchRef} aria-label="Search this page" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={user.role === "customer" && view === "browse" ? "Find a local favourite…" : "Search this page…"} /><kbd>⌘ K</kbd></label>
          <div className="topbar-divider" />
          <button className="topbar-zone" type="button" onClick={() => notify("Serving Greater Banjul, from Bakau to Brikama.")}><MapPin size={16} /><span><small>DELIVERING IN</small><strong>Greater Banjul</strong></span><ChevronDown size={13} /></button>
          <button type="button" className="notification-button" aria-label="Notifications" onClick={() => notify("You’re all caught up — nothing new to report.")}><Bell size={18} /><i /></button>
          {user.role === "customer" && <button type="button" className="topbar-cart" aria-label={`Open basket with ${cartCount} items`} onClick={() => { if (cartStore) setDialog({ type: "checkout", store: cartStore }); else setView("browse"); }}><ShoppingCart size={17} />{cartCount > 0 && <span>{cartCount}</span>}</button>}
          {user.role === "admin" && <button type="button" className="button button-dark topbar-action" onClick={() => setDialog({ type: "store" })}><Plus size={16} /> Add a shop</button>}
        </header>

        <div className="page-content">
          {dataLoading && <div className="loading-strip"><span className="spinner spinner-dark" /> Syncing your workspace…</div>}

          {view === "overview" && user.role === "admin" && <>
            <div className="page-heading heading-with-date"><div><span className="eyebrow"><span className="eyebrow-dot" /> YOUR NEIGHBOURHOOD AT A GLANCE</span><h1>{greeting()}, Jotna <span className="wave-hand">✳</span></h1><p>Here’s what’s happening around Greater Banjul today.</p></div><div className="date-chip"><CalendarDays size={16} />{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div></div>
            <section className="welcome-banner"><div className="welcome-banner-copy"><span className="banner-kicker"><span /> LIVE IN THE NEIGHBOURHOOD</span><h2>Good things are moving.</h2><p>Keep the coast connected. Your delivery pulse is looking healthy today.</p><button className="button button-lime" type="button" onClick={() => setView("orders")}>View live orders <ArrowRight size={16} /></button></div><div className="banner-stats"><div className="banner-orbit orbit-one" /><div className="banner-orbit orbit-two" /><span className="banner-icon banner-icon-one">🍲</span><span className="banner-icon banner-icon-two">🥭</span><span className="banner-icon banner-icon-three">🛵</span><div className="banner-stat-pill"><span className="online-pulse" /><span><strong>{activeOrders.length} live orders</strong><small>Across Greater Banjul</small></span></div></div><div className="banner-decoration">✳</div></section>
            <section className="metrics-grid">
              <MetricCard label="Weekly order value" value={money(weekVolume)} note="Across the last 7 days" icon={CircleDollarSign} tone="green" trend={`${weekOrders.length} orders`} />
              <MetricCard label="Orders this week" value={String(weekOrders.length)} note={`${orders.filter((order) => order.status === "delivered").length} delivered so far`} icon={ShoppingBag} tone="peach" trend="Live" />
              <MetricCard label="Active deliveries" value={String(activeOrders.length)} note="Orders on the move" icon={Bike} tone="blue" />
              <MetricCard label="Couriers available" value={`${availableDrivers} / ${teamDrivers.length}`} note="Ready across the zone" icon={Users} tone="yellow" />
            </section>
            <section className="overview-grid">
              <article className="surface-card chart-card"><div className="section-card-head"><div><h3>Neighbourhood pulse</h3><p>Orders placed over the last 7 days</p></div><span className="chart-period"><span className="legend-dot" /> Orders <ChevronDown size={14} /></span></div><div className="chart-total"><strong>{weekOrders.length}</strong><span>orders<br />this week</span><span className="chart-growth"><ArrowUpRight size={14} /> Keeping things local</span></div><div className="chart-area"><div className="chart-guides"><span /><span /><span /></div><svg viewBox="0 0 576 200" preserveAspectRatio="none" role="img" aria-label="Order activity over the past seven days"><defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#82b987" stopOpacity=".24" /><stop offset="100%" stopColor="#82b987" stopOpacity="0" /></linearGradient></defs><path d={chartArea} fill="url(#chart-fill)" /><path d={chartLine} fill="none" stroke="#36764d" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />{weeklyDays.map((day, index) => { const x = 42 + index * 82; const y = 155 - (day.count / peakOrders) * 106; return <circle key={day.key} cx={x} cy={y} r="4" fill="#fff" stroke="#36764d" strokeWidth="2.5" />; })}</svg></div><div className="chart-labels">{weeklyDays.map((day) => <span key={day.key}>{day.label}</span>)}</div></article>
              <article className="surface-card quick-card"><div className="section-card-head"><div><h3>Local favourites</h3><p>Shops making the most moves</p></div><button type="button" className="text-button" onClick={() => setView("stores")}>See all <ArrowRight size={14} /></button></div><div className="favourite-list">{storesByOrders.map(({ store, count }, index) => <div className="favourite-row" key={store.id}><span className={`rank rank-${index + 1}`}>0{index + 1}</span><span className="favourite-emoji">{store.emoji}</span><span className="favourite-info"><strong>{store.name}</strong><small>{store.location} · {store.category}</small></span><span className="favourite-orders">{count}<small>orders</small></span></div>)}</div><button className="quick-manage" type="button" onClick={() => setView("stores")}><span><StoreIcon size={16} /> Manage your local partners</span><ArrowRight size={15} /></button></article>
            </section>
            <section className="surface-card recent-card"><div className="section-card-head"><div><h3>Latest orders</h3><p>The latest activity from around the coast</p></div><button type="button" className="button button-soft button-small" onClick={() => setView("orders")}>All orders <ArrowRight size={14} /></button></div>{orders.length === 0 ? <EmptyState icon={ShoppingBag} title="The first order is just around the corner" body="When someone orders from a local shop, you’ll see it here." /> : <div className="table-scroll"><table className="data-table recent-table"><thead><tr><th>Order</th><th>Customer</th><th>Local shop</th><th>Courier</th><th>Status</th><th>Total</th></tr></thead><tbody>{orders.slice(0, 5).map((order) => <tr key={order.id}><td><strong className="order-id">{order.orderNumber}</strong><span className="table-sub">{humanTime(order.createdAt)}</span></td><td><div className="driver-cell"><Avatar name={order.customerName} size="small" /><span>{order.customerName}</span></div></td><td><strong>{order.storeName}</strong></td><td>{order.driverName ? <div className="driver-cell"><Avatar name={order.driverName} size="small" /><span>{order.driverName}</span></div> : <span className="unassigned-text">Finding a rider</span>}</td><td><StatusBadge status={order.status} /></td><td><strong>{money(order.total)}</strong></td></tr>)}</tbody></table></div>}</section>
            <div className="page-footnote"><span className="online-pulse" /> All systems running smoothly <span>·</span> Prices shown in Gambian Dalasi (GMD)</div>
          </>}

          {view === "orders" && <>
            <div className="page-heading"><div><span className="eyebrow"><span className="eyebrow-dot" /> {user.role === "customer" ? "YOUR JOTNA JOURNEY" : "KEEP THINGS MOVING"}</span><h1>{user.role === "customer" ? "Your orders" : "Order central"}</h1><p>{user.role === "customer" ? "Every local favourite, from the first tap to the front door." : "Track every order, rider and local favourite in one place."}</p></div>{user.role === "customer" && <button type="button" className="button button-dark" onClick={() => { setView("browse"); setSelectedStoreId(null); }}><Plus size={16} /> Order something good</button>}</div>
            <div className="order-summary-strip"><div><span className="summary-icon summary-green"><ShoppingBag size={17} /></span><span><strong>{orders.length}</strong><small>Total orders</small></span></div><div><span className="summary-icon summary-peach"><Clock3 size={17} /></span><span><strong>{orders.filter(orderIsActive).length}</strong><small>In progress</small></span></div><div><span className="summary-icon summary-blue"><CheckCircle2 size={17} /></span><span><strong>{orders.filter((order) => order.status === "delivered").length}</strong><small>Delivered</small></span></div><div className="summary-note"><span className="online-pulse" /> Updated in real time</div></div>
            <OrderTable orders={orders} role={user.role} search={search} drivers={teamDrivers} onStatusChange={(id, status) => void updateOrder(id, { status })} onAssignDriver={(id, driverId) => void assignDriver(id, driverId)} onDelete={(order) => void deleteOrder(order)} onCancel={(order) => void cancelOrder(order)} onRefresh={() => void refreshData()} />
          </>}

          {view === "stores" && user.role === "admin" && <>
            <div className="page-heading"><div><span className="eyebrow"><span className="eyebrow-dot" /> GOOD FOOD, GOOD PEOPLE</span><h1>Local shops & menus</h1><p>Keep the neighbourhood favourites close and their menus fresh.</p></div><button type="button" className="button button-dark" onClick={() => setDialog({ type: "store" })}><Plus size={16} /> Add a shop</button></div>
            <div className="store-summary-grid"><div className="store-summary"><span className="store-summary-icon store-icon-green"><StoreIcon size={19} /></span><span><small>LOCAL PARTNERS</small><strong>{stores.length}</strong></span></div><div className="store-summary"><span className="store-summary-icon store-icon-peach"><Utensils size={18} /></span><span><small>MENU ITEMS</small><strong>{products.length}</strong></span></div><div className="store-summary"><span className="store-summary-icon store-icon-blue"><CheckCircle2 size={18} /></span><span><small>OPEN RIGHT NOW</small><strong>{stores.filter((store) => store.isOpen).length}</strong></span></div><div className="store-summary-tip"><span>✳</span><p>Every shop is a neighbour.<br /><strong>Thanks for keeping it local.</strong></p></div></div>
            {stores.length === 0 ? <EmptyState icon={StoreIcon} title="Your neighbourhood is ready" body="Add the first restaurant or grocery shop to get things moving." action={<button className="button button-dark" type="button" onClick={() => setDialog({ type: "store" })}><Plus size={15} /> Add your first shop</button>} /> : <div className="merchant-layout"><aside className="merchant-sidebar"><div className="merchant-list-heading"><div><strong>Your partners</strong><small>{stores.length} shops in the zone</small></div><button type="button" className="icon-button mini-add" aria-label="Add shop" onClick={() => setDialog({ type: "store" })}><Plus size={16} /></button></div>{stores.map((store) => <div className={`merchant-choice ${selectedStoreId === store.id ? "merchant-choice-active" : ""}`} key={store.id} onClick={() => setSelectedStoreId(store.id)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") setSelectedStoreId(store.id); }}><span className="merchant-choice-emoji">{store.emoji}</span><span className="merchant-choice-copy"><strong>{store.name}</strong><small>{store.location} · {products.filter((product) => product.storeId === store.id).length} items</small></span><span className={`merchant-open-dot ${store.isOpen ? "" : "merchant-closed-dot"}`} /></div>)}</aside><section className="surface-card merchant-detail">{currentStore ? <><div className="merchant-detail-head"><div className="merchant-detail-identity"><span className="merchant-hero-emoji">{currentStore.emoji}</span><div><h3>{currentStore.name}</h3><p><MapPin size={13} /> {currentStore.location} <span>·</span> {currentStore.category}</p><div className="merchant-meta"><span className={`store-open-pill ${currentStore.isOpen ? "" : "store-closed-pill"}`}><span />{currentStore.isOpen ? "Open for orders" : "Temporarily closed"}</span><span><Star size={13} fill="currentColor" /> {currentStore.rating}</span><span><Clock3 size={13} /> {currentStore.prepTime}</span><span>Delivery {money(currentStore.deliveryFee)}</span></div></div></div><div className="merchant-detail-actions"><button className="icon-button" type="button" aria-label="Edit shop" onClick={() => setDialog({ type: "store", store: currentStore })}><Pencil size={16} /></button><button className="icon-button row-delete" type="button" aria-label="Delete shop" onClick={() => void deleteStore(currentStore)}><Trash2 size={16} /></button></div></div><div className="menu-toolbar"><div><h4>Menu & inventory <span>{filteredStoreProducts.length}</span></h4><p>Prices are shown in Gambian Dalasi.</p></div><button type="button" className="button button-dark button-small" onClick={() => setDialog({ type: "product", storeId: currentStore.id })}><Plus size={15} /> Add item</button></div>{filteredStoreProducts.length === 0 ? <EmptyState icon={Utensils} title="No menu items here yet" body="Add a product or dish so customers can start ordering." action={<button type="button" className="button button-dark button-small" onClick={() => setDialog({ type: "product", storeId: currentStore.id })}><Plus size={14} /> Add a menu item</button>} /> : <div className="table-scroll"><table className="data-table menu-table"><thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Stock</th><th>Available</th><th /></tr></thead><tbody>{filteredStoreProducts.map((product) => <tr key={product.id}><td><div className="product-cell"><span className="product-emoji">{product.emoji}</span><span><strong>{product.name}</strong><small>{product.description || "No description"}</small></span></div></td><td><span className="category-chip">{product.category}</span></td><td><strong>{money(product.price)}</strong></td><td><span className={product.stock < 5 ? "stock-low" : "stock-good"}>{product.stock} in stock</span></td><td><Toggle checked={product.isAvailable} label={`Availability for ${product.name}`} onChange={() => void toggleProduct(product)} /></td><td><div className="row-actions"><button className="icon-button" aria-label={`Edit ${product.name}`} type="button" onClick={() => setDialog({ type: "product", product })}><Pencil size={15} /></button><button className="icon-button row-delete" aria-label={`Delete ${product.name}`} type="button" onClick={() => void deleteProduct(product)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}</> : <EmptyState icon={StoreIcon} title="Choose a local partner" body="Select a shop on the left to manage its menu." />}</section></div>}
          </>}

          {view === "drivers" && user.role === "admin" && <>
            <div className="page-heading"><div><span className="eyebrow"><span className="eyebrow-dot" /> THE PEOPLE BEHIND THE DELIVERY</span><h1>Your delivery crew</h1><p>Meet the local riders getting good things to every doorstep.</p></div><button type="button" className="button button-dark" onClick={() => setDialog({ type: "user", accountRole: "driver" })}><Plus size={16} /> Add a driver</button></div>
            <div className="driver-metrics"><div className="driver-metric"><span className="metric-icon metric-blue"><Bike size={18} /></span><span><small>ALL DRIVERS</small><strong>{teamDrivers.length}</strong></span></div><div className="driver-metric"><span className="metric-icon metric-green"><Navigation size={18} /></span><span><small>ONLINE NOW</small><strong>{availableDrivers}</strong></span></div><div className="driver-metric"><span className="metric-icon metric-peach"><Package size={18} /></span><span><small>ACTIVE DELIVERIES</small><strong>{orders.filter((order) => order.driverId && orderIsActive(order)).length}</strong></span></div><div className="driver-metric-help"><span>🛵</span><div><strong>Made for the road.</strong><small>Supporting local riders, every day.</small></div></div></div>
            {teamDrivers.length === 0 ? <EmptyState icon={Bike} title="Your crew starts here" body="Add the first delivery partner so orders can reach every doorstep." action={<button className="button button-dark" type="button" onClick={() => setDialog({ type: "user", accountRole: "driver" })}><Plus size={15} /> Add a driver</button>} /> : <section className="surface-card people-card"><div className="section-card-head"><div><h3>Delivery partners</h3><p>Availability and active routes</p></div><button className="button button-soft button-small" type="button" onClick={() => void refreshData()}>Refresh list</button></div><div className="table-scroll"><table className="data-table people-table"><thead><tr><th>Driver</th><th>Area</th><th>Contact</th><th>Availability</th><th>Active deliveries</th><th>Account</th><th /></tr></thead><tbody>{teamDrivers.filter((driver) => !search || `${driver.name} ${driver.city} ${driver.email}`.toLowerCase().includes(search.toLowerCase())).map((driver) => <tr key={driver.id} className={!driver.isActive ? "row-inactive" : ""}><td><div className="person-cell"><Avatar name={driver.name} color="blue" /><span><strong>{driver.name}</strong><small>{driver.email}</small></span></div></td><td><span className="location-cell"><MapPin size={13} />{driver.city}</span></td><td><span className="contact-cell">{driver.phone || "—"}</span></td><td><span className={`availability-pill ${driver.isAvailable && driver.isActive ? "availability-on" : "availability-off"}`}><span />{driver.isActive ? driver.isAvailable ? "Online" : "Offline" : "Inactive"}</span></td><td><span className="table-number">{orders.filter((order) => order.driverId === driver.id && orderIsActive(order)).length}</span></td><td><span className={`account-state ${driver.isActive ? "account-active" : "account-disabled"}`}>{driver.isActive ? "Active" : "Deactivated"}</span></td><td><div className="row-actions"><button type="button" className="icon-button" aria-label={`Edit ${driver.name}`} onClick={() => setDialog({ type: "user", accountRole: "driver", user: driver })}><Pencil size={15} /></button>{driver.isActive ? <button type="button" className="icon-button row-delete" aria-label={`Deactivate ${driver.name}`} onClick={() => void deleteUser(driver)}><Trash2 size={15} /></button> : <button type="button" className="icon-button" aria-label={`Reactivate ${driver.name}`} onClick={() => void reactivateUser(driver)}><CheckCircle2 size={15} /></button>}</div></td></tr>)}</tbody></table></div></section>}
          </>}

          {view === "customers" && user.role === "admin" && <>
            <div className="page-heading"><div><span className="eyebrow"><span className="eyebrow-dot" /> THE NEIGHBOURHOOD WE SERVE</span><h1>Our customers</h1><p>Every delivery brings The Gambia a little closer together.</p></div><button type="button" className="button button-dark" onClick={() => setDialog({ type: "user", accountRole: "customer" })}><Plus size={16} /> Add a customer</button></div>
            <div className="customer-banner"><div className="customer-banner-icon">💚</div><div><strong>{teamCustomers.filter((customer) => customer.isActive).length} neighbours and counting</strong><p>Thanks for helping local businesses feel a little more connected.</p></div><span className="customer-banner-flag">🇬🇲</span></div>
            {teamCustomers.length === 0 ? <EmptyState icon={Users} title="Your first neighbour is waiting" body="Create an account for a customer and help them discover local shops." action={<button type="button" className="button button-dark" onClick={() => setDialog({ type: "user", accountRole: "customer" })}><Plus size={15} /> Add a customer</button>} /> : <section className="surface-card people-card"><div className="section-card-head"><div><h3>Customer directory</h3><p>Contact details, neighbourhoods and order history</p></div><span className="directory-count"><Users size={15} /> {teamCustomers.length} accounts</span></div><div className="table-scroll"><table className="data-table people-table"><thead><tr><th>Customer</th><th>Neighbourhood</th><th>Phone</th><th>Orders</th><th>Lifetime value</th><th>Account</th><th /></tr></thead><tbody>{teamCustomers.filter((customer) => !search || `${customer.name} ${customer.city} ${customer.email}`.toLowerCase().includes(search.toLowerCase())).map((customer) => { const customerOrders = orders.filter((order) => order.customerId === customer.id); return <tr key={customer.id} className={!customer.isActive ? "row-inactive" : ""}><td><div className="person-cell"><Avatar name={customer.name} color="coral" /><span><strong>{customer.name}</strong><small>{customer.email}</small></span></div></td><td><span className="location-cell"><MapPin size={13} />{customer.city}</span></td><td><span className="contact-cell">{customer.phone || "—"}</span></td><td><span className="table-number">{customerOrders.length}</span></td><td><strong>{money(customerOrders.reduce((sum, order) => sum + order.total, 0))}</strong></td><td><span className={`account-state ${customer.isActive ? "account-active" : "account-disabled"}`}>{customer.isActive ? "Active" : "Deactivated"}</span></td><td><div className="row-actions"><button type="button" className="icon-button" aria-label={`Edit ${customer.name}`} onClick={() => setDialog({ type: "user", accountRole: "customer", user: customer })}><Pencil size={15} /></button>{customer.isActive ? <button type="button" className="icon-button row-delete" aria-label={`Deactivate ${customer.name}`} onClick={() => void deleteUser(customer)}><Trash2 size={15} /></button> : <button type="button" className="icon-button" aria-label={`Reactivate ${customer.name}`} onClick={() => void reactivateUser(customer)}><CheckCircle2 size={15} /></button>}</div></td></tr>; })}</tbody></table></div></section>}
          </>}

          {view === "home" && user.role === "customer" && <>
            <div className="customer-welcome"><div><span className="eyebrow"><span className="eyebrow-dot" /> GOOD TO HAVE YOU BACK</span><h1>{greeting()}, {user.name.split(" ")[0]} <span className="wave-hand">✳</span></h1><p>Something delicious or useful is just around the corner.</p></div><div className="home-location-chip"><MapPin size={15} /><span>Delivering to <strong>{user.city || "Greater Banjul"}</strong></span><ChevronDown size={13} /></div></div>
            <section className="customer-hero"><div className="customer-hero-copy"><span className="banner-kicker"><span /> THE NEIGHBOURHOOD IS OPEN</span><h2>Good food. Good finds.<br /><em>Good to go.</em></h2><p>Your local favourites, delivered with a little extra care.</p><button className="button button-lime" type="button" onClick={() => { setView("browse"); setSelectedStoreId(null); }}>Find your favourite <ArrowRight size={16} /></button></div><div className="customer-hero-art"><span className="customer-art-sun" /><span className="customer-art-orbit" /><div className="customer-art-bag">🧺</div><span className="customer-art-food">🍊</span><span className="customer-art-plate">🍛</span><span className="customer-art-note">Made nearby<br /><strong>with love</strong></span><span className="customer-hero-spark">✳</span></div></section>
            <div className="home-stats"><div><span className="summary-icon summary-peach"><ShoppingBag size={17} /></span><span><strong>{currentCustomerOrders.length}</strong><small>orders with Jotna</small></span></div><span className="home-stat-divider" /><div><span className="summary-icon summary-green"><Bike size={17} /></span><span><strong>{currentCustomerOrders.filter(orderIsActive).length}</strong><small>on their way</small></span></div><button type="button" className="text-button" onClick={() => setView("orders")}>See all orders <ArrowRight size={14} /></button></div>
            <div className="section-title-row"><div><h2>Made for your neighbourhood</h2><p>Restaurants, markets and little pick-me-ups nearby.</p></div><button type="button" className="text-button" onClick={() => { setView("browse"); setSelectedStoreId(null); }}>Explore all <ArrowRight size={14} /></button></div>
            {stores.length === 0 ? <EmptyState icon={StoreIcon} title="We’re setting the table" body="Local shops will show here soon." /> : <div className="store-card-grid">{stores.slice(0, 3).map((store, index) => <StoreCard key={store.id} store={store} productCount={products.filter((product) => product.storeId === store.id).length} onClick={() => { setSelectedStoreId(store.id); setView("browse"); }} featured={index === 0} />)}</div>}
            <div className="section-title-row recent-customer-heading"><div><h2>Coming your way</h2><p>Your latest Jotna moments.</p></div><button type="button" className="text-button" onClick={() => setView("orders")}>Order history <ArrowRight size={14} /></button></div>
            {currentCustomerOrders.length ? <div className="customer-order-list">{currentCustomerOrders.slice(0, 2).map((order) => <CustomerOrderCard key={order.id} order={order} onCancel={() => void cancelOrder(order)} />)}</div> : <EmptyState icon={ShoppingBag} title="Your first order is a good one" body="Browse local shops to find something you love." action={<button type="button" className="button button-dark button-small" onClick={() => setView("browse")}>Browse nearby <ArrowRight size={14} /></button>} />}
          </>}

          {view === "browse" && <>
            {!currentStore ? <>
              <div className="browse-heading"><div><span className="eyebrow"><span className="eyebrow-dot" /> PICKED CLOSE TO HOME</span><h1>Good things, nearby.</h1><p>Independent favourites around Greater Banjul, ready when you are.</p></div><div className="browse-map-pill"><MapPin size={15} /><span>Greater Banjul, The Gambia</span><ChevronDown size={13} /></div></div>
              <div className="browse-category-row">{[{ label: "Everything", icon: Leaf }, { label: "Restaurants", icon: Utensils }, { label: "Groceries", icon: Carrot }, { label: "Coffee & bakery", icon: Coffee }].map(({ label, icon: Icon }) => <button key={label} type="button" className={`category-button ${browseCategory === label ? "category-active" : ""}`} onClick={() => setBrowseCategory(label)}><Icon size={16} />{label}</button>)}</div>
              <div className="browse-section-heading"><div><h2>{browseCategory === "Everything" ? "The local line-up" : browseCategory}</h2><p>{visibleStores.length} neighbourhood favourites, all in one place.</p></div><span className="browse-sort"><span className="online-pulse" /> Taking orders now</span></div>
              {visibleStores.length === 0 ? <EmptyState icon={Search} title="No local favourites found" body="Try a different search or category." action={<button type="button" className="text-button" onClick={() => { setSearch(""); setBrowseCategory("Everything"); }}>Clear search</button>} /> : <div className="store-card-grid browse-store-grid">{visibleStores.map((store, index) => <StoreCard key={store.id} store={store} productCount={products.filter((product) => product.storeId === store.id).length} onClick={() => setSelectedStoreId(store.id)} featured={index === 0} />)}</div>}
              <div className="browse-promise"><span>🇬🇲</span><span><strong>Every order makes a local difference.</strong><small>Thanks for supporting shops and riders from around the corner.</small></span><span className="promise-spark">✳</span></div>
            </> : <>
              <button type="button" className="back-link" onClick={() => setSelectedStoreId(null)}><ChevronLeft size={16} /> All neighbourhood favourites</button>
              <div className="store-detail-banner"><div className="store-detail-image">{currentStore.emoji}<span>✳</span><i>✽</i></div><div className="store-detail-copy"><span className="eyebrow"><span className="eyebrow-dot" /> A LOCAL FAVOURITE</span><h1>{currentStore.name}</h1><p>{currentStore.category} · {currentStore.location}</p><div className="store-detail-facts"><span><Star size={14} fill="currentColor" /> {currentStore.rating} rating</span><span><Clock3 size={14} /> {currentStore.prepTime}</span><span><Bike size={14} /> Delivery {money(currentStore.deliveryFee)}</span></div></div><span className={`store-open-pill ${currentStore.isOpen ? "" : "store-closed-pill"}`}><span />{currentStore.isOpen ? "Open now" : "Closed"}</span></div>
              <div className="store-menu-heading"><div><span className="eyebrow"><span className="eyebrow-dot" /> MADE WITH CARE</span><h2>Good things on the menu</h2><p>Pick a favourite to add it to your basket.</p></div>{cartCount > 0 && <button type="button" className="button button-dark" onClick={() => setDialog({ type: "checkout", store: currentStore })}><ShoppingCart size={16} /> Basket · {cartCount} <span>{money(cartSubtotal + currentStore.deliveryFee)}</span><ArrowRight size={15} /></button>}</div>
              {filteredStoreProducts.length === 0 ? <EmptyState icon={Utensils} title="A little quiet in the kitchen" body="There are no available menu items here just yet." /> : <div className="product-card-grid">{filteredStoreProducts.filter((product) => product.isAvailable).map((product) => <article className={`browse-product-card ${product.stock === 0 ? "product-sold-out" : ""}`} key={product.id}><div className="browse-product-illustration"><span>{product.emoji}</span><span className="product-heart" aria-hidden="true">✳</span><span className="product-category">{product.category}</span></div><div className="browse-product-content"><h3>{product.name}</h3><p>{product.description || "Freshly prepared by your local favourite."}</p><div className="browse-product-bottom"><strong>{money(product.price)}</strong>{product.stock === 0 ? <span className="product-stock product-stock-out">Sold out</span> : product.stock <= 5 ? <span className="product-stock">Only {product.stock} left</span> : null}{product.stock === 0 ? <button type="button" className="add-product-button" disabled aria-label={`${product.name} is sold out`}><X size={16} /></button> : <button type="button" className="add-product-button" aria-label={`Add ${product.name} to basket`} onClick={() => addToCart(product)}><Plus size={17} /></button>}</div></div></article>)}</div>}
            </>}
          </>}

          {view === "deliveries" && user.role === "driver" && <>
            <div className="driver-page-heading"><div><span className="eyebrow"><span className="eyebrow-dot" /> YOUR NEIGHBOURHOOD, YOUR ROUTE</span><h1>Let’s get moving, {user.name.split(" ")[0]}.</h1><p>Every delivery helps bring the neighbourhood a little closer.</p></div><button type="button" className={`driver-status-switch ${user.isAvailable ? "driver-on" : "driver-off"}`} onClick={() => void toggleDriverAvailability(user)}><span className="online-pulse" />{user.isAvailable ? "You’re online" : "You’re offline"}<ChevronDown size={15} /></button></div>
            <section className="driver-welcome-banner"><div><span className="banner-kicker"><span /> THE COAST IS CALLING</span><h2>{user.isAvailable ? "Ready for the next good thing?" : "Take a breather. We’ll be here."}</h2><p>{user.isAvailable ? "A nearby order could use a good rider like you." : "Switch to online whenever you're ready to ride."}</p><button type="button" className="button button-lime" onClick={() => setDriverTab("available")}>See the order queue <ArrowRight size={15} /></button></div><div className="driver-banner-art"><span>🛵</span><i>✳</i><b>🇬🇲</b></div></section>
            <section className="driver-stats-grid"><MetricCard label="Available nearby" value={String(openOrders.length)} note="Orders looking for a rider" icon={Navigation} tone="green" /><MetricCard label="My active routes" value={String(driverActive.length)} note="In progress right now" icon={Bike} tone="blue" /><MetricCard label="Completed deliveries" value={String(delivered.length)} note="Thank you for showing up" icon={CheckCircle2} tone="peach" /><MetricCard label="Delivery earnings" value={money(weeklyEarnings)} note="Your completed deliveries · 7d" icon={Wallet} tone="yellow" /></section>
            <div className="driver-tabs"><button type="button" className={driverTab === "available" ? "driver-tab-active" : ""} onClick={() => setDriverTab("available")}>Nearby orders <span>{openOrders.length}</span></button><button type="button" className={driverTab === "active" ? "driver-tab-active" : ""} onClick={() => setDriverTab("active")}>My deliveries <span>{driverActive.length}</span></button><button type="button" className={driverTab === "completed" ? "driver-tab-active" : ""} onClick={() => setDriverTab("completed")}>Completed <span>{delivered.length}</span></button></div>
            {driverTab === "available" && (!user.isAvailable ? <EmptyState icon={Bike} title="You’re currently offline" body="Go online when you’re ready to see nearby delivery requests." action={<button type="button" className="button button-dark button-small" onClick={() => void toggleDriverAvailability(user)}>Go online <ArrowRight size={14} /></button>} /> : openOrders.length === 0 ? <EmptyState icon={Navigation} title="No nearby orders just yet" body="You’re all set. We’ll show new delivery requests here as they arrive." /> : <div className="delivery-card-grid">{openOrders.map((order) => <DeliveryCard key={order.id} order={order} mode="available" onAccept={() => void updateOrder(order.id, { accept: true })} onProgress={() => undefined} />)}</div>)}
            {driverTab === "active" && (driverActive.length === 0 ? <EmptyState icon={Bike} title="No active routes yet" body="Pick up a nearby order and it will appear here." action={<button className="text-button" type="button" onClick={() => setDriverTab("available")}>Browse nearby orders <ArrowRight size={14} /></button>} /> : <div className="delivery-card-grid">{driverActive.map((order) => <DeliveryCard key={order.id} order={order} mode="active" onAccept={() => undefined} onProgress={(status) => void updateOrder(order.id, { status })} />)}</div>)}
            {driverTab === "completed" && (delivered.length === 0 ? <EmptyState icon={CheckCircle2} title="Your next five-star delivery is ahead" body="Completed deliveries will be saved here." /> : <div className="surface-card completed-list">{delivered.map((order) => <div className="completed-row" key={order.id}><span className="completed-check"><Check size={16} /></span><div><strong>{order.orderNumber} · {order.storeName}</strong><small>{order.deliveryAddress} · {shortDate(order.updatedAt)}</small></div><strong className="completed-earning">+{money(order.deliveryFee)}</strong></div>)}</div>)}
          </>}

          {view === "profile" && <>
            <div className="page-heading"><div><span className="eyebrow"><span className="eyebrow-dot" /> A LITTLE ABOUT YOU</span><h1>Your Jotna profile</h1><p>Keep your details up to date so every handoff feels easy.</p></div></div>
            <div className="profile-layout"><aside className="surface-card profile-card"><div className="profile-card-top"><span className="profile-avatar-wrap"><Avatar name={user.name} color={user.role === "driver" ? "blue" : user.role === "customer" ? "coral" : "lime"} size="large" /><span className="profile-edit-mark"><Pencil size={12} /></span></span><h2>{user.name}</h2><p>{user.email}</p><span className={`role-pill role-${user.role}`}>{user.role === "admin" ? "Workspace admin" : user.role === "driver" ? "Delivery partner" : "Jotna customer"}</span></div><div className="profile-card-info"><div><MapPin size={15} /><span><small>NEIGHBOURHOOD</small><strong>{user.city || "Greater Banjul"}</strong></span></div><div><Phone size={15} /><span><small>PHONE</small><strong>{user.phone || "Add your phone number"}</strong></span></div><div><CreditCard size={15} /><span><small>CURRENCY</small><strong>Gambian Dalasi · GMD</strong></span></div></div><button type="button" className="profile-signout" onClick={() => void logout()}><LogOut size={16} /> Sign out of Jotna</button></aside><section className="surface-card profile-form-card"><div className="profile-form-heading"><span className="profile-form-icon"><Settings size={18} /></span><div><h3>Your details</h3><p>A little detail helps us make every delivery smoother.</p></div></div><form onSubmit={(event) => void saveProfile(event)} className="form-grid"><label className="form-field form-span"><span>Full name</span><input name="profileName" defaultValue={user.name} required maxLength={100} /></label><label className="form-field"><span>Email address</span><input value={user.email} disabled /></label><label className="form-field"><span>Phone number</span><input name="profilePhone" defaultValue={user.phone} placeholder="+220 700 0000" /></label><label className="form-field form-span"><span>Neighbourhood or town</span><input name="profileCity" defaultValue={user.city} placeholder="e.g. Kololi, Serekunda or Bakau" /></label>{user.role === "driver" && <div className="availability-profile form-span"><span className={`online-dot ${user.isAvailable ? "" : "offline-dot"}`} /><span><strong>Available for deliveries</strong><small>{user.isAvailable ? "You’ll appear in the nearby driver queue." : "You won’t receive new delivery requests."}</small></span><Toggle checked={user.isAvailable} onChange={() => void toggleDriverAvailability(user)} /></div>}<div className="form-footer form-span"><span>🇬🇲 &nbsp; Your community, connected.</span><button className="button button-dark" type="submit" disabled={profileSaving}>{profileSaving ? <span className="spinner" /> : <><Check size={16} /> Save details</>}</button></div></form></section></div>
          </>}

          {view === "browse" && user.role === "driver" && <EmptyState icon={Bike} title="A rider’s road starts with deliveries" body="Browse your delivery queue from My deliveries." action={<button type="button" className="button button-dark" onClick={() => setView("deliveries")}>View deliveries <ArrowRight size={15} /></button>} />}
          <div className="workspace-footer"><span>🇬🇲 &nbsp; Made for The Gambia</span><span>Local roots. Doorstep delivery.</span><span>All amounts in GMD</span></div>
        </div>
      </main>

      {dialog && <ModalFrame title={dialogTitle(dialog)} subtitle={dialogSubtitle(dialog)} onClose={() => !dialogSaving && setDialog(null)} wide={dialog.type === "checkout"}>
        {dialog.type === "store" && <form className="modal-form" onSubmit={(event) => void saveDialog(event)}><div className="form-grid"><label className="form-field form-span"><span>Shop name</span><input name="name" defaultValue={dialog.store?.name ?? ""} placeholder="e.g. Fatou’s Kitchen" required maxLength={100} autoFocus /></label><label className="form-field"><span>What do they offer?</span><input name="category" defaultValue={dialog.store?.category ?? ""} placeholder="Gambian favourites" required /></label><label className="form-field"><span>Neighbourhood</span><input name="location" defaultValue={dialog.store?.location ?? ""} placeholder="Senegambia" required /></label><label className="form-field"><span>Delivery fee · GMD</span><div className="money-input"><span>D</span><input name="deliveryFee" type="number" min="0" max="500" defaultValue={dialog.store?.deliveryFee ?? 35} required /></div></label><label className="form-field"><span>Preparation time</span><input name="prepTime" defaultValue={dialog.store?.prepTime ?? "20–30 min"} placeholder="20–30 min" /></label><label className="form-field"><span>Shop emoji</span><input name="emoji" defaultValue={dialog.store?.emoji ?? "🍽️"} maxLength={12} /></label></div><div className="modal-actions"><button type="button" className="button button-ghost" onClick={() => setDialog(null)}>Cancel</button><button className="button button-dark" disabled={dialogSaving}>{dialogSaving ? <span className="spinner" /> : <><Check size={15} /> {dialog.store ? "Save shop" : "Add shop"}</>}</button></div></form>}
        {dialog.type === "product" && <form className="modal-form" onSubmit={(event) => void saveDialog(event)}><div className="form-grid"><label className="form-field form-span"><span>Menu item name</span><input name="name" defaultValue={dialog.product?.name ?? ""} placeholder="e.g. Domoda & rice" required maxLength={120} autoFocus /></label><label className="form-field form-span"><span>Shop</span><select name="storeId" defaultValue={dialog.product?.storeId ?? dialog.storeId ?? stores[0]?.id ?? ""} required>{stores.map((store) => <option key={store.id} value={store.id}>{store.emoji} {store.name}</option>)}</select></label><label className="form-field form-span"><span>Description</span><textarea name="description" defaultValue={dialog.product?.description ?? ""} placeholder="A few words about what makes it special…" rows={3} maxLength={300} /></label><label className="form-field"><span>Category</span><input name="category" defaultValue={dialog.product?.category ?? "Popular"} placeholder="Local favourites" /></label><label className="form-field"><span>Price · GMD</span><div className="money-input"><span>D</span><input name="price" type="number" min="1" defaultValue={dialog.product?.price ?? ""} placeholder="220" required /></div></label><label className="form-field"><span>Stock</span><input name="stock" type="number" min="0" defaultValue={dialog.product?.stock ?? 40} required /></label><label className="form-field"><span>Emoji</span><input name="emoji" defaultValue={dialog.product?.emoji ?? "🍲"} maxLength={12} /></label></div><div className="modal-actions"><button type="button" className="button button-ghost" onClick={() => setDialog(null)}>Cancel</button><button className="button button-dark" disabled={dialogSaving}>{dialogSaving ? <span className="spinner" /> : <><Check size={15} /> {dialog.product ? "Save item" : "Add menu item"}</>}</button></div></form>}
        {dialog.type === "user" && <form className="modal-form" onSubmit={(event) => void saveDialog(event)}><div className="form-grid"><label className="form-field form-span"><span>Full name</span><input name="name" defaultValue={dialog.user?.name ?? ""} placeholder="e.g. Lamin Touray" required maxLength={100} autoFocus /></label><label className="form-field form-span"><span>Email address</span><input name="email" type="email" defaultValue={dialog.user?.email ?? ""} placeholder="name@example.gm" required /></label><label className="form-field"><span>Phone number</span><input name="phone" defaultValue={dialog.user?.phone ?? ""} placeholder="+220 700 0000" /></label><label className="form-field"><span>Neighbourhood</span><input name="city" defaultValue={dialog.user?.city ?? "Banjul"} placeholder="Serekunda" /></label><label className="form-field form-span"><span>{dialog.user ? "Reset password (optional)" : "Temporary password"}</span><input name="password" type="password" minLength={dialog.user ? 8 : undefined} placeholder={dialog.user ? "Leave blank to keep the current password" : "Leave blank to use jotna2026"} /></label></div><div className="modal-note"><span>✳</span><span>{dialog.user ? "Account history stays connected when you update a profile." : `This ${dialog.accountRole} account will be able to sign in with the email and password above.`}</span></div><div className="modal-actions"><button type="button" className="button button-ghost" onClick={() => setDialog(null)}>Cancel</button><button className="button button-dark" disabled={dialogSaving}>{dialogSaving ? <span className="spinner" /> : <><Check size={15} /> {dialog.user ? "Save account" : `Create ${dialog.accountRole}`}</>}</button></div></form>}
        {dialog.type === "checkout" && <form className="checkout-layout" onSubmit={(event) => void saveDialog(event)}><div className="checkout-items"><div className="checkout-store-label"><span className="checkout-store-emoji">{dialog.store.emoji}</span><span><strong>{dialog.store.name}</strong><small>{dialog.store.location} · {dialog.store.prepTime}</small></span></div>{products.filter((product) => (cart[product.id] ?? 0) > 0).map((product) => <div className="checkout-line" key={product.id}><span className="checkout-product-emoji">{product.emoji}</span><span className="checkout-product-name"><strong>{product.name}</strong><small>{money(product.price)} each</small></span><div className="quantity-control"><button type="button" aria-label={`Remove one ${product.name}`} onClick={() => changeQuantity(product.id, -1)}><Minus size={12} /></button><span>{cart[product.id]}</span><button type="button" aria-label={`Add one ${product.name}`} onClick={() => changeQuantity(product.id, 1)}><Plus size={12} /></button></div><strong className="checkout-line-total">{money(product.price * (cart[product.id] ?? 0))}</strong></div>)}<label className="form-field checkout-address"><span>Delivery address</span><textarea name="deliveryAddress" defaultValue={`${user.city ? `${user.city}, ` : ""}The Gambia`} required minLength={5} maxLength={240} rows={2} placeholder="House, street or a nearby landmark" /><small>A nearby landmark helps your rider find you.</small></label></div><aside className="checkout-summary"><span className="eyebrow"><span className="eyebrow-dot" /> YOUR ORDER, YOUR WAY</span><h3>Almost there.</h3><p>One last check before your local favourite gets cooking.</p><label className="form-field payment-select"><span>How would you like to pay?</span><select name="paymentMethod" defaultValue="Cash on delivery"><option>Cash on delivery</option><option>QMoney</option><option>Wave</option></select></label><div className="checkout-totals"><div><span>Subtotal</span><strong>{money(cartSubtotal)}</strong></div><div><span>Delivery to {dialog.store.location}</span><strong>{money(dialog.store.deliveryFee)}</strong></div><div className="checkout-total"><span>Total · GMD</span><strong>{money(cartSubtotal + dialog.store.deliveryFee)}</strong></div></div><button className="button button-dark button-full checkout-submit" disabled={dialogSaving || cartCount === 0}>{dialogSaving ? <span className="spinner" /> : <>Place my order <ArrowRight size={16} /></>}</button><small className="checkout-assurance"><CheckCircle2 size={13} /> A little love for local businesses.</small></aside></form>}
      </ModalFrame>}
      {toast && <div className="toast-message" role="status"><span><Check size={15} /></span>{toast}</div>}
    </div>
  );
}

function StoreCard({ store, productCount, onClick, featured = false }: { store: StoreRecord; productCount: number; onClick: () => void; featured?: boolean }) {
  const artClass = store.category.toLowerCase().includes("grocer") || store.category.toLowerCase().includes("produce") || store.category.toLowerCase().includes("market") ? "store-art-produce" : store.category.toLowerCase().includes("coffee") ? "store-art-coffee" : store.category.toLowerCase().includes("seafood") ? "store-art-seafood" : "store-art-food";
  return <button type="button" className={`store-card ${featured ? "store-card-featured" : ""}`} onClick={onClick}><div className={`store-card-art ${artClass}`}><span className="store-card-art-emoji">{store.emoji}</span><span className="store-card-spark">✳</span><span className="store-card-rating"><Star size={12} fill="currentColor" /> {store.rating}</span><span className="store-open-bubble"><span />{store.isOpen ? "Open" : "Closed"}</span></div><div className="store-card-content"><div className="store-card-title"><h3>{store.name}</h3><ArrowUpRight size={16} /></div><p>{store.category}</p><div className="store-card-meta"><span><MapPin size={13} />{store.location}</span><span><Clock3 size={13} />{store.prepTime}</span></div><div className="store-card-footer"><span>{productCount} local favourites</span><span>Delivery {money(store.deliveryFee)}</span></div></div></button>;
}

function CustomerOrderCard({ order, onCancel }: { order: OrderRecord; onCancel: () => void }) {
  return <article className="customer-order-card"><div className="customer-order-emoji">{order.storeName.includes("Market") || order.storeName.includes("Groceries") ? "🧺" : "🍽️"}</div><div className="customer-order-main"><div className="customer-order-heading"><strong>{order.orderNumber} <span>·</span> {order.storeName}</strong><StatusBadge status={order.status} /></div><p>{order.items.map((item) => `${item.quantity} × ${item.productName}`).join(" · ")}</p><div className="customer-order-meta"><span><Clock3 size={13} /> {humanTime(order.createdAt)}</span><span><MapPin size={13} /> {order.deliveryAddress}</span></div><OrderTracker order={order} /></div><div className="customer-order-total"><strong>{money(order.total)}</strong>{["pending", "confirmed"].includes(order.status) && <button className="text-button danger-text" type="button" onClick={onCancel}>Cancel order</button>}</div><ArrowRight className="customer-order-arrow" size={16} /></article>;
}

function DeliveryCard({ order, mode, onAccept, onProgress }: { order: OrderRecord; mode: "available" | "active"; onAccept: () => void; onProgress: (status: OrderStatus) => void }) {
  const nextStatus: OrderStatus | null = order.status === "picked_up" ? "delivered" : order.status === "ready" ? "picked_up" : null;
  return <article className="delivery-card"><div className="delivery-card-top"><span className="delivery-order-number"><Package size={14} /> {order.orderNumber}</span><span className="delivery-time"><Clock3 size={13} /> {humanTime(order.createdAt)}</span></div><div className="delivery-card-store"><span className="delivery-store-emoji">{order.storeName.includes("Market") || order.storeName.includes("Groceries") ? "🧺" : "🍛"}</span><div><small>PICK UP FROM</small><strong>{order.storeName}</strong></div><span className="delivery-route-arrow"><ArrowRight size={16} /></span><span className="delivery-customer"><small>DELIVER TO</small><strong>{order.customerName}</strong></span></div><div className="delivery-address"><MapPin size={16} /><span>{order.deliveryAddress}</span></div><div className="delivery-items"><strong>{order.items.map((item) => `${item.quantity} × ${item.productName}`).join(" · ")}</strong><span>{order.paymentMethod}</span></div><div className="delivery-card-footer"><span className="delivery-payout"><Wallet size={16} /><span><small>DELIVERY FEE</small><strong>{money(order.deliveryFee)}</strong></span></span>{mode === "available" ? <button className="button button-dark" type="button" onClick={onAccept}>Accept delivery <ArrowRight size={15} /></button> : nextStatus ? <button className="button button-dark" type="button" onClick={() => onProgress(nextStatus)}>{nextStatus === "picked_up" ? <><Package size={15} /> Mark picked up</> : <><CheckCircle2 size={15} /> Complete delivery</>}</button> : <span className="delivery-waiting"><Clock3 size={13} /> Waiting for the shop to finish</span>}</div></article>;
}

function dialogTitle(dialog: Exclude<DialogState, null>) {
  if (dialog.type === "store") return dialog.store ? "Edit local shop" : "Welcome a local shop";
  if (dialog.type === "product") return dialog.product ? "Edit menu item" : "Add to the menu";
  if (dialog.type === "user") return dialog.user ? "Edit account" : `Add a ${dialog.accountRole}`;
  return "Your neighbourhood order";
}
function dialogSubtitle(dialog: Exclude<DialogState, null>) {
  if (dialog.type === "store") return "Every great delivery starts with a great local partner.";
  if (dialog.type === "product") return "Keep the menu clear, fresh and ready for the neighbourhood.";
  if (dialog.type === "user") return dialog.user ? "Keep account details and order history in one place." : `Set up a Jotna ${dialog.accountRole} account.`;
  return "A few details, and your local favourite is on its way.";
}
