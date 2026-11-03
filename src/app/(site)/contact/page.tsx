import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  ChevronRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Store,
  Wallet,
} from "lucide-react";
import { site, mailtoLink, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Talk to the Jotna team in The Gambia — order help, shop partnerships, rider applications and delivery coverage. WhatsApp, phone and email.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section className="s-page-hero">
        <div className="site-shell">
          <nav className="s-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <ChevronRight size={13} /> <span>Contact</span>
          </nav>
          <h1>Talk to a <em>human</em>.</h1>
          <p>
            Order questions, shop partnerships or rider applications — the same small team in
            Serekunda answers all of it. No ticket numbers, no hold music.
          </p>
          <div className="s-page-actions">
            <a
              className="s-btn s-btn-dark s-btn-lg"
              href={whatsappLink("Hi Jotna! I would like some help.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={18} /> Message us on WhatsApp
            </a>
            <a className="s-btn s-btn-outline s-btn-lg" href={site.phoneHref}>
              <Phone size={17} /> {site.phoneDisplay}
            </a>
          </div>
        </div>
      </section>

      <section className="site-section-tight">
        <div className="site-shell">
          <div className="s-contact-grid">
            <article className="s-contact-card">
              <span className="s-icon-tile"><MessageCircle size={20} /></span>
              <h3>WhatsApp — fastest</h3>
              <p>Live order updates, address fixes and quick questions. Open 9:00 to 22:00, every day.</p>
              <a
                className="s-link-arrow"
                href={whatsappLink("Hi Jotna! I would like some help with an order.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat with the team <ArrowRight size={14} />
              </a>
            </article>

            <article className="s-contact-card">
              <span className="s-icon-tile"><Phone size={20} /></span>
              <h3>Call the operations desk</h3>
              <p>For an order that is already on the road, or if you are not on WhatsApp.</p>
              <div className="s-link-stack">
                {site.phones.map((phone) => (
                  <a key={phone.href} href={phone.href}>
                    {phone.display} <ArrowRight size={14} />
                  </a>
                ))}
              </div>
            </article>

            <article className="s-contact-card">
              <span className="s-icon-tile"><Store size={20} /></span>
              <h3>Partner your shop</h3>
              <p>
                Restaurants, shops, pharmacies and market vendors — tell us your name, location and
                menu and we will visit you.
              </p>
              <a className="s-link-arrow" href={mailtoLink("Shop partnership with Jotna")}>
                {site.email} <ArrowRight size={14} />
              </a>
            </article>

            <article className="s-contact-card">
              <span className="s-icon-tile"><Mail size={20} /></span>
              <h3>Rider applications</h3>
              <p>Applying to ride, payouts or a trip you have already completed.</p>
              <a className="s-link-arrow" href={`mailto:${site.ridersEmail}`}>
                {site.ridersEmail} <ArrowRight size={14} />
              </a>
            </article>
          </div>
        </div>
      </section>

      <section className="site-section" style={{ paddingTop: 0 }}>
        <div className="site-shell">
          <div className="s-split" style={{ alignItems: "flex-start" }}>
            <div>
              <span className="s-eyebrow">Details</span>
              <h2 className="s-display">Find us in <em>Serekunda</em>.</h2>
              <p className="s-lede">
                Our operations base is a short walk from Kairaba Avenue. If you are coming in
                person — for a partnership or rider onboarding — message first so someone is there
                to meet you.
              </p>
              <div className="s-info-panel" style={{ marginTop: 26 }}>
                <h3>At a glance</h3>
                <div className="s-info-row"><span><Clock3 size={14} /> Opening hours</span><strong>{site.hours}</strong></div>
                <div className="s-info-row"><span><Phone size={14} /> Phone</span><strong>{site.phones.map((phone) => phone.display).join(" · ")}</strong></div>
                <div className="s-info-row"><span><MapPin size={14} /> Base</span><strong>{site.address.display}</strong></div>
                <div className="s-info-row"><span><MapPin size={14} /> Delivery areas</span><strong>Banjul · Serekunda · Bakau · Bijilo · Brikama</strong></div>
                <div className="s-info-row"><span><Wallet size={14} /> Payments</span><strong>Cash · QMoney · Wave</strong></div>
                <div className="s-info-row"><span><MessageCircle size={14} /> Reply time</span><strong>Usually under 10 minutes</strong></div>
              </div>
            </div>

            <div className="s-cover-card">
              <div className="s-cover-card-head">
                <h3>Before you message</h3>
                <span className="s-badge-soft"><Clock3 size={12} /> 9:00 – 22:00</span>
              </div>
              <div className="s-area-list">
                <div className="s-area" style={{ gridTemplateColumns: "1fr" }}>
                  <span className="s-area-name" style={{ alignItems: "flex-start" }}>
                    <MapPin size={16} />
                    <span>
                      Order already placed
                      <br />
                      <small>Send your order number (JOT-####) so we can find the trip straight away.</small>
                    </span>
                  </span>
                </div>
                <div className="s-area" style={{ gridTemplateColumns: "1fr" }}>
                  <span className="s-area-name" style={{ alignItems: "flex-start" }}>
                    <Store size={16} />
                    <span>
                      Shop partnership
                      <br />
                      <small>Send your shop name, address, opening hours and a photo of your menu or price list.</small>
                    </span>
                  </span>
                </div>
                <div className="s-area" style={{ gridTemplateColumns: "1fr" }}>
                  <span className="s-area-name" style={{ alignItems: "flex-start" }}>
                    <MessageCircle size={16} />
                    <span>
                      Riding with us
                      <br />
                      <small>Tell us your name, area, and whether you ride a motorbike or bicycle.</small>
                    </span>
                  </span>
                </div>
              </div>
              <a
                className="s-btn s-btn-dark s-btn-block"
                style={{ marginTop: 22 }}
                href={whatsappLink("Hi Jotna! I would like some help.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                Start the conversation <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section-tight" style={{ paddingTop: 0 }}>
        <div className="site-shell">
          <div className="s-cta-band">
            <div className="s-cta-inner">
              <div>
                <span className="s-eyebrow">Already hungry?</span>
                <h2>Skip the queue and order.</h2>
                <p>Create an account in seconds and see which shops are delivering in your area right now.</p>
              </div>
              <div className="s-cta-actions">
                <Link href="/app" className="s-btn s-btn-dark s-btn-lg">
                  Start an order <ArrowRight size={18} />
                </Link>
                <Link href="/#coverage" className="s-btn s-btn-white s-btn-lg">Check coverage</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
