import { CheckCircle2, Search } from "lucide-react";
import { useScrollReveal } from "./useScrollReveal";

const features = [
  "Real-time stock updates",
  "Low-stock notifications",
  "Product search and filtering",
  "Category organization",
  "Stock transaction history",
];

const products = [
  { name: "Samsung QLED TV", sku: "SAM-TV-65Q", category: "Electronics", stock: 42, price: "₹85,000", status: "ok" },
  { name: "iPhone 15 Pro Max", sku: "APL-IP15PM", category: "Electronics", stock: 8, price: "₹1,59,900", status: "low" },
  { name: "Formal Shirt (M)", sku: "CLT-SHIRT-M", category: "Clothing", stock: 320, price: "₹1,200", status: "ok" },
  { name: "Basmati Rice 25kg", sku: "GRC-RICE-25", category: "Groceries", stock: 150, price: "₹1,800", status: "ok" },
  { name: "Bosch Drill Machine", sku: "HDW-DRILL-B", category: "Hardware", stock: 5, price: "₹4,500", status: "low" },
  { name: "Office Chair", sku: "FRN-CHR-ERG", category: "Furniture", stock: 3, price: "₹12,000", status: "low" },
];

export default function InventoryShowcase() {
  const sectionRef = useScrollReveal();

  return (
    <section className="lp-section">
      <div ref={sectionRef} className="lp-reveal">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Right on desktop — Product Table (shown first on mobile for visual order) */}
          <div className="order-2 lg:order-1 lp-reveal lp-reveal-delay-2">
            <div className="lp-mockup shadow-2xl">
              <div className="lp-mockup-topbar">
                <div className="lp-mockup-dot red" />
                <div className="lp-mockup-dot yellow" />
                <div className="lp-mockup-dot green" />
                <span className="text-[11px] lp-text-dim ml-2 font-medium">
                  Products
                </span>
              </div>

              {/* Search bar */}
              <div className="px-4 py-3 border-b border-[var(--lp-border)]">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--lp-card-secondary)] border border-[var(--lp-border)]">
                  <Search className="h-3 w-3 lp-text-dim" />
                  <span className="text-[11px] lp-text-dim">Search products...</span>
                </div>
              </div>

              {/* Table */}
              <div className="lp-inventory-row header">
                <span>Product</span>
                <span className="hide-mobile">Category</span>
                <span>Stock</span>
                <span className="hide-mobile">Price</span>
                <span>Status</span>
              </div>
              {products.map((p) => (
                <div
                  key={p.sku}
                  className="lp-inventory-row text-[var(--lp-text-muted)]"
                >
                  <div>
                    <span className="text-white font-medium text-[12px] block truncate">
                      {p.name}
                    </span>
                    <span className="text-[10px] lp-text-dim">{p.sku}</span>
                  </div>
                  <span className="hide-mobile text-[12px]">{p.category}</span>
                  <span className="text-[12px]">{p.stock}</span>
                  <span className="hide-mobile text-[12px]">{p.price}</span>
                  <span>
                    {p.status === "low" ? (
                      <span className="lp-badge-low">Low</span>
                    ) : (
                      <span className="lp-badge-ok">In Stock</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Left on desktop — Text */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Never Lose Track of{" "}
              <span className="lp-accent">Your Stock</span>
            </h2>
            <p className="lp-text-muted text-base sm:text-lg leading-relaxed mb-6 max-w-lg">
              Keep your inventory organized and know when products need
              attention.
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
        </div>
      </div>
    </section>
  );
}
