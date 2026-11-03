import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Smartphone,
  Star,
  Wallet,
} from "lucide-react";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Become a rider",
  description:
    "Ride with Jotna in the Greater Banjul Area. Flexible hours, weekly payouts, and 100% of your tips. Apply on WhatsApp in minutes.",
  alternates: { canonical: "/riders" },
  openGraph: {
    title: "Become a Jotna rider",
    description: "Flexible hours, weekly payouts and 100% of your tips. Ride with Jotna in The Gambia.",
    images: ["/photos/hero-rider.jpg"],
  },
};

const requirements = [
  { icon: Bike, title: "Your own bike", copy: "A motorbike or bicycle in good working order. We do not provide vehicles." },
  { icon: BadgeCheck, title: "Licence & ID", copy: "A valid Gambian driving licence for motorbikes and a national ID card." },
  { icon: Smartphone, title: "A smartphone", copy: "Any phone with a browser and a data bundle — there is no app to download." },
  { icon: MapPin, title: "Know your area", copy: "Confidence finding addresses in Banjul, Serekunda, Bakau or the West Coast." },
];

const payoutRows = [
  { deliveries: "6 deliveries", avg: "GMD 45", day: "GMD 270", week: "GMD 1,620" },
  { deliveries: "10 deliveries", avg: "GMD 45", day: "GMD 450", week: "GMD 2,700" },
  { deliveries: "14 deliveries", avg: "GMD 45", day: "GMD 630", week: "GMD 3,780" },
];

const riderFaqs = [
  {
    q: "How much does a rider earn?",
    a: "Rider payouts range from GMD 35 to GMD 70 per completed delivery depending on distance and order value, and you keep 100% of any tip the customer gives you. The table above is an illustration, not a guarantee — earnings depend on how often you ride and how busy your area is.",
  },
  {
    q: "When do I get paid?",
    a: "Payouts are settled weekly by Wave or QMoney to the number you register with, and we reconcile cash orders at the same time. You can see your completed deliveries and earnings inside the rider workspace.",
  },
  {
    q: "Do I have to ride every day?",
    a: "No. You choose your own hours and switch yourself online when you are ready to take deliveries. Many of our riders work mornings or evenings around another job or classes.",
  },
  {
    q: "How do I apply?",
    a: "Message us on WhatsApp with your name, the area you want to ride in, and whether you have a motorbike or bicycle. Our operations team will invite you in, check your documents and activate your rider account.",
  },
  {
    q: "Do I need a delivery bag?",
    a: "Yes — an insulated bag is provided when you are onboarded, and it must be used for food orders so that meals arrive hot.",
  },
  {
    q: "What happens if a customer is not answering?",
    a: "Call the customer through the app, wait at the agreed spot and let the operations team know. Our team handles the exception with the customer, and you are paid for the trip.",
  },
];

