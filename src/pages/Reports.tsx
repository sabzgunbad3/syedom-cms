import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Calendar, Milk, Truck, IndianRupee } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProduction } from "@/hooks/useProduction";
import { useDeliveries } from "@/hooks/useDeliveries";
import { usePayments } from "@/hooks/usePayments";
import { useCustomers } from "@/hooks/useCustomers";
import { generateMonthlyReport } from "@/lib/generatePDF";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Reports() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { entries } = useProduction();
  const { deliveries } = useDeliveries();
  const { payments } = usePayments();
  const { customers } = useCustomers();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const handleLogout = async () => { await signOut(); navigate("/"); };

  const handleExportPDF = () => {
    const month = parseInt(selectedMonth);
    const year = parseInt(selectedYear);

    const monthlyProduction = entries.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const monthlyDeliveries = deliveries.filter(d => {
      const date = new Date(d.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    const monthlyPayments = payments.filter(p => {
      const d = new Date(p.payment_date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    generateMonthlyReport({
      farmName: "My Dairy Farm",
      month: months[month],
      year,
      production: {
        totalLiters: monthlyProduction.reduce((sum, e) => sum + e.total_quantity, 0),
        avgDaily: monthlyProduction.length > 0 ? Math.round(monthlyProduction.reduce((sum, e) => sum + e.total_quantity, 0) / monthlyProduction.length) : 0,
        daysRecorded: monthlyProduction.length,
      },
      deliveries: {
        totalDeliveries: monthlyDeliveries.length,
        totalLiters: monthlyDeliveries.reduce((sum, d) => sum + d.quantity, 0),
        customersServed: new Set(monthlyDeliveries.map(d => d.customer_id)).size,
      },
      payments: {
        totalReceived: monthlyPayments.reduce((sum, p) => sum + p.amount, 0),
        transactionCount: monthlyPayments.length,
      },
      topCustomers: customers.slice(0, 5).map(c => ({
        name: c.name,
        quantity: c.daily_quantity * 30,
        amount: c.daily_quantity * c.rate_per_liter * 30,
      })),
      dailyProduction: monthlyProduction.map(e => ({
        date: e.date,
        morning: e.morning_quantity,
        evening: e.evening_quantity,
        total: e.total_quantity,
      })),
    });
  };

  const month = parseInt(selectedMonth);
  const year = parseInt(selectedYear);
  const monthlyProduction = entries.filter(e => { const d = new Date(e.date); return d.getMonth() === month && d.getFullYear() === year; });
  const monthlyPayments = payments.filter(p => { const d = new Date(p.payment_date); return d.getMonth() === month && d.getFullYear() === year; });
  const monthlyDeliveries = deliveries.filter(d => { const date = new Date(d.date); return date.getMonth() === month && date.getFullYear() === year; });

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif">Monthly Reports</h1>
            <p className="text-muted-foreground mt-1">Generate and export monthly summaries</p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{months.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>{[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="hero" onClick={handleExportPDF}><FileDown className="h-4 w-4 mr-2" />Export PDF</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="elevated" className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><Milk className="h-6 w-6 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Total Production</p><p className="text-3xl font-bold">{monthlyProduction.reduce((s, e) => s + e.total_quantity, 0)}L</p></div>
            </div>
            <p className="text-sm text-muted-foreground">{monthlyProduction.length} days recorded</p>
          </Card>
          <Card variant="elevated" className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center"><Truck className="h-6 w-6 text-accent" /></div>
              <div><p className="text-sm text-muted-foreground">Total Deliveries</p><p className="text-3xl font-bold">{monthlyDeliveries.length}</p></div>
            </div>
            <p className="text-sm text-muted-foreground">{monthlyDeliveries.reduce((s, d) => s + d.quantity, 0)}L delivered</p>
          </Card>
          <Card variant="elevated" className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center"><IndianRupee className="h-6 w-6 text-success" /></div>
              <div><p className="text-sm text-muted-foreground">Revenue Collected</p><p className="text-3xl font-bold">₹{monthlyPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()}</p></div>
            </div>
            <p className="text-sm text-muted-foreground">{monthlyPayments.length} transactions</p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
