import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingFlow } from "@/pages/onboarding/OnboardingFlow";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const dismissed = localStorage.getItem(`onboardingDismissed_${user.id}`);
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    }
  }, [user?.id]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (user?.id) {
      localStorage.setItem(`onboardingDismissed_${user.id}`, "true");
    }
  };

  // Ensure user is typed correctly with profile_completed
  const showOnboarding = user && user.profile_completed === false && !isDismissed;

  return (
    <div className="flex h-screen overflow-hidden bg-background w-full">
      {/* Sidebar */}
      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        <Navbar onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative w-full md:pb-0 pb-[calc(4rem+env(safe-area-inset-bottom))]">
          <div className="p-4 md:p-6 page-enter w-full max-w-full">{children}</div>
          {showOnboarding && <OnboardingFlow onClose={handleDismiss} />}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
