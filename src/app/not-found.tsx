import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Navigation } from "lucide-react";
import "./site.css";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="site" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "48px 24px" }}>
      <div style={{ width: "min(560px, 100%)", textAlign: "center" }}>
        <span className="s-logo-mark" style={{ margin: "0 auto 22px", width: 52, height: 52, borderRadius: 16 }}>
          <Navigation size={26} fill="currentColor" />
        </span>
        <span className="s-eyebrow">404 · off the route</span>
        <h1 className="s-display" style={{ marginTop: 12 }}>This one went <em>missing</em>.</h1>
        <p className="s-lede" style={{ margin: "16px auto 30px" }}>
          The page you were looking for is not here. The kitchen is still open though — head back
          to the homepage or start an order.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="s-btn s-btn-dark">Back to Jotna <ArrowRight size={16} /></Link>
          <Link href="/app" className="s-btn s-btn-outline">Start an order</Link>
        </div>
      </div>
    </div>
  );
}
