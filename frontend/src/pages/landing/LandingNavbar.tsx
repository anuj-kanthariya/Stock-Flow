import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface LandingNavbarProps {
  isAuthenticated: boolean;
}

export default function LandingNavbar({ isAuthenticated }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

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
          <span className="text-lg font-bold text-[var(--lp-text)] tracking-tight">
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
              className="text-sm font-medium text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] transition-colors no-underline"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

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
                className="text-sm font-medium text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] transition-colors no-underline px-3 py-2"
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
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-[var(--lp-text)] hover:bg-[var(--lp-border)] transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Content */}
      <aside 
        className={`fixed top-0 left-0 h-[100dvh] w-[min(320px,85vw)] bg-[var(--lp-card)] z-[1001] md:hidden transform transition-transform duration-300 ease-in-out flex flex-col border-r border-[var(--lp-border)] overflow-y-auto overflow-x-hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--lp-border)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--lp-accent)] shadow-md">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-[var(--lp-text)] tracking-tight">
              StockFlow
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] hover:bg-[var(--lp-border)] rounded-lg transition-colors flex-shrink-0"
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <button 
              onClick={() => setMobileOpen(false)}
              className="p-2 text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] hover:bg-[var(--lp-border)] rounded-lg transition-colors flex-shrink-0"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Drawer Links */}
        <div className="flex flex-col py-4 px-3 gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleAnchorClick(e, link.href)}
              className="text-base font-medium text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] transition-colors no-underline py-3 px-3 rounded-lg hover:bg-[var(--lp-border)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Drawer Footer (Auth) */}
        <div className="mt-auto p-4 border-t border-[var(--lp-border)] flex flex-col gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="lp-btn-primary !text-base justify-center py-3 w-full text-center"
              onClick={() => setMobileOpen(false)}
            >
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                className="text-base font-medium text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] transition-colors no-underline py-3 px-3 rounded-lg hover:bg-[var(--lp-border)] text-center w-full"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/auth"
                className="lp-btn-primary !text-base justify-center py-3 w-full text-center"
                onClick={() => setMobileOpen(false)}
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </aside>
    </header>
  );
}
