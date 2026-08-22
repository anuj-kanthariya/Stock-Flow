import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingFlow } from "@/pages/onboarding/OnboardingFlow";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  // Ensure user is typed correctly with profile_completed
  const showOnboarding = user && user.profile_completed === false;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto relative">
          <div className="p-6 page-enter">{children}</div>
          {showOnboarding && <OnboardingFlow />}
        </main>
      </div>
    </div>
  );
}
