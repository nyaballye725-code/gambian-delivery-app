import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import "../site.css";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site">
      <a href="#main" className="s-skip">Skip to content</a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
