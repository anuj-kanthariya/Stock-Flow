import {
  Lock,
  CheckCircle2,
  Package,
  Users,
  FileText,
  BarChart3,
} from "lucide-react";
import { useScrollReveal } from "./useScrollReveal";

const dataItems = [
  { icon: Package, label: "Products" },
  { icon: Users, label: "Customers" },
  { icon: FileText, label: "Invoices" },
  { icon: BarChart3, label: "Reports" },
];

const securityFeatures = [
  "Multi-user data isolation",
  "Secure authentication with Google",
  "Account-specific business data",
  "Data is never shared",
];

export default function SecuritySection() {
  const sectionRef = useScrollReveal();

  return (
    <section
      className="lp-section"
      style={{ background: "var(--lp-card)" }}
    >
      <div ref={sectionRef} className="lp-reveal">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Your Data. Your Business.{" "}
            <span className="lp-accent">Always Secure.</span>
          </h2>
          <p className="lp-text-muted text-base sm:text-lg max-w-2xl mx-auto">
            Every StockFlow account has its own business workspace. Your
            products, customers, invoices and inventory belong to your account.
          </p>
        </div>

        {/* Diagram */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 mb-12">
          {/* Business A */}
          <div className="lp-security-card text-center">
            <div className="inline-flex items-center gap-1.5 bg-[var(--lp-accent-glow)] text-[var(--lp-accent)] px-3 py-1 rounded-full text-xs font-semibold mb-4">
              Business A
            </div>
            <div className="space-y-2">
              {dataItems.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-sm lp-text-muted"
                >
                  <Icon className="h-3.5 w-3.5 text-[var(--lp-accent)]" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lock */}
          <div className="lp-lock-icon flex-shrink-0">
            <Lock className="h-7 w-7 text-white" />
          </div>

          {/* Business B */}
          <div className="lp-security-card text-center">
            <div className="inline-flex items-center gap-1.5 bg-red-500/15 text-red-400 px-3 py-1 rounded-full text-xs font-semibold mb-4">
              Business B
            </div>
            <div className="space-y-2">
              {dataItems.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-sm lp-text-muted"
                >
                  <Icon className="h-3.5 w-3.5 text-red-400" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {securityFeatures.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--lp-accent)] flex-shrink-0" />
              <span className="text-sm text-[var(--lp-text-muted)]">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
