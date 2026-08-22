import { useScrollReveal } from "./useScrollReveal";

export default function AboutSection() {
  const sectionRef = useScrollReveal();

  return (
    <section id="about" className="lp-section">
      <div ref={sectionRef} className="lp-reveal text-center max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Built to Make Business Management{" "}
          <span className="lp-accent">Simpler</span>
        </h2>
        <p className="lp-text-muted text-base sm:text-lg leading-relaxed">
          StockFlow is designed for businesses that want a simple way to manage
          inventory, customers and billing without juggling multiple tools.
        </p>
      </div>
    </section>
  );
}
