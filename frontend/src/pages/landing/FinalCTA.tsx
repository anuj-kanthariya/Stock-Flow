import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "./useScrollReveal";

export default function FinalCTA() {
  const sectionRef = useScrollReveal();

  return (
    <section className="lp-section">
      <div ref={sectionRef} className="lp-reveal">
        <div className="lp-cta-section px-8 py-16 sm:px-16 sm:py-20 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-white">
            Ready to Take Control of{" "}
            <span className="lp-accent">Your Business</span>?
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto mb-8">
            Start managing your inventory, customers and invoices with
            StockFlow.
          </p>
          <Link to="/auth" className="lp-btn-primary text-base">
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
