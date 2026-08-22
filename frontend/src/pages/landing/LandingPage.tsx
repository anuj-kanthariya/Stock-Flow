import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LandingNavbar from "./LandingNavbar";
import HeroSection from "./HeroSection";
import TrustStrip from "./TrustStrip";
import FeaturesSection from "./FeaturesSection";
import HowItWorksSection from "./HowItWorksSection";
import DashboardShowcase from "./DashboardShowcase";
import InvoiceShowcase from "./InvoiceShowcase";
import InventoryShowcase from "./InventoryShowcase";
import SecuritySection from "./SecuritySection";
import AboutSection from "./AboutSection";
import FinalCTA from "./FinalCTA";
import LandingFooter from "./LandingFooter";
import "./landing.css";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // Set page title for landing
  useEffect(() => {
    document.title = "StockFlow — Smart Inventory & Billing Management";
    // Set meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Manage products, inventory, customers and invoices with StockFlow. Smart inventory & billing for growing businesses."
      );
    }
  }, []);

  // While auth is loading, show a minimal placeholder to prevent flash
  if (isLoading) {
    return (
      <div className="landing-page min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--lp-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="landing-page">
      <LandingNavbar isAuthenticated={isAuthenticated} />
      <main>
        <HeroSection isAuthenticated={isAuthenticated} />
        <TrustStrip />
        <FeaturesSection />
        <HowItWorksSection />
        <DashboardShowcase isAuthenticated={isAuthenticated} />
        <InvoiceShowcase />
        <InventoryShowcase />
        <SecuritySection />
        <AboutSection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
