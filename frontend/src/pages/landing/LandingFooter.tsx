import { Zap } from "lucide-react";

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
];

const companyLinks = [
  { label: "About", href: "#about" },
];

const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
  if (href.startsWith("#")) {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  }
};

export default function LandingFooter() {
  return (
    <footer className="lp-footer" role="contentinfo">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--lp-accent)]">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-[var(--lp-text)]">StockFlow</span>
            </div>
            <p className="text-sm lp-text-muted leading-relaxed max-w-xs">
              Smart inventory & billing management for growing businesses.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--lp-text)] mb-4">Product</h4>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => handleAnchorClick(e, link.href)}
                    className="text-sm lp-text-muted hover:text-[var(--lp-text)] transition-colors no-underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--lp-text)] mb-4">Company</h4>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => handleAnchorClick(e, link.href)}
                    className="text-sm lp-text-muted hover:text-[var(--lp-text)] transition-colors no-underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--lp-text)] mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li>
                <span className="text-sm lp-text-dim cursor-default">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-sm lp-text-dim cursor-default">
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-[var(--lp-border)] pt-6">
          <p className="text-xs lp-text-dim text-center">
            © {new Date().getFullYear()} StockFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
