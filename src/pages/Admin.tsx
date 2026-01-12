import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Users, Milk, IndianRupee, Shield } from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, isAdmin } = useAuth();
  const [stats, setStats] = useState({ users: 0, production: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!authLoading && user && !isAdmin) navigate("/dashboard");
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      const fetchStats = async () => {
        const [{ count: users }, { data: prod }, { data: pay }] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("production").select("total_quantity"),
          supabase.from("payments").select("amount"),
        ]);
        setStats({
          users: users || 0,
          production: prod?.reduce((s, p) => s + (p.total_quantity || 0), 0) || 0,
          revenue: pay?.reduce((s, p) => s + (p.amount || 0), 0) || 0,
        });
        setLoading(false);
      };
      fetchStats();
    }
  }, [isAdmin]);

  const handleLogout = async () => { await signOut(); navigate("/"); };

  if (authLoading || loading) {
    return <DashboardLayout onLogout={handleLogout}><div className="space-y-6"><Skeleton className="h-10 w-48" /><div className="grid grid-cols-3 gap-6">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div></div></DashboardLayout>;
  }

  if (!isAdmin) return null;

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div><h1 className="text-3xl font-bold font-serif">Admin Panel</h1><p className="text-muted-foreground">Platform overview</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="elevated" className="p-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="h-6 w-6 text-primary" /></div><div><p className="text-sm text-muted-foreground">Total Users</p><p className="text-3xl font-bold">{stats.users}</p></div></div></Card>
          <Card variant="elevated" className="p-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center"><Milk className="h-6 w-6 text-accent" /></div><div><p className="text-sm text-muted-foreground">Total Production</p><p className="text-3xl font-bold">{stats.production.toLocaleString()}L</p></div></div></Card>
          <Card variant="elevated" className="p-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center"><IndianRupee className="h-6 w-6 text-success" /></div><div><p className="text-sm text-muted-foreground">Platform Revenue</p><p className="text-3xl font-bold">₹{stats.revenue.toLocaleString()}</p></div></div></Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
