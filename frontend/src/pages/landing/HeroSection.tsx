import { Link } from "react-router-dom";
import {
  Zap,
  IndianRupee,
  Users,
  Package,
  FileText,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Shield,
  Cloud,
  UserPlus,
} from "lucide-react";

interface HeroSectionProps {
  isAuthenticated: boolean;
}

export default function HeroSection({ isAuthenticated }: HeroSectionProps) {
  const handleExploreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.querySelector("#features");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  const benefits = [
    { icon: CheckCircle2, label: "Easy to Use" },
    { icon: Shield, label: "Secure & Private" },
    { icon: Cloud, label: "Cloud Based" },
    { icon: UserPlus, label: "Multi-user" },
  ];

  return (
    <section className="lp-section pt-24 pb-16 md:pt-40 md:pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left — Text */}
        <div className="lp-reveal revealed">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--lp-accent)] bg-[var(--lp-accent-glow)] mb-6">
            <Zap className="h-3.5 w-3.5 text-[var(--lp-accent)]" />
            <span className="text-xs font-semibold text-[var(--lp-accent)] tracking-wide">
              Smart Inventory & Billing Platform
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.15] tracking-tight mb-6">
            Manage Your{" "}
            <span className="lp-accent">Inventory</span>.
            <br className="hidden sm:block" />
            Simplify Your{" "}
            <span className="lp-accent">Billing</span>.
            <br className="hidden sm:block" />
            Grow Your{" "}
            <span className="lp-accent">Business</span>.
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg lp-text-muted leading-relaxed mb-8 max-w-lg">
            StockFlow brings products, inventory, customers and invoicing
            together in one simple workspace.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-8">
            {isAuthenticated ? (
              <Link to="/dashboard" className="lp-btn-primary w-full sm:w-auto justify-center">
                Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            ) : (
              <Link to="/auth" className="lp-btn-primary w-full sm:w-auto justify-center">
                Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            )}
            <button onClick={handleExploreClick} className="lp-btn-secondary w-full sm:w-auto justify-center">
              Explore Features <ArrowDown className="h-4 w-4 ml-2" />
            </button>
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {benefits.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-[var(--lp-accent)]" />
                <span className="text-xs font-medium lp-text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Dashboard Preview */}
        <div className="lp-reveal revealed lp-reveal-delay-2">
          <div className="lp-float">
            <div className="lp-mockup shadow-2xl">
              {/* Top bar */}
              <div className="lp-mockup-topbar">
                <div className="lp-mockup-dot red" />
                <div className="lp-mockup-dot yellow" />
                <div className="lp-mockup-dot green" />
                <span className="text-[11px] lp-text-dim ml-2 font-medium">
                  StockFlow Dashboard
                </span>
              </div>

              <div className="flex">
                {/* Mini Sidebar */}
                <div className="hidden sm:flex flex-col w-[160px] border-r border-[var(--lp-border)] p-3 gap-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-[var(--lp-accent)] flex items-center justify-center">
                      <Zap className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs font-bold text-[var(--lp-text)]">StockFlow</span>
                  </div>
                  {[
                    { icon: TrendingUp, label: "Dashboard", active: true },
                    { icon: Package, label: "Products", active: false },
                    { icon: Users, label: "Customers", active: false },
                    { icon: FileText, label: "Invoices", active: false },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] ${
                        item.active
                          ? "bg-[var(--lp-accent)]/20 text-[var(--lp-accent)]"
                          : "text-[var(--lp-text-dim)]"
                      }`}
                    >
                      <item.icon className="h-3 w-3" />
                      {item.label}
                    </div>
                  ))}
                </div>

                {/* Main Content */}
                <div className="flex-1 p-4">
                  <p className="text-xs lp-text-muted mb-3">
                    Good morning, User 👋
                  </p>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {[
                      { icon: IndianRupee, label: "Revenue", value: "₹1,24,500", color: "text-emerald-400" },
                      { icon: FileText, label: "Invoices", value: "32", color: "text-blue-400" },
                      { icon: Users, label: "Customers", value: "82", color: "text-purple-400" },
                      { icon: Package, label: "Products", value: "156", color: "text-amber-400" },
                    ].map((stat) => (
                      <div key={stat.label} className="lp-stat-mini">
                        <stat.icon className={`h-3.5 w-3.5 ${stat.color} mb-1`} />
                        <p className="text-[10px] lp-text-dim">{stat.label}</p>
                        <p className="text-sm font-bold text-[var(--lp-text)]">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart Area */}
                  <div className="lp-stat-mini mb-4">
                    <p className="text-[10px] font-semibold lp-text-muted mb-2">
                      Sales Overview
                    </p>
                    <div className="h-[80px] flex items-end gap-[3px]">
                      {[40, 55, 45, 65, 58, 72, 68, 80, 75, 90, 85, 95].map(
                        (h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-sm"
                            style={{
                              height: `${h}%`,
                              background:
                                i >= 10
                                  ? "var(--lp-accent)"
                                  : "rgba(255,255,255,0.08)",
                            }}
                          />
                        )
                      )}
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Low Stock Alert */}
                    <div className="lp-stat-mini">
                      <div className="flex items-center gap-1 mb-2">
                        <AlertTriangle className="h-3 w-3 text-red-400" />
                        <p className="text-[10px] font-semibold text-red-400">
                          Low Stock
                        </p>
                      </div>
                      {["iPhone 15 Pro", "Drill Machine", "Office Chair"].map(
                        (item) => (
                          <p key={item} className="text-[10px] lp-text-dim truncate">
                            • {item}
                          </p>
                        )
                      )}
                    </div>

                    {/* Top Products */}
                    <div className="lp-stat-mini">
                      <p className="text-[10px] font-semibold lp-text-muted mb-2">
                        Top Products
                      </p>
                      {[
                        { name: "QLED TV", amt: "₹1.7L" },
                        { name: "Notebooks", amt: "₹25K" },
                        { name: "Rice 25kg", amt: "₹18K" },
                      ].map((item) => (
                        <div
                          key={item.name}
                          className="flex justify-between text-[10px] lp-text-dim"
                        >
                          <span className="truncate">{item.name}</span>
                          <span className="text-[var(--lp-text)] font-medium">{item.amt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
