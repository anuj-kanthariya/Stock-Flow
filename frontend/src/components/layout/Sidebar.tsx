import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Tag,
  Users,
  Receipt,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeVariant?: "default" | "destructive" | "warning" | "success";
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Categories", href: "/categories", icon: Tag },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Billing", href: "/billing", icon: ShoppingCart },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

const bottomItems: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export function Sidebar({ mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen?.(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col h-screen bg-card border-r border-border transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          collapsed ? "lg:w-[68px]" : "lg:w-[var(--sidebar-width)]",
          mobileMenuOpen ? "translate-x-0 w-[260px]" : "-translate-x-full w-[260px]"
        )}
      >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border min-h-[var(--navbar-height)]">
        <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md overflow-hidden">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        {(!collapsed || mobileMenuOpen) && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-base font-bold text-foreground leading-none truncate">
              StockFlow
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5 leading-none">
              Wholesale Manager
            </span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {(!collapsed || mobileMenuOpen) && (
          <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Main Menu
          </p>
        )}
        {navItems.map((item) => (
          <NavItem key={item.href} item={item} collapsed={collapsed} />
        ))}

        <div className="my-3 border-t border-border" />
        {(!collapsed || mobileMenuOpen) && (
          <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            System
          </p>
        )}
        {bottomItems.map((item) => (
          <NavItem key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Low Stock Alert */}
      {(!collapsed || mobileMenuOpen) && (
        <div className="mx-3 mb-4 p-3 rounded-xl bg-primary/10 border border-primary/30">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">
              Low Stock Alert
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            23 products are running low on stock.
          </p>
        </div>
      )}

      {/* Collapse Toggle (Desktop only) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3.5 top-[72px] z-10 h-7 w-7 items-center justify-center rounded-full border border-border bg-card shadow-card hover:bg-accent transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
    </aside>
    </>
  );
}

function NavItem({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  // On mobile, force uncollapsed style in the drawer.
  const isCollapsed = collapsed && !window.matchMedia("(max-width: 1024px)").matches;

  return (
    <NavLink
      to={item.href}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-primary/20 text-primary"
            : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
          isCollapsed && "justify-center px-2"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
          )}
          <Icon
            className={cn(
              "h-[18px] w-[18px] flex-shrink-0 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )}
          />
          {!isCollapsed && (
            <span className="truncate">{item.label}</span>
          )}
          {!isCollapsed && item.badge && (
            <Badge
              variant={(item.badgeVariant as any) ?? "default"}
              className="ml-auto text-[10px] h-5 min-w-5 flex items-center justify-center"
            >
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </NavLink>
  );
}
