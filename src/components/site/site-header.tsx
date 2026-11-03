"use client";

import Link from "next/link";
import { Menu, Navigation, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/#services", label: "What we deliver" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#coverage", label: "Coverage & fees" },
  { href: "/riders", label: "For riders" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="s-header">
      <div className="site-shell s-header-inner">
        <Link href="/" className="s-logo" aria-label="Jotna — home" onClick={() => setOpen(false)}>
          <span className="s-logo-mark"><Navigation size={18} fill="currentColor" /></span>
          <span>jotna<span className="s-logo-dot">.</span></span>
        </Link>

        <nav className="s-nav" aria-label="Main">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
        </nav>

        <div className="s-header-actions">
          <Link href="/app" className="s-header-signin">Sign in</Link>
          <Link href="/app" className="s-btn s-btn-dark s-btn-sm">Order now</Link>
          <button
            type="button"
            className="s-menu-btn"
            aria-expanded={open}
            aria-controls="site-mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div id="site-mobile-menu" className={`s-mobile-panel ${open ? "s-mobile-open" : ""}`}>
        <div className="site-shell">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>
          ))}
          <div className="s-mobile-cta">
            <Link href="/app" className="s-btn s-btn-dark s-btn-block" onClick={() => setOpen(false)}>Order now</Link>
            <Link href="/app" className="s-btn s-btn-outline s-btn-block" onClick={() => setOpen(false)}>Sign in</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
