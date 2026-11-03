/**
 * Public website content.
 *
 * Everything a human is likely to want to change (contact details, delivery
 * areas, fees, opening hours) lives here so the marketing pages never need to
 * be edited to update the business.
 *
 * The phone numbers below are the live Jotna contact lines. Both are shown in
 * the footer and on the contact page; the first one is the primary line and the
 * one used for WhatsApp links. The email addresses are still placeholders.
 */

export type DeliveryArea = {
  name: string;
  note: string;
  eta: string;
  fee: string;
};

export const deliveryAreas: DeliveryArea[] = [
  { name: "Banjul", note: "Half Die · Banjulunding · Box Bar", eta: "25–35 min", fee: "GMD 45" },
  { name: "Serekunda", note: "Kairaba · Latrikunda · Tallinding", eta: "25–40 min", fee: "GMD 55" },
  { name: "Bakau & Fajara", note: "Bakau New Town · Fajara · Cape Point", eta: "30–45 min", fee: "GMD 60" },
  { name: "Bijilo & Kotu", note: "Bijilo · Kotu · Senegambia", eta: "30–45 min", fee: "GMD 65" },
  { name: "Brikama", note: "Brikama town · Busumbala", eta: "45–60 min", fee: "GMD 85" },
];

/**
 * Contact numbers in dial order. `display` is what visitors read, `href` is the
 * `tel:` target. The `+220` country code lives here — change it in one place if
 * Jotna ever publishes numbers from outside The Gambia.
 */
export const contactNumbers: { display: string; href: string }[] = [
  { display: "+220 877390590", href: "tel:+220877390590" },
  { display: "+220 835364285", href: "tel:+220835364285" },
];

export const site = {
  name: "Jotna",
  legalName: "Jotna Delivery Services",
  tagline: "The Gambia, delivered.",
  description:
    "Jotna delivers food, groceries, pharmacy essentials and parcels from local shops across the Greater Banjul Area. Order online, pay with cash, QMoney or Wave, and track your rider to the gate.",
  url: (process.env.SITE_URL ?? "https://jotna.gm").replace(/\/$/, ""),
  phones: contactNumbers,
  phoneDisplay: contactNumbers[0].display,
  phoneHref: contactNumbers[0].href,
  secondPhoneDisplay: contactNumbers[1].display,
  secondPhoneHref: contactNumbers[1].href,
  whatsapp: "220877390590",
  email: "hello@jotna.gm",
  ridersEmail: "riders@jotna.gm",
  address: {
    street: "Kairaba Avenue",
    locality: "Serekunda",
    region: "Kanifing",
    country: "GM",
    display: "Kairaba Avenue, Serekunda, The Gambia",
  },
  hours: "Monday to Sunday, 9:00 – 22:00",
  currency: "GMD",
  founded: "2026",
  areas: deliveryAreas,
} as const;

export function whatsappLink(message: string, number: string = site.whatsapp) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function mailtoLink(subject: string, email: string = site.email) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
