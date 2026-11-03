import type { Metadata } from "next";
import DashboardApp from "@/app/dashboard";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Jotna to order from local shops, track a delivery, ride with us or manage the marketplace.",
  robots: { index: false, follow: false },
};

export default function AppPage() {
  return <DashboardApp />;
}
