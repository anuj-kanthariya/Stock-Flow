import { Bell, Moon, Sun, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get initials for Avatar Fallback
  const initials = user?.name 
    ? user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() 
    : "??";
  
  const getFullLogoUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${url}`;
  };

  return (
    <header className="sticky top-0 z-30 flex h-[var(--navbar-height)] items-center justify-between border-b border-border bg-background/95 backdrop-blur-md px-6">
      {/* Left: Company Logo & Name */}
      <div className="flex items-center gap-3 flex-1 overflow-hidden pr-4">
        <div className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-primary/10 border border-border flex items-center justify-center overflow-hidden">
          {user?.company_logo_url ? (
            <img src={getFullLogoUrl(user.company_logo_url)} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs sm:text-sm font-semibold text-primary">
              {user?.company_name ? user.company_name.substring(0, 2).toUpperCase() : "MB"}
            </span>
          )}
        </div>
        <h1 
          className="text-[20px] sm:text-[22px] font-medium text-foreground/90 tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg" 
          title={user?.company_name || "My Business"}
        >
          {user?.company_name || "My Business"}
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Search className="h-4.5 w-4.5" />
          <span className="sr-only">Search</span>
        </Button>
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" id="navbar-notifications">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          id="navbar-theme-toggle"
          aria-label="Toggle theme"
          className="text-muted-foreground hover:text-foreground"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-4.5 w-4.5" />
          ) : (
            <Moon className="h-4.5 w-4.5" />
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              id="navbar-user-menu"
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-accent/10 transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url || ""} alt={user?.name || "User"} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-sm font-medium leading-none truncate max-w-[150px]">
                  {user?.name || "User"}
                </span>
                <span className="text-xs text-muted-foreground leading-none mt-1 capitalize truncate max-w-[150px]">
                  {user?.role || "Owner"}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.company_name || "My Business"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.name || "Owner"} • {user?.email || "user@example.com"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              Profile
            </DropdownMenuItem>
            {user?.role === "owner" && (
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              danger
              onClick={handleLogout}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
