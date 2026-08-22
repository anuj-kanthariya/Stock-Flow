import {
  Package,
  Zap as Lightning,
  Receipt,
  Users,
  Shield,
  Cloud,
} from "lucide-react";

const items = [
  { icon: Package, label: "Inventory Management" },
  { icon: Lightning, label: "Fast Invoicing" },
  { icon: Receipt, label: "GST Ready" },
  { icon: Users, label: "Multi-user Access" },
  { icon: Shield, label: "Secure Data" },
  { icon: Cloud, label: "Cloud Based" },
];

export default function TrustStrip() {
  return (
    <section className="border-y border-[var(--lp-border)] bg-[var(--lp-card)]">
      <div className="max-w-[1200px] mx-auto px-6 py-5">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {items.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-[var(--lp-text-muted)]"
            >
              <Icon className="h-4 w-4 text-[var(--lp-accent)] flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
