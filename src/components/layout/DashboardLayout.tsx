import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
}

export function DashboardLayout({ children, onLogout }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar onLogout={onLogout} />
      <main className={cn(
        "min-h-screen transition-all duration-300",
        "lg:ml-64", // Sidebar width on desktop
        "pt-14 lg:pt-0", // Mobile top padding for menu button
        "pb-16 lg:pb-0" // Mobile bottom padding for bottom nav
      )}>
        <div className="container py-4 lg:py-8 px-4 lg:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
