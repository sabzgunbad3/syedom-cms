import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Phone, MapPin, Calendar, Truck, Printer,
  Share2, FileText, TrendingUp, Edit
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCustomers } from "@/hooks/useCustomers";
import { useDeliveries } from "@/hooks/useDeliveries";
import { usePayments } from "@/hooks/usePayments";
import { useCurrency } from "@/contexts/CurrencyContext";
import { generateCustomerInvoice, generateCustomerReceipt } from "@/lib/generatePDF";
import { toast } from "sonner";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { customers, loading: customersLoading } = useCustomers();
  const { deliveries, loading: deliveriesLoading } = useDeliveries();
  const { payments, loading: paymentsLoading } = usePayments();
  const { formatAmount, currency } = useCurrency();
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const customer = useMemo(() => 
    customers.find(c => c.id === id),
    [customers, id]
  );

  const customerDeliveries = useMemo(() =>
    deliveries.filter(d => d.customer_id === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [deliveries, id]
  );

  const customerPayments = useMemo(() =>
    payments.filter(p => p.customer_id === id)
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()),
    [payments, id]
  );

  const stats = useMemo(() => {
    if (!customer) return null;

    const totalDelivered = customerDeliveries.reduce((sum, d) => sum + d.quantity, 0);
    const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = totalDelivered * customer.rate_per_liter;
    const balance = totalDue - totalPaid;
    const shortages = customerDeliveries.filter(d => d.quantity < customer.daily_quantity).length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30DaysDeliveries = customerDeliveries.filter(
      d => new Date(d.date) >= thirtyDaysAgo
    );
    const last30DaysQuantity = last30DaysDeliveries.reduce((sum, d) => sum + d.quantity, 0);
    const expectedMonthly = customer.daily_quantity * 30;
    const fulfillmentRate = expectedMonthly > 0
      ? Math.round((last30DaysQuantity / expectedMonthly) * 100)
      : 0;

    return {
      totalDelivered,
      totalPaid,
      totalDue,
      balance,
      shortages,
      deliveryCount: customerDeliveries.length,
      paymentCount: customerPayments.length,
      last30DaysQuantity,
      fulfillmentRate,
    };
  }, [customer, customerDeliveries, customerPayments]);

  const handlePrintInvoice = () => {
    if (!customer || !stats) return;
    generateCustomerInvoice({
      customer,
      deliveries: customerDeliveries.slice(0, 30),
      payments: customerPayments.slice(0, 10),
      stats,
      currency,
    });
    toast.success("Invoice generated!");
  };

  const handlePrintReceipt = () => {
    if (!customer) return;
    const lastPayment = customerPayments[0];
    if (lastPayment) {
      generateCustomerReceipt({
        customer,
        payment: lastPayment,
        currency,
      });
      toast.success("Receipt generated!");
    } else {
      toast.error("No payments to generate receipt for");
    }
  };

  const handleShare = async () => {
    if (!customer || !stats) return;
    const text = `Customer Statement - ${customer.name}\n` +
      `Total Delivered: ${stats.totalDelivered}L\n` +
      `Amount Due: ${formatAmount(stats.totalDue)}\n` +
      `Paid: ${formatAmount(stats.totalPaid)}\n` +
      `Balance: ${formatAmount(stats.balance)}`;

    if (navigator.share) {
      await navigator.share({ title: "Customer Statement", text });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Statement copied to clipboard!");
    }
  };

  const loading = authLoading || customersLoading || deliveriesLoading || paymentsLoading;

  if (loading) {
    return (
      <DashboardLayout onLogout={handleLogout}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout onLogout={handleLogout}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Customer not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/customers")}>
            Back to Customers
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/customers")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold font-serif">{customer.name}</h1>
                <Badge variant={customer.payment_type === "monthly" ? "default" : "secondary"}>
                  {customer.payment_type === "monthly" ? "Monthly" : "Daily"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                {customer.phone && (
                  <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:text-primary">
                    <Phone className="h-4 w-4" />
                    {customer.phone}
                  </a>
                )}
                {customer.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {customer.address}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Since {new Date(customer.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintReceipt}>
              <FileText className="h-4 w-4 mr-2" />
              Receipt
            </Button>
            <Button variant="hero" size="sm" onClick={handlePrintInvoice}>
              <Printer className="h-4 w-4 mr-2" />
              Invoice
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Daily Quantity</p>
              <p className="text-2xl font-bold">{customer.daily_quantity}L</p>
              <p className="text-xs text-muted-foreground">@ {formatAmount(customer.rate_per_liter)}/L</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Total Delivered</p>
              <p className="text-2xl font-bold">{stats.totalDelivered}L</p>
              <p className="text-xs text-muted-foreground">{stats.deliveryCount} deliveries</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-success">{formatAmount(stats.totalPaid)}</p>
              <p className="text-xs text-muted-foreground">{stats.paymentCount} payments</p>
            </Card>
            <Card className={`p-4 ${stats.balance > 0 ? "bg-destructive/10 border-destructive/20" : "bg-success/10 border-success/20"}`}>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className={`text-2xl font-bold ${stats.balance > 0 ? "text-destructive" : "text-success"}`}>
                {formatAmount(Math.abs(stats.balance))}
              </p>
              <p className="text-xs text-muted-foreground">{stats.balance > 0 ? "Outstanding" : "Advance"}</p>
            </Card>
          </div>
        )}

        {/* Fulfillment Rate */}
        {stats && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">30-Day Fulfillment Rate</span>
              <span className={`text-lg font-bold ${stats.fulfillmentRate >= 80 ? "text-success" : stats.fulfillmentRate >= 50 ? "text-warning" : "text-destructive"}`}>
                {stats.fulfillmentRate}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${stats.fulfillmentRate >= 80 ? "bg-success" : stats.fulfillmentRate >= 50 ? "bg-warning" : "bg-destructive"}`}
                style={{ width: `${Math.min(stats.fulfillmentRate, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.last30DaysQuantity}L delivered / {customer.daily_quantity * 30}L expected
            </p>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deliveries">Deliveries ({customerDeliveries.length})</TabsTrigger>
            <TabsTrigger value="payments">Payments ({customerPayments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {stats && (
              <>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <Card className="p-4 bg-primary/5">
                    <p className="text-3xl font-bold text-primary">{stats.deliveryCount}</p>
                    <p className="text-sm text-muted-foreground">Total Deliveries</p>
                  </Card>
                  <Card className="p-4 bg-accent/5">
                    <p className="text-3xl font-bold text-accent">{stats.paymentCount}</p>
                    <p className="text-sm text-muted-foreground">Total Payments</p>
                  </Card>
                  <Card className="p-4 bg-warning/5">
                    <p className="text-3xl font-bold text-warning">{stats.shortages}</p>
                    <p className="text-sm text-muted-foreground">Shortages</p>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Financial Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Due</span>
                      <span className="font-medium">{formatAmount(stats.totalDue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Paid</span>
                      <span className="font-medium text-success">{formatAmount(stats.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t">
                      <span className="font-medium">Outstanding Balance</span>
                      <span className={`font-bold ${stats.balance > 0 ? "text-destructive" : "text-success"}`}>
                        {formatAmount(Math.abs(stats.balance))}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="deliveries" className="mt-6">
            <Card>
              <CardContent className="p-0">
                {customerDeliveries.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No deliveries recorded</p>
                ) : (
                  <div className="divide-y">
                    {customerDeliveries.map((delivery) => (
                      <div key={delivery.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <Truck className={`h-5 w-5 ${delivery.is_delivered ? "text-success" : "text-muted-foreground"}`} />
                          <div>
                            <p className="font-medium">{delivery.quantity}L</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(delivery.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={delivery.is_delivered ? "default" : "secondary"}>
                            {delivery.is_delivered ? "Delivered" : "Pending"}
                          </Badge>
                          {delivery.shortage_reason && (
                            <p className="text-xs text-warning mt-1">{delivery.shortage_reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <Card>
              <CardContent className="p-0">
                {customerPayments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No payments recorded</p>
                ) : (
                  <div className="divide-y">
                    {customerPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium text-success">{formatAmount(payment.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </p>
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-muted-foreground max-w-48 truncate">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
