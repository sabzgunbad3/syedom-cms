import { useEffect } from "react";
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
import { useOfflineStorage } from "@/hooks/useOfflineStorage";
import { useCurrency } from "@/contexts/CurrencyContext";
import { SetupWizard } from "@/components/onboarding/SetupWizard";
import { Milk, Users, Truck, Plus, ArrowRight, AlertCircle, WifiOff } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, isFirstLogin, setIsFirstLogin } = useAuth();
  const { customers, loading: customersLoading } = useCustomers();
  const { entries, getTodayProduction, getWeeklyStats, loading: productionLoading } = useProduction();
  const { deliveries, getTodayStats, loading: deliveriesLoading } = useDeliveries();
  const { payments, getTotalReceived, loading: paymentsLoading } = usePayments();
  const { isOnline, saveToCache } = useOfflineStorage();
  const { formatAmount, currency } = useCurrency();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (customers.length || entries.length || deliveries.length || payments.length) {
      saveToCache({ customers, production: entries, deliveries, payments });
    }
  }, [customers, entries, deliveries, payments, saveToCache]);

  const handleLogout = async () => { await signOut(); navigate("/"); };
  const handleSetupComplete = () => setIsFirstLogin(false);

  if (authLoading) {
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

  const todayProduction = getTodayProduction();
  const weeklyStats = getWeeklyStats();
  const todayDeliveryStats = getTodayStats();
  const activeCustomers = customers.filter(c => c.is_active).length;
  const totalReceived = getTotalReceived();

  const alerts: { message: string }[] = [];
  if (todayProduction && todayProduction.total_quantity < weeklyStats.average * 0.8) {
    alerts.push({ message: `Low production today - ${Math.round(weeklyStats.average - todayProduction.total_quantity)}L below average` });
  }

  const recentDeliveries = deliveries
    .filter(d => d.date === new Date().toISOString().split("T")[0])
    .slice(0, 4)
    .map(d => ({
      customer: d.customer?.name || "Unknown",
      quantity: d.quantity,
      time: new Date(d.created_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }),
      status: d.is_delivered ? "delivered" : "pending",
    }));

  return (
    <DashboardLayout onLogout={handleLogout}>
      {user && isFirstLogin && <SetupWizard open={isFirstLogin} onComplete={handleSetupComplete} userId={user.id} />}

      <div className="space-y-8 animate-fade-in">
        {!isOnline && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
            <WifiOff className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm font-medium">You're offline. Changes will sync when you reconnect.</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your farm overview for today.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/production")}><Plus className="h-4 w-4 mr-2" />Add Production</Button>
            <Button variant="hero" onClick={() => navigate("/deliveries")}><Truck className="h-4 w-4 mr-2" />Start Deliveries</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard title="Today's Production" value={productionLoading ? "..." : `${todayProduction?.total_quantity || 0}L`}
            subtitle="Milk collected" icon={<Milk className="h-6 w-6" />}
            trend={weeklyStats.average > 0 && todayProduction ? { value: Math.round(((todayProduction.total_quantity - weeklyStats.average) / weeklyStats.average) * 100), label: "vs avg" } : undefined} />
          <StatCard title="Total Customers" value={customersLoading ? "..." : activeCustomers} subtitle="Active subscribers" icon={<Users className="h-6 w-6" />} />
          <StatCard title="Today's Deliveries" value={deliveriesLoading ? "..." : `${todayDeliveryStats.delivered}/${activeCustomers}`} subtitle="Completed" icon={<Truck className="h-6 w-6" />} />
          <StatCard title="This Month" value={paymentsLoading ? "..." : formatAmount(totalReceived)} subtitle="Collected" icon={<span className="text-xl font-bold">{currency.symbol}</span>} />
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
              <Button variant="ghost" size="sm" onClick={() => navigate("/deliveries")}>View All<ArrowRight className="h-4 w-4 ml-1" /></Button>
            </CardHeader>
            <CardContent>
              {deliveriesLoading ? (
                <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : recentDeliveries.length > 0 ? (
                <div className="space-y-4">
                  {recentDeliveries.map((d, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
                        <div><p className="font-medium">{d.customer}</p><p className="text-sm text-muted-foreground">{d.time}</p></div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{d.quantity}L</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${d.status === "delivered" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{d.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-center py-8">No deliveries today yet</p>}
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate("/customers")}>
                <Users className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left"><p className="font-medium">Add New Customer</p><p className="text-xs text-muted-foreground">Register a new milk subscriber</p></div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate("/production")}>
                <Milk className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left"><p className="font-medium">Record Production</p><p className="text-xs text-muted-foreground">Log today's milk collection</p></div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate("/payments")}>
                <span className="text-xl mr-3 text-primary">{currency.symbol}</span>
                <div className="text-left"><p className="font-medium">Record Payment</p><p className="text-xs text-muted-foreground">Add payment from customer</p></div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