export default function RidersPage() {
  return (
    <>
      <section className="s-page-hero">
        <div className="site-shell">
          <nav className="s-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <ChevronRight size={13} /> <span>For riders</span>
          </nav>
          <h1>Your bike. Your hours.<br /><em>Your money.</em></h1>
          <p>
            Ride for Jotna and move food, market shopping and parcels across the Greater Banjul
            Area. Take the deliveries that fit your day, get paid every week, and keep every tip.
          </p>
          <div className="s-page-actions">
            <a
              className="s-btn s-btn-dark s-btn-lg"
              href={whatsappLink("Hi Jotna! I would like to apply to ride. My name is ____, I ride a ____ and my area is ____.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Apply on WhatsApp <ArrowRight size={18} />
            </a>
            <a className="s-btn s-btn-outline s-btn-lg" href="#earnings">
              See rider earnings
            </a>
          </div>
        </div>
      </section>

      <section className="site-section-tight">
        <div className="site-shell">
          <div className="s-card-grid-4">
            <article className="s-card">
              <span className="s-icon-tile"><Wallet size={19} /></span>
              <h3>GMD 35–70 / delivery</h3>
              <p>Payout depends on distance and order value, shown before you accept.</p>
            </article>
            <article className="s-card">
              <span className="s-icon-tile"><CalendarDays size={19} /></span>
              <h3>Weekly payouts</h3>
              <p>Settled by Wave or QMoney, with every trip visible in your workspace.</p>
            </article>
            <article className="s-card">
              <span className="s-icon-tile"><Star size={19} /></span>
              <h3>100% of tips</h3>
              <p>When a customer tips, the whole amount is yours. Jotna takes nothing.</p>
            </article>
            <article className="s-card">
              <span className="s-icon-tile"><Clock3 size={19} /></span>
              <h3>Ride when you want</h3>
              <p>Go online when you are free and offline when you are done. No shifts.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="site-section" style={{ paddingTop: 0 }}>
        <div className="site-shell">
          <div className="s-split">
            <div className="s-media s-media-wide">
              <Image
                src="/photos/hero-rider.jpg"
                alt="A Jotna rider with his delivery backpack, ready to ride in the Greater Banjul Area"
                width={1408}
                height={768}
                sizes="(max-width: 1024px) 100vw, 46vw"
              />
              <span className="s-media-tag"><ShieldCheck size={15} /> Onboarded by our team</span>
            </div>
            <div>
              <span className="s-eyebrow">What you need</span>
              <h2 className="s-display">Simple to <em>start</em>.</h2>
              <p className="s-lede">
                No joining fee, no vehicle deposit, no long forms. If you have a bike and know your
                area, we can usually get you riding within a few days.
              </p>
              <div className="s-card-grid" style={{ marginTop: 26, gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
                {requirements.map(({ icon: Icon, title, copy }) => (
                  <article key={title} className="s-card" style={{ padding: "20px 18px" }}>
                    <span className="s-icon-tile"><Icon size={18} /></span>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="earnings" className="site-section" style={{ background: "#f4f1e7", borderBlock: "1px solid rgba(28,52,38,.07)" }}>
        <div className="site-shell">
          <div className="s-section-head">
            <div>
              <span className="s-eyebrow">Rider earnings</span>
              <h2 className="s-display">What a week <em>can look like</em>.</h2>
              <p className="s-lede">
                An illustration at a GMD 45 average payout, riding six days a week. Real earnings
                depend on your area, the time of day and how often you go online.
              </p>
            </div>
          </div>
          <div className="s-cover-card">
            <div className="s-cover-card-head">
              <h3>Example weekly earnings</h3>
              <span className="s-badge-soft">Illustrative only</span>
            </div>
            <table className="s-table">
              <thead>
                <tr>
                  <th scope="col">Daily deliveries</th>
                  <th scope="col">Average payout</th>
                  <th scope="col">Per day</th>
                  <th scope="col">6-day week</th>
                </tr>
              </thead>
              <tbody>
                {payoutRows.map((row) => (
                  <tr key={row.deliveries}>
                    <td><b>{row.deliveries}</b></td>
                    <td className="muted">{row.avg}</td>
                    <td>{row.day}</td>
                    <td><b>{row.week}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="s-cover-note">
              <Wallet size={14} />
              Tips are extra and go to you in full. Rider partners are independent contractors and
              cover their own fuel; payouts are gross earnings before fuel and data.
            </p>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-shell">
          <div className="s-section-head">
            <div>
              <span className="s-eyebrow">How to join</span>
              <h2 className="s-display">Three steps to <em>your first trip</em>.</h2>
            </div>
          </div>
          <div className="s-steps">
            <article className="s-step">
              <span className="s-step-num">01</span>
              <h3>Message the team</h3>
              <p>
                Send your name, your area and your bike type on WhatsApp. We reply with the next
                onboarding date.
              </p>
              <span className="s-step-note"><Check size={13} /> Takes five minutes</span>
            </article>
            <article className="s-step">
              <span className="s-step-num">02</span>
              <h3>Bring your documents</h3>
              <p>
                We check your ID, licence and bike, hand over your insulated bag and activate your
                rider account.
              </p>
              <span className="s-step-note"><Check size={13} /> At our Serekunda desk</span>
            </article>
            <article className="s-step">
              <span className="s-step-num">03</span>
              <h3>Go online and ride</h3>
              <p>
                See the delivery queue near you, accept a trip, and follow the pickup and drop-off
                details in your rider workspace.
              </p>
              <span className="s-step-note"><Check size={13} /> Get paid weekly</span>
            </article>
          </div>
        </div>
      </section>

      <section className="site-section" style={{ paddingTop: 0 }}>
        <div className="site-shell">
          <div className="s-faq-grid">
            <div>
              <span className="s-eyebrow">Rider questions</span>
              <h2 className="s-display">Before you <em>ride</em>.</h2>
              <p className="s-lede">
                Anything else? Message the rider team directly — they answer between 9:00 and
                22:00.
              </p>
              <div className="s-faq-aside" style={{ marginTop: 28 }}>
                <h3>Rider support</h3>
                <p>Applications, payouts and trip questions.</p>
                <div className="s-faq-contact">
                  <a href={whatsappLink("Hi Jotna! I have a question about riding with you.")} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={16} /> WhatsApp the rider team
                  </a>
                  <a href={site.phoneHref}>
                    <Phone size={16} /> Call {site.phoneDisplay}
                  </a>
                  <a href={`mailto:${site.ridersEmail}`}>
                    <ArrowRight size={16} /> {site.ridersEmail}
                  </a>
                </div>
              </div>
            </div>
            <div className="s-faq-list">
              {riderFaqs.map((faq) => (
                <details key={faq.q} className="s-faq-item">
                  <summary>{faq.q}</summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="site-section-tight">
        <div className="site-shell">
          <div className="s-cta-band">
            <div className="s-cta-inner">
              <div>
                <span className="s-eyebrow">Ready to ride?</span>
                <h2>Let’s get you on the road.</h2>
                <p>
                  Send one message and our team will take it from there. Bring your bike, your
                  documents and your knowledge of the neighbourhood.
                </p>
              </div>
              <div className="s-cta-actions">
                <a
                  className="s-btn s-btn-dark s-btn-lg"
                  href={whatsappLink("Hi Jotna! I would like to apply to ride. My name is ____, I ride a ____ and my area is ____.")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apply to ride <ArrowRight size={18} />
                </a>
                <Link href="/contact" className="s-btn s-btn-white s-btn-lg">Contact us</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
