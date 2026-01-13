import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, MapPin, Calendar, Truck, Printer, Share2,
  FileText, User, TrendingUp, AlertCircle
} from "lucide-react";
import { Customer } from "@/hooks/useCustomers";
import { Delivery } from "@/hooks/useDeliveries";
import { Payment } from "@/hooks/usePayments";
import { useCurrency } from "@/contexts/CurrencyContext";
import { generateCustomerInvoice, generateCustomerReceipt } from "@/lib/generatePDF";

interface CustomerDetailSheetProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveries: Delivery[];
  payments: Payment[];
}

export function CustomerDetailSheet({
  customer,
  open,
  onOpenChange,
  deliveries,
  payments,
}: CustomerDetailSheetProps) {
  const { formatAmount, currency } = useCurrency();
  const [tab, setTab] = useState("overview");

  const customerDeliveries = useMemo(() => 
    deliveries.filter(d => d.customer_id === customer?.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [deliveries, customer?.id]
  );

  const customerPayments = useMemo(() =>
    payments.filter(p => p.customer_id === customer?.id)
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()),
    [payments, customer?.id]
  );

  const stats = useMemo(() => {
    if (!customer) return null;

    const totalDelivered = customerDeliveries.reduce((sum, d) => sum + d.quantity, 0);
    const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = totalDelivered * customer.rate_per_liter;
    const balance = totalDue - totalPaid;
    const missedDays = customerDeliveries.filter(d => !d.is_delivered).length;
    const shortages = customerDeliveries.filter(d => d.quantity < customer.daily_quantity);

    // Last 30 days stats
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
      missedDays,
      shortages: shortages.length,
      deliveryCount: customerDeliveries.length,
      paymentCount: customerPayments.length,
      last30DaysQuantity,
      fulfillmentRate,
    };
  }, [customer, customerDeliveries, customerPayments]);

  if (!customer || !stats) return null;

  const handlePrintInvoice = () => {
    generateCustomerInvoice({
      customer,
      deliveries: customerDeliveries.slice(0, 30),
      payments: customerPayments.slice(0, 10),
      stats,
      currency,
    });
  };

  const handlePrintReceipt = () => {
    const lastPayment = customerPayments[0];
    if (lastPayment) {
      generateCustomerReceipt({
        customer,
        payment: lastPayment,
        currency,
      });
    }
  };

  const handleShare = async () => {
    const text = `Customer Statement - ${customer.name}\n` +
      `Total Delivered: ${stats.totalDelivered}L\n` +
      `Amount Due: ${formatAmount(stats.totalDue)}\n` +
      `Paid: ${formatAmount(stats.totalPaid)}\n` +
      `Balance: ${formatAmount(stats.balance)}`;
    
    if (navigator.share) {
      await navigator.share({ title: "Customer Statement", text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-2xl">{customer.name}</SheetTitle>
              <Badge variant={customer.payment_type === "monthly" ? "default" : "secondary"}>
                {customer.payment_type === "monthly" ? "Monthly" : "Daily"} Customer
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handlePrintReceipt}>
                <FileText className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handlePrintInvoice}>
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="py-4 space-y-4">
          {/* Contact Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Daily Quantity</p>
              <p className="text-xl font-bold">{customer.daily_quantity}L</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Rate per Liter</p>
              <p className="text-xl font-bold">{formatAmount(customer.rate_per_liter)}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Total Delivered</p>
              <p className="text-xl font-bold">{stats.totalDelivered}L</p>
            </Card>
            <Card className={`p-3 ${stats.balance > 0 ? "bg-destructive/10 border-destructive/20" : "bg-success/10 border-success/20"}`}>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className={`text-xl font-bold ${stats.balance > 0 ? "text-destructive" : "text-success"}`}>
                {formatAmount(Math.abs(stats.balance))} {stats.balance > 0 ? "Due" : "Paid"}
              </p>
            </Card>
          </div>

          {/* Fulfillment Rate */}
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

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="deliveries" className="flex-1">Deliveries</TabsTrigger>
              <TabsTrigger value="payments" className="flex-1">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="text-2xl font-bold text-primary">{stats.deliveryCount}</p>
                  <p className="text-xs text-muted-foreground">Deliveries</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/10">
                  <p className="text-2xl font-bold text-accent">{stats.paymentCount}</p>
                  <p className="text-xs text-muted-foreground">Payments</p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10">
                  <p className="text-2xl font-bold text-warning">{stats.shortages}</p>
                  <p className="text-xs text-muted-foreground">Shortages</p>
                </div>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Due</span>
                    <span className="font-medium">{formatAmount(stats.totalDue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Paid</span>
                    <span className="font-medium text-success">{formatAmount(stats.totalPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="font-medium">Outstanding</span>
                    <span className={`font-bold ${stats.balance > 0 ? "text-destructive" : "text-success"}`}>
                      {formatAmount(Math.abs(stats.balance))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deliveries" className="mt-4">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {customerDeliveries.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No deliveries yet</p>
                ) : (
                  customerDeliveries.slice(0, 20).map((delivery) => (
                    <div 
                      key={delivery.id} 
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Truck className={`h-4 w-4 ${delivery.is_delivered ? "text-success" : "text-muted-foreground"}`} />
                        <div>
                          <p className="font-medium">{delivery.quantity}L</p>
                          <p className="text-xs text-muted-foreground">
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
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {customerPayments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No payments yet</p>
                ) : (
                  customerPayments.slice(0, 20).map((payment) => (
                    <div 
                      key={payment.id} 
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium text-success">{formatAmount(payment.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </p>
                      </div>
                      {payment.notes && (
                        <p className="text-xs text-muted-foreground max-w-32 truncate">
                          {payment.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={handlePrintReceipt}>
              <FileText className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
            <Button variant="hero" className="flex-1" onClick={handlePrintInvoice}>
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
