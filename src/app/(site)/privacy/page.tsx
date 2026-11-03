import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Jotna collects, uses and protects your personal information in The Gambia.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <section className="s-page-hero" style={{ paddingBottom: 34 }}>
        <div className="site-shell">
          <nav className="s-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <ChevronRight size={13} /> <span>Privacy</span>
          </nav>
          <h1>Privacy <em>policy</em>.</h1>
          <p>What we collect to get your order to the door, and what we do not do with it.</p>
          <p className="s-legal-meta" style={{ marginTop: 18 }}>Last updated: 3 November 2026</p>
        </div>
      </section>

      <section className="s-legal">
        <div className="site-shell">
          <div className="s-legal-inner">
            <p>
              This policy explains how {site.legalName} (“Jotna”, “we”) handles personal information
              when you use this website and the Jotna ordering service in The Gambia.
            </p>

            <h2>Information we collect</h2>
            <ul>
              <li><strong>Account details</strong> — your name, email address, phone number and neighbourhood.</li>
              <li><strong>Delivery details</strong> — the address, landmark and notes you give us for a specific order.</li>
              <li><strong>Order history</strong> — the shops you ordered from, items, prices, delivery fees and payment method.</li>
              <li><strong>Rider details</strong> — for rider partners, your identification and licence information, vehicle details and availability.</li>
              <li><strong>Technical data</strong> — a session cookie that keeps you signed in, and basic server logs used for security and troubleshooting.</li>
            </ul>

            <h2>How we use it</h2>
            <ul>
              <li>To prepare, assign and deliver your order, and to let you track it.</li>
              <li>To contact you about an order — for example when a rider is at the gate.</li>
              <li>To operate rider payouts and shop settlements.</li>
              <li>To keep the marketplace safe, prevent fraud and resolve disputes.</li>
              <li>To improve the service, using aggregated rather than personally identifying information.</li>
            </ul>

            <h2>Who sees your information</h2>
            <p>
              The shop preparing your order sees what it needs to fulfil it. The rider assigned to
              your delivery sees your name, phone number, address and order. Payment providers
              (QMoney, Wave) process mobile money payments under their own policies. We do not sell
              personal information.
            </p>

            <h2>Cookies</h2>
            <p>
              We use a single essential, HttpOnly session cookie to keep you signed in. We do not
              run advertising cookies or third-party trackers on this site.
            </p>

            <h2>How long we keep it</h2>
            <p>
              Order and payout records are kept for as long as needed to operate the service and to
              meet accounting and legal obligations. Account details are kept until you ask us to
              delete your account, unless we are required to retain a record.
            </p>

            <h2>Your choices</h2>
            <ul>
              <li>Ask for a copy of the personal information we hold about you.</li>
              <li>Ask us to correct information that is wrong.</li>
              <li>Ask us to close your account and delete your details, subject to legal retention.</li>
              <li>Ask us to stop non-essential contact.</li>
            </ul>

            <h2>Security</h2>
            <p>
              Passwords are stored as salted hashes, sessions are signed, and access to operational
              data is limited to the team that needs it. No service is perfectly secure, but we work
              to protect your information and to tell you promptly if something goes wrong.
            </p>

            <h2>Contact</h2>
            <p>
              Questions or requests: <a href={`mailto:${site.email}`}>{site.email}</a> or{" "}
              <a href={site.phoneHref}>{site.phoneDisplay}</a>. Our base is {site.address.display}.
            </p>

            <p style={{ marginTop: 32 }}>
              <Link href="/terms">Read the terms of service →</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
