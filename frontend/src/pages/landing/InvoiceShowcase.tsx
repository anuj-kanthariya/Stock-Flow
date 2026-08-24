import { CheckCircle2, Zap } from "lucide-react";
import { useScrollReveal } from "./useScrollReveal";

const features = [
  "Automatic calculations",
  "GST/tax calculations",
  "Professional invoice format",
  "Easy invoice management",
  "Customer-linked invoices",
];

const invoiceItems = [
  { name: "Samsung 65\" QLED TV", qty: 2, price: "₹74,000", total: "₹1,48,000" },
  { name: "Men's Formal Shirt", qty: 10, price: "₹850", total: "₹8,500" },
  { name: "Classmate Notebooks", qty: 50, price: "₹140", total: "₹7,000" },
];

export default function InvoiceShowcase() {
  const sectionRef = useScrollReveal();

  return (
    <section className="lp-section" style={{ background: "var(--lp-card)" }}>
      <div ref={sectionRef} className="lp-reveal">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Text */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Create Professional Invoices{" "}
              <span className="lp-accent">in Seconds</span>
            </h2>
            <p className="lp-text-muted text-base sm:text-lg leading-relaxed mb-6 max-w-lg">
              Generate clean, professional invoices while keeping customers,
              products and totals organized.
            </p>

            <ul className="space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[var(--lp-accent)] flex-shrink-0" />
                  <span className="text-sm text-[var(--lp-text-muted)]">
                    {f}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — Invoice Mockup */}
          <div className="lp-reveal lp-reveal-delay-2">
            <div className="lp-invoice-mockup shadow-2xl max-w-md mx-auto lg:ml-auto">
              {/* Header */}
              <div className="lp-invoice-header">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-bold">StockFlow</span>
                  </div>
                  <span className="text-xs font-semibold opacity-80">
                    INVOICE
                  </span>
                </div>
                <div className="flex justify-between text-[11px] opacity-80">
                  <div>
                    <p className="font-semibold">INV-2024-1042</p>
                    <p>Date: 15 Aug 2024</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Demo Customer</p>
                    <p>Mumbai, India</p>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="lp-invoice-row header">
                <span>Item</span>
                <span className="hide-mobile">Qty</span>
                <span>Price</span>
                <span>Total</span>
              </div>
              {invoiceItems.map((item) => (
                <div key={item.name} className="lp-invoice-row text-[var(--lp-text-muted)]">
                  <span className="text-[var(--lp-text)] font-medium truncate">
                    {item.name}
                  </span>
                  <span className="hide-mobile">{item.qty}</span>
                  <span>{item.price}</span>
                  <span className="text-[var(--lp-text)]">{item.total}</span>
                </div>
              ))}

              {/* Totals */}
              <div className="p-5 space-y-2">
                <div className="flex justify-between text-sm lp-text-muted">
                  <span>Subtotal</span>
                  <span className="text-[var(--lp-text)]">₹1,63,500</span>
                </div>
                <div className="flex justify-between text-sm lp-text-muted">
                  <span>GST (18%)</span>
                  <span className="text-[var(--lp-text)]">₹29,430</span>
                </div>
                <div className="border-t border-[var(--lp-border)] pt-2 flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="lp-accent">₹1,92,930</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
