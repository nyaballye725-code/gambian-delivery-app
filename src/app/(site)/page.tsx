import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Bike,
  Carrot,
  Check,
  Clock3,
  Headphones,
  Info,
  MapPin,
  MessageCircle,
  Package,
  Pill,
  ShieldCheck,
  Smartphone,
  Star,
  Store,
  Utensils,
  Wallet,
} from "lucide-react";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Food, groceries & parcels delivered across The Gambia",
  description:
    "Order from neighbourhood restaurants, shops and market stalls across the Greater Banjul Area. Cash, QMoney or Wave. Track your rider live to the gate.",
  alternates: { canonical: "/" },
};

const services = [
  {
    icon: Utensils,
    title: "Restaurant food",
    copy: "Domoda, benachin, grilled fish or a late shawarma — order from the kitchens you already love, still hot.",
    note: "Hot food, packed to travel",
  },
  {
    icon: Carrot,
    title: "Groceries & market runs",
    copy: "Rice, oil, onions, bread and fresh produce picked from your neighbourhood shop or a market stall in town.",
    note: "We shop it, you cook it",
  },
  {
    icon: Pill,
    title: "Pharmacy & essentials",
    copy: "Medicine, baby supplies, phone credit and the small things you forgot — no trip across town required.",
    note: "Same-day essentials",
  },
  {
    icon: Package,
    title: "Parcels & documents",
    copy: "Documents, gifts and packages moving across town with a rider you can track from pickup to handover.",
    note: "Point to point, tracked",
  },
];

const steps = [
  {
    title: "Find a shop near you",
    copy: "Browse kitchens, shops and pharmacies by neighbourhood. See what is in stock before you order — no surprises at the door.",
    note: "Live stock on every item",
  },
  {
    title: "Check out in a minute",
    copy: "Add your address, choose cash, QMoney or Wave, and confirm. Your basket is reserved from the shop the moment you order.",
    note: "Cash on delivery welcome",
  },
  {
    title: "Track it to your gate",
    copy: "Follow your order from placed to on-the-way to delivered, with your rider’s name and an ETA that updates as they move.",
    note: "Live status, real riders",
  },
];

