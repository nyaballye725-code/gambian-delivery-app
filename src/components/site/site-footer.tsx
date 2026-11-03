import Link from "next/link";
import { Clock3, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { site, whatsappLink } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="s-footer">
      <div className="site-shell">
        <div className="s-footer-grid">
          <div className="s-footer-brand">
            <Link href="/" className="s-logo s-logo-light" aria-label="Jotna — home">
              <span className="s-logo-mark"><Navigation size={18} fill="currentColor" /></span>
              <span>jotna<span className="s-logo-dot">.</span></span>
            </Link>
            <p>
              Local shops, market runs and parcels — picked up and delivered by riders who know
              your neighbourhood. Built and run in The Gambia.
            </p>
            <div className="s-social">
              <a href={whatsappLink("Hi Jotna! I have a question about a delivery.")} target="_blank" rel="noopener noreferrer" aria-label="Message Jotna on WhatsApp">
                <MessageCircle size={17} />
              </a>
              <a href={site.phoneHref} aria-label="Call Jotna"><Phone size={17} /></a>
              <a href={`mailto:${site.email}`} aria-label="Email Jotna"><Mail size={17} /></a>
            </div>
          </div>

          <div>
            <h4>Deliveries</h4>
            <ul>
              <li><Link href="/#services">Restaurant food</Link></li>
              <li><Link href="/#services">Groceries &amp; market runs</Link></li>
              <li><Link href="/#services">Pharmacy &amp; essentials</Link></li>
              <li><Link href="/#services">Parcels &amp; documents</Link></li>
            </ul>
          </div>

          <div>
            <h4>Jotna</h4>
            <ul>
              <li><Link href="/#how-it-works">How it works</Link></li>
              <li><Link href="/#coverage">Coverage &amp; fees</Link></li>
              <li><Link href="/riders">Become a rider</Link></li>
              <li><Link href="/contact">Contact us</Link></li>
            </ul>
          </div>

          <div className="s-footer-contact">
            <h4>Get in touch</h4>
            <ul>
              <li>
                <a href={site.phoneHref}><Phone size={14} /> {site.phoneDisplay}</a>
              </li>
              <li>
                <a href={whatsappLink("Hi Jotna! I would like to place an order.")} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={14} /> WhatsApp us
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`}><Mail size={14} /> {site.email}</a>
              </li>
              <li>
                <span style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 13.5 }}>
                  <MapPin size={14} style={{ color: "#86aa7d", flex: "0 0 auto" }} /> {site.address.display}
                </span>
              </li>
              <li>
                <span style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 13.5 }}>
                  <Clock3 size={14} style={{ color: "#86aa7d", flex: "0 0 auto" }} /> {site.hours}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="s-footer-bottom">
          <span>© {new Date().getFullYear()} {site.legalName}. All rights reserved.</span>
          <div className="s-footer-legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/app">Open the app</Link>
            <span className="s-flag">🇬🇲 Made in The Gambia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
