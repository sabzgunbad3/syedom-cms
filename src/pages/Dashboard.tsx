import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useCustomers } from "@/hooks/useCustomers";
import { useProduction } from "@/hooks/useProduction";
import { useDeliveries } from "@/hooks/useDeliveries";
import { usePayments } from "@/hooks/usePayments";
import { useSyncEngine } from "@/hooks/useSyncEngine";
import { useCurrency } from "@/contexts/CurrencyContext";
import { SetupWizard } from "@/components/onboarding/SetupWizard";
import { getAllFromStore, isAppSetupComplete } from "@/lib/offlineDB";
import { Milk, Users, Truck, Plus, ArrowRight, AlertCircle, WifiOff, RefreshCw } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, isFirstLogin, setIsFirstLogin, isOfflineSession } = useAuth();
  const { customers, loading: customersLoading } = useCustomers();
  const { entries, getTodayProduction, getWeeklyStats, loading: productionLoading } = useProduction();
  const { deliveries, getTodayStats, loading: deliveriesLoading } = useDeliveries();
  const { payments, getTotalReceived, loading: paymentsLoading } = usePayments();
  const { isOnline, syncStatus, pendingCount, syncData } = useSyncEngine();
  const { formatAmount, currency } = useCurrency();
  
  // Local cache for offline-first
  const [localData, setLocalData] = useState<{
    customers: any[];
    production: any[];
    deliveries: any[];
    payments: any[];
  } | null>(null);
  const loadedFromCache = useRef(false);
  
  // Double-check setup status from app state (belt and suspenders)
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const checkedSetup = useRef(false);

  // STEP 1: Load from local cache immediately (OFFLINE-FIRST)
  useEffect(() => {
    if (loadedFromCache.current) return;
    loadedFromCache.current = true;

    const loadLocalData = async () => {
      try {
        const [cachedCustomers, cachedProduction, cachedDeliveries, cachedPayments] = await Promise.all([
          getAllFromStore<any>("customers"),
          getAllFromStore<any>("production"),
          getAllFromStore<any>("deliveries"),
          getAllFromStore<any>("payments"),
        ]);

        setLocalData({
          customers: cachedCustomers,
          production: cachedProduction,
          deliveries: cachedDeliveries,
          payments: cachedPayments,
        });
      } catch (error) {
        console.error("Failed to load local data:", error);
      }
    };

    loadLocalData();
  }, []);

  // STEP 2: Verify setup status from GLOBAL app state (not just auth hook)
  useEffect(() => {
    if (checkedSetup.current || !user) return;
    checkedSetup.current = true;

    const verifySetup = async () => {
      const globalSetupDone = await isAppSetupComplete();
      
      // Only show wizard if BOTH global state AND auth hook say it's first login
      // This prevents wizard from ever showing after setup is complete
      if (!globalSetupDone && isFirstLogin) {
        setShowSetupWizard(true);
      } else {
        setShowSetupWizard(false);
        // If auth hook thinks it's first login but global state says no, fix it
        if (isFirstLogin && globalSetupDone) {
          setIsFirstLogin(false);
        }
      }
    };

    verifySetup();
  }, [user, isFirstLogin, setIsFirstLogin]);

  // Redirect to auth if no user and not loading
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleLogout = async () => { 
    await signOut(); 
    navigate("/"); 
  };
  
  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    setIsFirstLogin(false);
  };

  // Use local data or fetched data
  const displayCustomers = customers.length > 0 ? customers : (localData?.customers || []);
  const displayEntries = entries.length > 0 ? entries : (localData?.production || []);
  const displayDeliveries = deliveries.length > 0 ? deliveries : (localData?.deliveries || []);
  const displayPayments = payments.length > 0 ? payments : (localData?.payments || []);

  // Show loading skeleton only if no local data AND still loading auth
  const showSkeleton = authLoading && !localData;

  if (showSkeleton) {
    return (
      <DashboardLayout onLogout={handleLogout}>
        <div className="space-y-8">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate stats from display data
  const today = new Date().toISOString().split("T")[0];
  
  const todayProduction = displayEntries.find((e: any) => e.date === today);
  const weeklyEntries = displayEntries.filter((e: any) => {
    const entryDate = new Date(e.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  });
  const weeklyAverage = weeklyEntries.length > 0 
    ? weeklyEntries.reduce((sum: number, e: any) => sum + (e.total_quantity || 0), 0) / weeklyEntries.length 
    : 0;

  const activeCustomers = displayCustomers.filter((c: any) => c.is_active).length;
  
  const todayDeliveries = displayDeliveries.filter((d: any) => d.date === today);
  const deliveredCount = todayDeliveries.filter((d: any) => d.is_delivered).length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const totalReceived = displayPayments
    .filter((p: any) => {
      const paymentDate = new Date(p.payment_date);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    })
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  const alerts: { message: string }[] = [];
  if (todayProduction && weeklyAverage > 0 && todayProduction.total_quantity < weeklyAverage * 0.8) {
    alerts.push({ message: `Low production today - ${Math.round(weeklyAverage - todayProduction.total_quantity)}L below average` });
  }

  const recentDeliveries = todayDeliveries
    .slice(0, 4)
    .map((d: any) => ({
      customer: d.customer?.name || "Unknown",
      quantity: d.quantity,
      time: new Date(d.created_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }),
      status: d.is_delivered ? "delivered" : "pending",
    }));

  return (
    <DashboardLayout onLogout={handleLogout}>
      {/* Setup Wizard - ONLY shows if global app state says setup is NOT complete */}
      {user && showSetupWizard && (
        <SetupWizard open={showSetupWizard} onComplete={handleSetupComplete} userId={user.id} />
      )}

      <div className="space-y-8 animate-fade-in">
        {/* Offline/Sync Status Banner */}
        {(!isOnline || isOfflineSession) && (
          <div className="flex items-center justify-between gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-warning shrink-0" />
              <p className="text-sm font-medium">
                {isOfflineSession ? "Offline Mode - Using cached session" : "You're offline. Changes will sync when you reconnect."}
              </p>
            </div>
            {pendingCount > 0 && (
              <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded-full">
                {pendingCount} pending
              </span>
            )}
          </div>
        )}

        {/* Sync Status */}
        {isOnline && pendingCount > 0 && (
          <div className="flex items-center justify-between gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <RefreshCw className={`h-5 w-5 text-primary ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
              <p className="text-sm font-medium">
                {syncStatus === "syncing" ? "Syncing..." : `${pendingCount} changes pending sync`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={syncData} disabled={syncStatus === "syncing"}>
              Sync Now
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your farm overview for today.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/production")} className="h-12">
              <Plus className="h-4 w-4 mr-2" />Add Production
            </Button>
            <Button variant="hero" onClick={() => navigate("/deliveries")} className="h-12">
              <Truck className="h-4 w-4 mr-2" />Start Deliveries
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard 
            title="Today's Production" 
            value={`${todayProduction?.total_quantity || 0}L`}
            subtitle="Milk collected" 
            icon={<Milk className="h-6 w-6" />}
            trend={weeklyAverage > 0 && todayProduction ? { 
              value: Math.round(((todayProduction.total_quantity - weeklyAverage) / weeklyAverage) * 100), 
              label: "vs avg" 
            } : undefined} 
          />
          <StatCard 
            title="Total Customers" 
            value={activeCustomers} 
            subtitle="Active subscribers" 
            icon={<Users className="h-6 w-6" />} 
          />
          <StatCard 
            title="Today's Deliveries" 
            value={`${deliveredCount}/${activeCustomers}`} 
            subtitle="Completed" 
            icon={<Truck className="h-6 w-6" />} 
          />
          <StatCard 
            title="This Month" 
            value={formatAmount(totalReceived)} 
            subtitle="Collected" 
            icon={<span className="text-xl font-bold">{currency.symbol}</span>} 
          />
        </div>

        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
                <AlertCircle className="h-5 w-5 text-warning shrink-0" />
                <p className="text-sm font-medium">{alert.message}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Deliveries</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/deliveries")}>
                View All<ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentDeliveries.length > 0 ? (
                <div className="space-y-4">
                  {recentDeliveries.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{d.customer}</p>
                          <p className="text-sm text-muted-foreground">{d.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{d.quantity}L</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${d.status === "delivered" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                          {d.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No deliveries today yet</p>
              )}
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate("/customers")}>
                <Users className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Add New Customer</p>
                  <p className="text-xs text-muted-foreground">Register a new milk subscriber</p>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate("/production")}>
                <Milk className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Record Production</p>
                  <p className="text-xs text-muted-foreground">Log today's milk collection</p>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate("/payments")}>
                <span className="text-xl mr-3 text-primary">{currency.symbol}</span>
                <div className="text-left">
                  <p className="font-medium">Record Payment</p>
                  <p className="text-xs text-muted-foreground">Add payment from customer</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