const faqs = [
  {
    q: "Where does Jotna deliver?",
    a: "We currently deliver across the Greater Banjul Area — Banjul, Serekunda, Bakau, Fajara, Bijilo, Kotu and Latrikunda — plus Brikama. Delivery times and fees depend on the distance between the shop and your address.",
  },
  {
    q: "How much does delivery cost?",
    a: "Delivery starts at GMD 45 and goes up to GMD 85 for the longest routes. You always see the exact delivery fee before you confirm the order, and you pay the shop’s own price for the items — no hidden mark-up.",
  },
  {
    q: "How can I pay?",
    a: "Cash to the rider on delivery, or mobile money with QMoney and Wave. Card payments are not supported yet.",
  },
  {
    q: "How long will my order take?",
    a: "Most orders in the Greater Banjul Area arrive in 25 to 45 minutes. Market runs and longer routes to Brikama can take up to an hour. You will see a live estimate on the tracking screen once a rider accepts.",
  },
  {
    q: "Can I schedule an order for later?",
    a: "Orders are placed for right now. If you need something delivered at a specific time — a gift, documents, a lunch run for the office — message us on WhatsApp and our team will arrange it.",
  },
  {
    q: "I run a shop or restaurant. How do we join?",
    a: "We onboard shops personally. Send us a message on WhatsApp with your shop name, location and a photo of your menu, and our operations team will visit to set you up.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["LocalBusiness", "DeliveryService"],
      "@id": `${site.url}/#business`,
      name: site.name,
      legalName: site.legalName,
      url: site.url,
      image: `${site.url}/photos/hero-rider.jpg`,
      description: site.description,
      telephone: site.phoneDisplay,
      email: site.email,
      priceRange: "GMD 45–85",
      currenciesAccepted: "GMD",
      paymentAccepted: "Cash, QMoney, Wave",
      address: {
        "@type": "PostalAddress",
        streetAddress: site.address.street,
        addressLocality: site.address.locality,
        addressRegion: site.address.region,
        addressCountry: site.address.country,
      },
      areaServed: site.areas.map((area) => ({ "@type": "City", name: area.name })),
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "09:00",
        closes: "22:00",
      },
      servesCuisine: "Local delivery",
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      inLanguage: "en-GM",
      publisher: { "@id": `${site.url}/#business` },
    },
    {
      "@type": "FAQPage",
      "@id": `${site.url}/#faq`,
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Hero ------------------------------------------------------------- */}
      <section className="s-hero">
        <div className="site-shell">
          <div className="s-hero-grid">
            <div>
              <span className="s-eyebrow s-eyebrow-light">The Gambia, delivered</span>
              <h1>Good things<br />are <em>on the way.</em></h1>
              <p className="s-hero-copy">
                Food from the kitchen down the road. Groceries from the market around the corner.
                Jotna connects you to the shops in your neighbourhood — and gets it to your gate,
                while it is still fresh.
              </p>
              <div className="s-hero-actions">
                <Link href="/app" className="s-btn s-btn-lime s-btn-lg">
                  Start an order <ArrowRight size={18} />
                </Link>
                <Link href="/riders" className="s-btn s-btn-outline-light s-btn-lg">
                  Become a rider
                </Link>
              </div>
              <div className="s-hero-proof">
                <span><Wallet size={15} /> Pay cash, QMoney or Wave</span>
                <span><Clock3 size={15} /> 25–45 min across the Greater Banjul Area</span>
              </div>
            </div>

            <figure className="s-hero-visual">
              <Image
                src="/photos/hero-rider.jpg"
                alt="A Jotna delivery rider on his motorbike on a sandy street in the Greater Banjul Area"
                width={1408}
                height={768}
                priority
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="s-hero-photo"
              />
              <span className="s-hero-badge"><span className="s-live-dot" /> Riders online now</span>
              <div className="s-track-card" aria-hidden="true">
                <div className="s-track-top">
                  <span className="s-track-icon"><Bike size={18} /></span>
                  <span className="s-track-copy">
                    <strong>Aisha’s order</strong>
                    <small>Bakau → Fajara</small>
                  </span>
                  <span className="s-track-time">12 min</span>
                </div>
                <div className="s-track-bar"><i /></div>
                <div className="s-track-meta">
                  <span>On the way</span>
                  <b>GMD 245</b>
                </div>
              </div>
            </figure>
          </div>

          <div className="s-hero-stats">
            <div><strong>5 areas</strong><span>Banjul to Brikama, covered daily</span></div>
            <div><strong>120+ shops</strong><span>Kitchens, markets and pharmacies</span></div>
            <div><strong>32 min</strong><span>Average door-to-door delivery</span></div>
            <div><strong>7 days</strong><span>Every day, 9:00 to 22:00</span></div>
          </div>
        </div>
      </section>

      {/* Trust strip ------------------------------------------------------ */}
      <div className="s-strip">
        <div className="site-shell s-strip-inner">
          <span className="s-strip-label">Ordered your way</span>
          <div className="s-strip-list">
            <span>Cash on delivery</span>
            <span>QMoney &amp; Wave</span>
            <span>Live rider tracking</span>
            <span>One shop, one basket</span>
            <span>Real people on WhatsApp</span>
          </div>
        </div>
      </div>

      {/* Services --------------------------------------------------------- */}
      <section id="services" className="site-section">
        <div className="site-shell">
          <div className="s-section-head">
            <div>
              <span className="s-eyebrow">What we deliver</span>
              <h2 className="s-display">One rider. <em>Everything</em> on your list.</h2>
              <p className="s-lede">
                Jotna is not just food. It is the market run you did not have time for, the
                prescription your mother needs, and the envelope that has to arrive today.
              </p>
            </div>
            <Link href="/#how-it-works" className="s-section-link">
              See how it works <ArrowRight size={15} />
            </Link>
          </div>

          <div className="s-service-grid">
            {services.map(({ icon: Icon, title, copy, note }) => (
              <article key={title} className="s-service">
                <span className="s-service-icon"><Icon size={21} /></span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <span className="s-service-foot">{note} <ArrowRight size={13} /></span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works ----------------------------------------------------- */}
      <section id="how-it-works" className="s-steps-wrap site-section">
        <div className="site-shell">
          <div className="s-section-head">
            <div>
              <span className="s-eyebrow">How it works</span>
              <h2 className="s-display">From craving to <em>your gate</em>.</h2>
              <p className="s-lede">
                No app store, no account admin, no waiting on hold. Open Jotna in your browser,
                pick a shop, and let a rider handle the rest.
              </p>
            </div>
            <Link href="/app" className="s-section-link">
              Order something now <ArrowRight size={15} />
            </Link>
          </div>

          <div className="s-steps">
            {steps.map((step, index) => (
              <article key={step.title} className="s-step">
                <span className="s-step-num">{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
                <span className="s-step-note"><Check size={13} /> {step.note}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage --------------------------------------------------------- */}
      <section id="coverage" className="site-section">
        <div className="site-shell">
          <div className="s-split">
            <div className="s-media s-media-wide">
              <Image
                src="/photos/market-run.jpg"
                alt="A basket of fresh Gambian produce — okra, tomatoes, onions, mangoes and rice — ready for delivery"
                width={1408}
                height={768}
                sizes="(max-width: 1024px) 100vw, 46vw"
              />
              <span className="s-media-tag"><Carrot size={15} /> Picked this morning</span>
            </div>

            <div>
              <span className="s-eyebrow">Coverage &amp; fees</span>
              <h2 className="s-display">From Banjul <em>to Brikama</em>.</h2>
              <p className="s-lede">
                One flat delivery fee per order, agreed before you pay. No subscriptions, no
                service charge and no mark-up on shop prices.
              </p>

              <div className="s-cover-card" style={{ marginTop: 26 }}>
                <div className="s-cover-card-head">
                  <h3>Where we ride</h3>
                  <span className="s-badge-soft"><span className="s-live-dot" /> Live today</span>
                </div>
                <div className="s-area-list">
                  {site.areas.map((area) => (
                    <div key={area.name} className="s-area">
                      <span className="s-area-name">
                        <MapPin size={15} />
                        <span>
                          {area.name}
                          <br />
                          <small>{area.note}</small>
                        </span>
                      </span>
                      <span className="s-area-eta">{area.eta}</span>
                      <span className="s-area-fee">{area.fee}</span>
                    </div>
                  ))}
                </div>
                <p className="s-cover-note">
                  <Info size={14} />
                  Not on the list yet? We add neighbourhoods every month. Message us and we will
                  tell you honestly whether we can reach you — or when we will.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App / experience -------------------------------------------------- */}
      <section className="s-app-section site-section">
        <div className="site-shell">
          <div className="s-app-grid">
            <div>
              <span className="s-eyebrow s-eyebrow-light">The Jotna app</span>
              <h2 className="s-display">Built for the way <em>we order here</em>.</h2>
              <p className="s-lede">
                Jotna runs in your browser — nothing to download, nothing to update. It works on
                the phone you already have, on the data you already buy.
              </p>

              <div className="s-feature-list">
                <div className="s-feature">
                  <span className="s-feature-check"><Check size={14} /></span>
                  <div>
                    <strong>Cash is first-class</strong>
                    <span>Pay the rider at the door, or settle with QMoney or Wave before pickup.</span>
                  </div>
                </div>
                <div className="s-feature">
                  <span className="s-feature-check"><Smartphone size={14} /></span>
                  <div>
                    <strong>No download, no account queue</strong>
                    <span>Open the site, create an account in seconds, and order from any smartphone.</span>
                  </div>
                </div>
                <div className="s-feature">
                  <span className="s-feature-check"><MapPin size={14} /></span>
                  <div>
                    <strong>Live tracking to your gate</strong>
                    <span>Placed, confirmed, preparing, on the way, delivered — updated as it happens.</span>
                  </div>
                </div>
                <div className="s-feature">
                  <span className="s-feature-check"><ShieldCheck size={14} /></span>
                  <div>
                    <strong>Honest stock, honest prices</strong>
                    <span>If a shop is out of something, you see it before checkout — not after.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="s-phone-wrap">
              <div className="s-phone" role="img" aria-label="Preview of a Jotna order being tracked on a phone">
                <div className="s-phone-screen">
                  <div className="s-phone-top">
                    <span>9:41</span>
                    <span className="s-phone-notch" />
                    <span>●●●</span>
                  </div>
                  <div className="s-phone-head">
                    <div>
                      <strong>Your orders</strong>
                      <small>Fajara, Kanifing</small>
                    </div>
                    <span className="s-phone-avatar">AJ</span>
                  </div>
                  <div className="s-phone-body">
                    <div className="s-phone-card">
                      <div className="s-phone-order-head">
                        <span>🍲</span>
                        <span>
                          <strong>Bakau Kitchen · #JOT-1042</strong>
                          <small>Benachin &amp; grilled fish × 2</small>
                        </span>
                        <span className="s-phone-pill">On the way</span>
                      </div>
                      <div className="s-phone-steps">
                        <i className="on" /><i className="on" /><i className="on" /><i className="on" /><i /><i />
                      </div>
                      <div className="s-phone-eta">
                        <span>Arriving at your gate</span>
                        <b>12 min</b>
                      </div>
                    </div>
                    <div className="s-phone-rider">
                      <span className="ava">LT</span>
                      <span>
                        <strong>Lamin T. · your rider</strong>
                        <small>Honda · BJL 4821 · 4.9 ★</small>
                      </span>
                      <MessageCircle size={16} />
                    </div>
                    <div className="s-phone-card">
                      <div className="s-phone-total">
                        <span>2 items + delivery</span>
                        <b>GMD 245</b>
                      </div>
                      <div className="s-phone-eta" style={{ marginTop: 8 }}>
                        <span>Payment</span>
                        <b>Cash on delivery</b>
                      </div>
                    </div>
                  </div>
                  <div className="s-phone-nav">
                    <span className="on"><Store size={15} /> Shops</span>
                    <span><Package size={15} /> Orders</span>
                    <span><Wallet size={15} /> Wallet</span>
                    <span><Headphones size={15} /> Help</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Riders ------------------------------------------------------------ */}
      <section className="site-section-tight">
        <div className="site-shell">
          <div className="s-rider-band">
            <div className="s-rider-band-grid">
              <div className="s-rider-band-copy">
                <span className="s-eyebrow s-eyebrow-light">Ride with Jotna</span>
                <h2>Turn your bike into a business.</h2>
                <p>
                  Riders are the heart of Jotna. Choose when you ride, take the deliveries you
                  want, and get paid every week — with 100% of your tips staying in your pocket.
                </p>
                <div className="s-rider-perks">
                  <span className="s-pill-light"><Bike size={13} /> Flexible hours</span>
                  <span className="s-pill-light"><Wallet size={13} /> Weekly payouts</span>
                  <span className="s-pill-light"><MapPin size={13} /> Your own area</span>
                  <span className="s-pill-light"><Star size={13} /> Tips are yours</span>
                </div>
                <Link href="/riders" className="s-btn s-btn-lime">
                  Become a rider <ArrowRight size={17} />
                </Link>
              </div>
              <div className="s-rider-band-media">
                <Image
                  src="/photos/handover.jpg"
                  alt="A Jotna rider handing a bag of food to a smiling customer at her gate in Banjul"
                  width={1408}
                  height={768}
                  sizes="(max-width: 1024px) 100vw, 46vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quotes ------------------------------------------------------------ */}
      <section className="site-section" style={{ paddingTop: 0 }}>
        <div className="site-shell">
          <div className="s-section-head">
            <div>
              <span className="s-eyebrow">From the neighbourhood</span>
              <h2 className="s-display">People, not <em>platforms</em>.</h2>
            </div>
          </div>
          <div className="s-quote-grid">
            <article className="s-quote">
              <span className="s-stars"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></span>
              <blockquote>
                I ordered benachin for the office at 12:40 and it was on the table before 1:20.
                The rider called when he reached the gate — that small thing matters.
              </blockquote>
              <div className="s-quote-foot">
                <span className="s-quote-ava">FB</span>
                <span><strong>Fatou B.</strong><small>Customer · Fajara</small></span>
              </div>
            </article>
            <article className="s-quote">
              <span className="s-stars"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></span>
              <blockquote>
                I ride in the mornings before class and earn more than I expected. The app tells me
                pickup and drop-off before I accept, so I never ride blind.
              </blockquote>
              <div className="s-quote-foot">
                <span className="s-quote-ava">MT</span>
                <span><strong>Modou T.</strong><small>Rider partner · Serekunda</small></span>
              </div>
            </article>
            <article className="s-quote">
              <span className="s-stars"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></span>
              <blockquote>
                They set up our shop in one afternoon. Orders come in with the stock already
                checked, so we are not calling customers to apologise.
              </blockquote>
              <div className="s-quote-foot">
                <span className="s-quote-ava">IC</span>
                <span><strong>Isatou C.</strong><small>Shop owner · Banjul</small></span>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* FAQ --------------------------------------------------------------- */}
      <section className="site-section" style={{ background: "#f4f1e7", borderBlock: "1px solid rgba(28,52,38,.07)" }}>
        <div className="site-shell">
          <div className="s-faq-grid">
            <div>
              <span className="s-eyebrow">Questions</span>
              <h2 className="s-display">Good to <em>know</em>.</h2>
              <p className="s-lede">
                Still unsure about something? Our team is on WhatsApp from 9:00 to 22:00, every
                day. A real person answers.
              </p>
              <div className="s-faq-aside" style={{ marginTop: 28 }}>
                <h3>Talk to a human</h3>
                <p>Order help, shop partnerships, rider applications — same inbox.</p>
                <div className="s-faq-contact">
                  <a href={whatsappLink("Hi Jotna! I have a question.")} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={16} /> WhatsApp the team
                  </a>
                  {site.phones.map((phone) => (
                    <a key={phone.href} href={phone.href}>
                      <Headphones size={16} /> Call {phone.display}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="s-faq-list">
              {faqs.map((faq) => (
                <details key={faq.q} className="s-faq-item">
                  <summary>{faq.q}</summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA --------------------------------------------------------------- */}
      <section className="site-section-tight">
        <div className="site-shell">
          <div className="s-cta-band">
            <div className="s-cta-inner">
              <div>
                <span className="s-eyebrow">Ready when you are</span>
                <h2>Hungry? Busy? Let’s go.</h2>
                <p>
                  Create an account, pick a shop near you and track your first Jotna delivery to
                  the gate. It takes less time than finding parking.
                </p>
              </div>
              <div className="s-cta-actions">
                <Link href="/app" className="s-btn s-btn-dark s-btn-lg">
                  Order now <ArrowRight size={18} />
                </Link>
                <Link href="/contact" className="s-btn s-btn-white s-btn-lg">
                  Talk to us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
