import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  IndianRupee,
  Calendar,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  type: "received" | "due";
  date: string;
  notes: string;
}

export default function Payments() {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "received" | "due">("all");

  // Mock data
  const [payments] = useState<Payment[]>([
    {
      id: "1",
      customerId: "1",
      customerName: "Sharma Family",
      amount: 3600,
      type: "received",
      date: "2024-01-10",
      notes: "January payment",
    },
    {
      id: "2",
      customerId: "4",
      customerName: "Patel Dairy Shop",
      amount: 24000,
      type: "received",
      date: "2024-01-08",
      notes: "December + January",
    },
    {
      id: "3",
      customerId: "2",
      customerName: "Gupta Store",
      amount: 16500,
      type: "due",
      date: "2024-01-01",
      notes: "January dues",
    },
    {
      id: "4",
      customerId: "3",
      customerName: "Singh Household",
      amount: 90,
      type: "received",
      date: "2024-01-10",
      notes: "Daily payment",
    },
  ]);

  const [newPayment, setNewPayment] = useState({
    customerName: "",
    amount: "",
    type: "received" as "received" | "due",
    notes: "",
  });

  // Mock customer data for dropdown
  const customers = [
    { id: "1", name: "Sharma Family", balance: -1200 },
    { id: "2", name: "Gupta Store", balance: -16500 },
    { id: "3", name: "Singh Household", balance: 0 },
    { id: "4", name: "Patel Dairy Shop", balance: 0 },
    { id: "5", name: "Kumar Residence", balance: -450 },
  ];

  const totalReceived = payments
    .filter((p) => p.type === "received")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalDue = payments
    .filter((p) => p.type === "due")
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = payment.customerName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || payment.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleAddPayment = () => {
    if (!newPayment.customerName || !newPayment.amount) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success(
      newPayment.type === "received"
        ? `Payment of ₹${newPayment.amount} received from ${newPayment.customerName}`
        : `Due of ₹${newPayment.amount} recorded for ${newPayment.customerName}`
    );
    setIsDialogOpen(false);
    setNewPayment({ customerName: "", amount: "", type: "received", notes: "" });
  };

  return (
    <DashboardLayout onLogout={() => navigate("/")}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif">Payments</h1>
            <p className="text-muted-foreground mt-1">
              Track customer payments and dues
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
                    value={newPayment.customerName}
                    onValueChange={(value) =>
                      setNewPayment({ ...newPayment, customerName: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{customer.name}</span>
                            {customer.balance < 0 && (
                              <span className="text-xs text-destructive ml-2">
                                (₹{Math.abs(customer.balance)} due)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={newPayment.type}
                      onValueChange={(value: "received" | "due") =>
                        setNewPayment({ ...newPayment, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="received">Payment Received</SelectItem>
                        <SelectItem value="due">Record Due</SelectItem>
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
                <Button className="w-full" variant="hero" onClick={handleAddPayment}>
                  {newPayment.type === "received" ? "Record Payment" : "Record Due"}
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
                  ₹{totalReceived.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
          <Card variant="stat" className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pending</p>
                <p className="text-2xl font-bold font-serif">
                  ₹{totalDue.toLocaleString()}
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
                <p className="text-sm text-muted-foreground">Net Balance</p>
                <p className="text-2xl font-bold font-serif">
                  ₹{(totalReceived - totalDue).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Pending Dues Quick View */}
        <Card variant="bordered" className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-warning" />
              Customers with Pending Dues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {customers
                .filter((c) => c.balance < 0)
                .map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border"
                  >
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-destructive font-semibold">
                      ₹{Math.abs(customer.balance)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={filterType}
            onValueChange={(value: "all" | "received" | "due") =>
              setFilterType(value)
            }
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="due">Dues</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transaction History */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        payment.type === "received"
                          ? "bg-success/10"
                          : "bg-destructive/10"
                      }`}
                    >
                      {payment.type === "received" ? (
                        <ArrowDownLeft className="h-5 w-5 text-success" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{payment.customerName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(payment.date).toLocaleDateString("en-IN", {
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
                    <p
                      className={`text-lg font-bold ${
                        payment.type === "received"
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {payment.type === "received" ? "+" : "-"}₹
                      {payment.amount.toLocaleString()}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        payment.type === "received"
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {payment.type === "received" ? "Received" : "Due"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
