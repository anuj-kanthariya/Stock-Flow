import { Link } from "react-router-dom";
import {
  Zap,
  TrendingUp,
  IndianRupee,
  Users,
  Package,
  FileText,
  AlertTriangle,
  BarChart3,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useScrollReveal } from "./useScrollReveal";

interface DashboardShowcaseProps {
  isAuthenticated: boolean;
}

const features = [
  "Real-time business overview",
  "Sales & revenue analytics",
  "Low stock alerts",
  "Top selling products",
  "Invoice and customer summary",
];

export default function DashboardShowcase({
  isAuthenticated,
}: DashboardShowcaseProps) {
  const sectionRef = useScrollReveal();

  return (
    <section className="lp-section">
      <div ref={sectionRef} className="lp-reveal">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Text */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything{" "}
              <span className="lp-accent">at a Glance</span>
            </h2>
            <p className="lp-text-muted text-base sm:text-lg leading-relaxed mb-6 max-w-lg">
              Get a clear overview of your business with a dashboard designed
              around the information that matters.
            </p>

            <ul className="space-y-3 mb-8">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[var(--lp-accent)] flex-shrink-0" />
                  <span className="text-sm text-[var(--lp-text-muted)]">
                    {f}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              to={isAuthenticated ? "/dashboard" : "/auth"}
              className="lp-btn-secondary"
            >
              View Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Right — Dashboard Mockup */}
          <div className="lp-reveal lp-reveal-delay-2">
            <div className="lp-mockup shadow-2xl">
              <div className="lp-mockup-topbar">
                <div className="lp-mockup-dot red" />
                <div className="lp-mockup-dot yellow" />
                <div className="lp-mockup-dot green" />
                <span className="text-[11px] lp-text-dim ml-2 font-medium">
                  Dashboard
                </span>
              </div>

              <div className="flex">
                {/* Sidebar */}
                <div className="hidden md:flex flex-col w-[140px] border-r border-[var(--lp-border)] p-3 gap-0.5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-md bg-[var(--lp-accent)] flex items-center justify-center">
                      <Zap className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-white">
                      StockFlow
                    </span>
                  </div>
                  {[
                    { icon: BarChart3, label: "Dashboard", active: true },
                    { icon: Package, label: "Products" },
                    { icon: Users, label: "Customers" },
                    { icon: FileText, label: "Invoices" },
                    { icon: TrendingUp, label: "Reports" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] ${
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

                {/* Content */}
                <div className="flex-1 p-4 space-y-3">
                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {
                        icon: IndianRupee,
                        label: "Revenue",
                        value: "₹1,24,500",
                        change: "+12%",
                        color: "text-emerald-400",
                      },
                      {
                        icon: FileText,
                        label: "Invoices",
                        value: "32",
                        change: "+4",
                        color: "text-blue-400",
                      },
                      {
                        icon: Users,
                        label: "Customers",
                        value: "82",
                        change: "+7",
                        color: "text-purple-400",
                      },
                      {
                        icon: Package,
                        label: "Products",
                        value: "156",
                        color: "text-amber-400",
                      },
                    ].map((stat) => (
                      <div key={stat.label} className="lp-stat-mini">
                        <div className="flex items-center justify-between mb-1">
                          <stat.icon
                            className={`h-3 w-3 ${stat.color}`}
                          />
                          {stat.change && (
                            <span className="text-[9px] text-emerald-400 font-medium">
                              {stat.change}
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] lp-text-dim">{stat.label}</p>
                        <p className="text-xs font-bold text-white">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Chart */}
                  <div className="lp-stat-mini">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-semibold lp-text-muted">
                        Sales Overview
                      </p>
                      <p className="text-[9px] lp-text-dim">Last 7 months</p>
                    </div>
                    {/* Area chart mockup */}
                    <div className="h-[72px] relative">
                      <svg
                        viewBox="0 0 200 60"
                        className="w-full h-full"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient
                            id="chartGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="var(--lp-accent)"
                              stopOpacity="0.3"
                            />
                            <stop
                              offset="100%"
                              stopColor="var(--lp-accent)"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,45 L30,35 L60,40 L90,25 L120,20 L150,28 L180,12 L200,8 L200,60 L0,60 Z"
                          fill="url(#chartGrad)"
                        />
                        <path
                          d="M0,45 L30,35 L60,40 L90,25 L120,20 L150,28 L180,12 L200,8"
                          fill="none"
                          stroke="var(--lp-accent)"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Bottom */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="lp-stat-mini">
                      <div className="flex items-center gap-1 mb-1.5">
                        <AlertTriangle className="h-2.5 w-2.5 text-red-400" />
                        <p className="text-[9px] font-semibold text-red-400">
                          Low Stock
                        </p>
                      </div>
                      {["iPhone 15 Pro", "Drill Machine"].map((item) => (
                        <p
                          key={item}
                          className="text-[9px] lp-text-dim truncate"
                        >
                          • {item}
                        </p>
                      ))}
                    </div>
                    <div className="lp-stat-mini">
                      <p className="text-[9px] font-semibold lp-text-muted mb-1.5">
                        Top Products
                      </p>
                      {[
                        { n: "QLED TV", v: "₹1.7L" },
                        { n: "Notebooks", v: "₹25K" },
                      ].map((item) => (
                        <div
                          key={item.n}
                          className="flex justify-between text-[9px] lp-text-dim"
                        >
                          <span className="truncate">{item.n}</span>
                          <span className="text-white font-medium">
                            {item.v}
                          </span>
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
