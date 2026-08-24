import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, Tag, Users, Receipt } from "lucide-react";

export function MobileBottomNav() {
  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Products", href: "/products", icon: Package },
    { label: "Categories", href: "/categories", icon: Tag },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Invoices", href: "/invoices", icon: Receipt },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-background border-t border-border pb-[env(safe-area-inset-bottom)]">
      {navItems.map(({ label, href, icon: Icon }) => (
        <NavLink
          key={href}
          to={href}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-[60px] gap-1 transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <Icon className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
