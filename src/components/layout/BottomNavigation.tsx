import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Milk, 
  Users, 
  CreditCard, 
  MoreHorizontal,
  Truck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Truck, label: "Milk", path: "/deliveries" },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: CreditCard, label: "Payments", path: "/payments" },
  { icon: MoreHorizontal, label: "More", path: "/settings" },
];

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === "/deliveries" && location.pathname === "/production");
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 active:scale-95",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-8 rounded-full transition-colors",
                isActive && "bg-primary/10"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
