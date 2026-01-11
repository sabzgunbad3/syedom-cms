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
        "lg:ml-64", // Sidebar width
        "pt-16 lg:pt-0" // Mobile top padding for menu button
      )}>
        <div className="container py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
