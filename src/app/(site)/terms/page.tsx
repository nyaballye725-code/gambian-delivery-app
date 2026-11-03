import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms that apply when you order through Jotna in The Gambia.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <section className="s-page-hero" style={{ paddingBottom: 34 }}>
        <div className="site-shell">
          <nav className="s-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <ChevronRight size={13} /> <span>Terms</span>
          </nav>
          <h1>Terms of <em>service</em>.</h1>
          <p>The short version: order what you need, pay for it, and be kind to the rider.</p>
          <p className="s-legal-meta" style={{ marginTop: 18 }}>Last updated: 3 November 2026</p>
        </div>
      </section>

      <section className="s-legal">
        <div className="site-shell">
          <div className="s-legal-inner">
            <p>
              These terms apply when you use the Jotna website and ordering service operated by{" "}
              {site.legalName}. By placing an order you agree to them.
            </p>

            <h2>What Jotna is</h2>
            <p>
              Jotna is a delivery platform. Shops and restaurants prepare the goods; independent
              rider partners collect and deliver them. Jotna arranges the order, the trip and the
              payment record. Prices for goods are set by the shop; the delivery fee is shown to you
              before you confirm.
            </p>

            <h2>Your account</h2>
            <ul>
              <li>You must give accurate details and keep your password private.</li>
              <li>You are responsible for activity on your account.</li>
              <li>Rider and shop accounts are created and activated by the Jotna team.</li>
            </ul>

            <h2>Orders and pricing</h2>
            <ul>
              <li>All prices are in Gambian Dalasi (GMD) and include no hidden service charge.</li>
              <li>Order totals are calculated on our servers from the shop’s current prices and stock.</li>
              <li>If an item is unavailable after you order, we will contact you to substitute or adjust the order.</li>
              <li>We may refuse or cancel an order where stock, payment or delivery is not possible; any payment taken for a cancelled order is returned.</li>
            </ul>

            <h2>Payment</h2>
            <p>
              You can pay cash on delivery, or by QMoney or Wave. Mobile money payments are
              processed by those providers. Cash is collected by the rider on handover.
            </p>

            <h2>Delivery</h2>
            <ul>
              <li>Delivery fees and estimated times depend on the route and are shown before checkout.</li>
              <li>Estimates are not guarantees — traffic, weather and shop delays happen.</li>
              <li>Please give a reachable phone number and clear directions; a rider may wait a reasonable time before an order is returned or rescheduled.</li>
              <li>Age-restricted items may require identification on delivery.</li>
            </ul>

            <h2>Changes and cancellations</h2>
            <p>
              You can cancel an order while it is still pending or confirmed, before the shop starts
              preparing it. Once a rider is on the road the order cannot be cancelled. Orders that
              have been delivered or cancelled are final.
            </p>

            <h2>Rider partners</h2>
            <p>
              Rider partners are independent contractors, not employees of Jotna. They choose their
              own hours and use their own vehicles, and they are responsible for their own tax and
              insurance obligations.
            </p>

            <h2>Acceptable use</h2>
            <ul>
              <li>Do not order illegal goods or use the service to harass riders or shop staff.</li>
              <li>Do not attempt to access accounts, data or systems that are not yours.</li>
              <li>Repeated abuse or non-payment may lead to your account being suspended.</li>
            </ul>

            <h2>Liability</h2>
            <p>
              We work hard to deliver well, but the service is provided as it is. To the extent
              permitted by law, Jotna is not liable for indirect losses, and our liability for a
              particular order is limited to the value of that order and its delivery fee.
            </p>

            <h2>Changes to these terms</h2>
            <p>
              We may update these terms as the service changes. The date at the top of this page
              shows the latest version, and continued use of Jotna means you accept it.
            </p>

            <h2>Contact and governing law</h2>
            <p>
              Questions: <a href={`mailto:${site.email}`}>{site.email}</a> or{" "}
              <a href={site.phoneHref}>{site.phoneDisplay}</a>. These terms are governed by the laws
              of The Gambia, and disputes are subject to the courts of The Gambia.
            </p>

            <p style={{ marginTop: 32 }}>
              <Link href="/privacy">Read the privacy policy →</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
