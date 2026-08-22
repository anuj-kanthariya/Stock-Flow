import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, Menu, X } from "lucide-react";

interface LandingNavbarProps {
  isAuthenticated: boolean;
}

export default function LandingNavbar({ isAuthenticated }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "About", href: "#about" },
  ];

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
      setMobileOpen(false);
    }
  };

  return (
    <header className={`lp-navbar ${scrolled ? "scrolled" : ""}`} role="banner">
      <nav
        className="flex items-center justify-between max-w-[1200px] mx-auto"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <a
          href="#"
          className="flex items-center gap-2.5 no-underline"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="StockFlow — Back to top"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--lp-accent)] shadow-md">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            StockFlow
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleAnchorClick(e, link.href)}
              className="text-sm font-medium text-[var(--lp-text-muted)] hover:text-white transition-colors no-underline"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="lp-btn-primary !py-2.5 !px-5 !text-sm"
            >
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                className="text-sm font-medium text-[var(--lp-text-muted)] hover:text-white transition-colors no-underline px-3 py-2"
              >
                Login
              </Link>
              <Link
                to="/auth"
                className="lp-btn-primary !py-2.5 !px-5 !text-sm"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/10 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-[var(--lp-border)]">
          <div className="flex flex-col gap-1 pt-4 max-w-[1200px] mx-auto">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="text-sm font-medium text-[var(--lp-text-muted)] hover:text-white transition-colors no-underline py-2.5 px-3 rounded-lg hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-[var(--lp-border)] mt-2 pt-3 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="lp-btn-primary !text-sm justify-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="text-sm font-medium text-[var(--lp-text-muted)] hover:text-white transition-colors no-underline py-2.5 px-3 rounded-lg hover:bg-white/5"
                    onClick={() => setMobileOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/auth"
                    className="lp-btn-primary !text-sm justify-center"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
