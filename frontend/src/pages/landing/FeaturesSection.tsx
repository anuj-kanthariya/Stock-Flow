import {
  Package,
  Receipt,
  Users,
  BarChart3,
  Tag,
  Cloud,
} from "lucide-react";
import { useScrollReveal } from "./useScrollReveal";

const features = [
  {
    icon: Package,
    title: "Inventory Management",
    description:
      "Track stock in real time, manage minimum stock alerts and keep your inventory organized.",
  },
  {
    icon: Receipt,
    title: "Smart Billing",
    description:
      "Create professional invoices with automatic calculations and organized billing workflows.",
  },
  {
    icon: Users,
    title: "Customer Management",
    description:
      "Store customer details, track customer history and manage business relationships.",
  },
  {
    icon: BarChart3,
    title: "Business Reports",
    description:
      "Get useful insights into sales, inventory and business performance.",
  },
  {
    icon: Tag,
    title: "Categories",
    description:
      "Organize products into categories for faster inventory management.",
  },
  {
    icon: Cloud,
    title: "Cloud Workspace",
    description:
      "Access your business workspace securely from anywhere.",
  },
];

export default function FeaturesSection() {
  const sectionRef = useScrollReveal();

  return (
    <section id="features" className="lp-section">
      <div ref={sectionRef} className="lp-reveal">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Everything You Need to{" "}
            <span className="lp-accent">Run Your Business</span>
          </h2>
          <p className="lp-text-muted text-base sm:text-lg max-w-2xl mx-auto">
            Powerful tools designed to simplify your daily operations.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, description }, i) => (
            <div
              key={title}
              className={`lp-card p-6 lp-reveal lp-reveal-delay-${i + 1}`}
            >
              <div className="lp-icon-box mb-4">
                <Icon className="h-5 w-5 text-[var(--lp-accent)]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm lp-text-muted leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
