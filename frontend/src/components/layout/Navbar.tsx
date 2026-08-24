import { Bell, Moon, Sun, Search, Menu, MoreVertical, Settings } from "lucide-react";
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
import { getNormalizedImageUrl } from "@/lib/image-utils";
interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
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

  const resolvedAvatar = getNormalizedImageUrl(user?.avatar_url);
  const resolvedLogo = getNormalizedImageUrl(user?.company_logo_url);

  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-[var(--navbar-height)] items-center justify-between border-b border-border bg-background/95 backdrop-blur-md px-3 md:px-6 w-full">
      {/* Left: Company Logo & Name */}
      <div className="flex items-center gap-2 md:gap-3 flex-1 overflow-hidden pr-2">
        {onMenuToggle && (
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0 h-9 w-9 -ml-1 mr-1" onClick={onMenuToggle}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        )}
        <div className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-primary/10 border border-border flex items-center justify-center overflow-hidden">
          {resolvedLogo ? (
            <img src={resolvedLogo} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs sm:text-sm font-semibold text-primary">
              {user?.company_name ? user.company_name.substring(0, 2).toUpperCase() : "MB"}
            </span>
          )}
        </div>
        <h1 
          className="text-[16px] sm:text-[20px] md:text-[22px] font-medium text-foreground/90 tracking-tight truncate max-w-[120px] sm:max-w-xs md:max-w-md lg:max-w-lg" 
          title={user?.company_name || "My Business"}
        >
          {user?.company_name || "My Business"}
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Search */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Search className="h-4.5 w-4.5" />
          <span className="sr-only">Search</span>
        </Button>

        {/* Desktop Only: Notifications & Theme */}
        <div className="hidden md:flex items-center gap-2">
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
        </div>

        {/* User Menu (Desktop) */}
        <div className="hidden md:block">
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              id="navbar-user-menu"
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-accent/10 transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={resolvedAvatar} alt={user?.name || "User"} />
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

        {/* 3-Dot Menu (Mobile) */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More options">
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal text-xs text-muted-foreground uppercase tracking-wider">
                Menu
              </DropdownMenuLabel>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" /> Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {resolvedTheme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <div className="flex items-center w-full">
                  <Avatar className="h-5 w-5 mr-2">
                    <AvatarImage src={resolvedAvatar} />
                    <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                  </Avatar>
                  Profile
                </div>
              </DropdownMenuItem>
              {user?.role === "owner" && (
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
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
      </div>
    </header>
  );
}
