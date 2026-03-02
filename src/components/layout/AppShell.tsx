import { ReactNode, useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import TopHeader from "./TopHeader";
import Breadcrumbs from "./Breadcrumbs";

function useIsTablet() {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsTablet(w >= 768 && w < 1024);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isTablet;
}

interface AppShellProps {
  children: ReactNode;
  pageTitle?: string;
  alertCount?: number;
}

export default function AppShell({ children, pageTitle, alertCount }: AppShellProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar - hidden on mobile */}
      {!isMobile && (
        <Sidebar collapsed={isTablet} />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader pageTitle={pageTitle} alertCount={alertCount} />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-24 lg:pb-8">
          <div className="max-w-5xl mx-auto w-full">
            <Breadcrumbs />
            {children}
          </div>
        </main>

        {/* Bottom nav - mobile only */}
        {isMobile && <BottomNav />}
      </div>
    </div>
  );
}
