import { useScrollReveal } from "./useScrollReveal";

const steps = [
  {
    num: "01",
    title: "Add Your Products",
    description:
      "Add products, prices and organize them into categories.",
  },
  {
    num: "02",
    title: "Manage Customers",
    description:
      "Store customer information and keep customer records organized.",
  },
  {
    num: "03",
    title: "Create Invoices",
    description:
      "Select customers, add products and generate professional invoices.",
  },
  {
    num: "04",
    title: "Track & Grow",
    description:
      "Monitor sales, inventory and business performance.",
  },
];

export default function HowItWorksSection() {
  const sectionRef = useScrollReveal();

  return (
    <section
      id="how-it-works"
      className="lp-section"
      style={{ background: "var(--lp-card)" }}
    >
      <div ref={sectionRef} className="lp-reveal max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            How <span className="lp-accent">StockFlow</span> Works
          </h2>
          <p className="lp-text-muted text-base sm:text-lg max-w-xl mx-auto">
            Simple steps to manage your business efficiently.
          </p>
        </div>

        {/* Timeline */}
        <div className="lp-timeline">
          {steps.map((step, i) => (
            <div key={step.num} className="lp-timeline-step">
              {/* Connector */}
              {i < steps.length - 1 && (
                <div className="lp-timeline-connector" />
              )}

              {/* Dot */}
              <div className="lp-timeline-dot">{step.num}</div>

              {/* Text */}
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-[var(--lp-text)] mb-1.5">
                  {step.title}
                </h3>
                <p className="text-sm lp-text-muted leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
