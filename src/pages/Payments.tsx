import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  IndianRupee,
  Calendar,
  ArrowDownLeft,
  Wallet,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCustomers } from "@/hooks/useCustomers";
import { usePayments } from "@/hooks/usePayments";

export default function Payments() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { customers, loading: customersLoading } = useCustomers();
  const { payments, loading: paymentsLoading, addPayment, getTotalReceived } = usePayments();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newPayment, setNewPayment] = useState({
    customerId: "",
    amount: "",
    notes: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const totalReceived = getTotalReceived();
  
  // Calculate expected revenue (simplified - based on monthly customers)
  const monthlyExpected = customers
    .filter(c => c.is_active && c.payment_type === 'monthly')
    .reduce((sum, c) => sum + (c.daily_quantity * c.rate_per_liter * 30), 0);

  const filteredPayments = payments.filter((payment) =>
    payment.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPayment = async () => {
    if (!newPayment.customerId || !newPayment.amount) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addPayment({
        customer_id: newPayment.customerId,
        amount: parseFloat(newPayment.amount),
        payment_date: new Date().toISOString().split("T")[0],
        notes: newPayment.notes || undefined,
      });
      
      setIsDialogOpen(false);
      setNewPayment({ customerId: "", amount: "", notes: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = authLoading || customersLoading || paymentsLoading;

  if (authLoading) {
    return (
      <DashboardLayout onLogout={handleLogout}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif">Payments</h1>
            <p className="text-muted-foreground mt-1">
              Track customer payments
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={newPayment.customerId}
                    onValueChange={(value) =>
                      setNewPayment({ ...newPayment, customerId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g., 3600"
                    value={newPayment.amount}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, amount: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    placeholder="e.g., January payment"
                    value={newPayment.notes}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, notes: e.target.value })
                    }
                  />
                </div>
                <Button 
                  className="w-full" 
                  variant="hero" 
                  onClick={handleAddPayment}
                  disabled={isSubmitting || !newPayment.customerId || !newPayment.amount}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    "Record Payment"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="stat" className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <ArrowDownLeft className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Received</p>
                <p className="text-2xl font-bold font-serif">
                  {loading ? "..." : `₹${totalReceived.toLocaleString()}`}
                </p>
              </div>
            </div>
          </Card>
          <Card variant="stat" className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected Monthly</p>
                <p className="text-2xl font-bold font-serif">
                  {loading ? "..." : `₹${Math.round(monthlyExpected).toLocaleString()}`}
                </p>
              </div>
            </div>
          </Card>
          <Card variant="stat" className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold font-serif">
                  {loading ? "..." : payments.length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Transaction History */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : filteredPayments.length > 0 ? (
              <div className="space-y-3">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-success/10">
                        <ArrowDownLeft className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.customer?.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(payment.payment_date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {payment.notes && (
                            <>
                              <span>•</span>
                              <span>{payment.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">
                        +₹{payment.amount.toLocaleString()}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">
                        Received
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No payments recorded yet. Record your first payment above!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
