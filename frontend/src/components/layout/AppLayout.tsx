import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingFlow } from "@/pages/onboarding/OnboardingFlow";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto relative">
          <div className="p-6 page-enter">{children}</div>
          {showOnboarding && <OnboardingFlow onClose={handleDismiss} />}
        </main>
      </div>
    </div>
  );
}
