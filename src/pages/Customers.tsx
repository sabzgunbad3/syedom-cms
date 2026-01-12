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
import { Plus, Search, Phone, MapPin, Calendar, IndianRupee, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCustomers, Customer } from "@/hooks/useCustomers";

export default function Customers() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { customers, loading, addCustomer } = useCustomers();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "monthly" | "daily">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    payment_type: "monthly" as "monthly" | "daily",
    daily_quantity: "",
    rate_per_liter: "60",
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

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone?.includes(searchQuery) ?? false);
    const matchesType = filterType === "all" || customer.payment_type === filterType;
    return matchesSearch && matchesType;
  });

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.daily_quantity) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addCustomer({
        name: newCustomer.name,
        phone: newCustomer.phone || null,
        address: newCustomer.address || null,
        payment_type: newCustomer.payment_type,
        daily_quantity: parseFloat(newCustomer.daily_quantity),
        rate_per_liter: parseFloat(newCustomer.rate_per_liter) || 60,
        is_active: true,
      });
      
      setIsDialogOpen(false);
      setNewCustomer({
        name: "",
        phone: "",
        address: "",
        payment_type: "monthly",
        daily_quantity: "",
        rate_per_liter: "60",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout onLogout={handleLogout}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
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
            <h1 className="text-3xl font-bold font-serif">Customers</h1>
            <p className="text-muted-foreground mt-1">
              Manage your milk delivery customers
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Customer Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter customer name"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+91 XXXXX XXXXX"
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter address"
                    value={newCustomer.address}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, address: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Customer Type *</Label>
                    <Select
                      value={newCustomer.payment_type}
                      onValueChange={(value: "monthly" | "daily") =>
                        setNewCustomer({ ...newCustomer, payment_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Daily Quantity (L) *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.5"
                      placeholder="e.g., 2"
                      value={newCustomer.daily_quantity}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, daily_quantity: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price per Liter (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="e.g., 60"
                    value={newCustomer.rate_per_liter}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, rate_per_liter: e.target.value })
                    }
                  />
                </div>
                <Button 
                  className="w-full" 
                  variant="hero" 
                  onClick={handleAddCustomer}
                  disabled={isSubmitting || !newCustomer.name || !newCustomer.daily_quantity}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Customer"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={filterType}
            onValueChange={(value: "all" | "monthly" | "daily") => setFilterType(value)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Customer List */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.map((customer) => (
              <Card
                key={customer.id}
                variant="elevated"
                className="cursor-pointer hover:shadow-lg transition-all"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{customer.name}</CardTitle>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          customer.payment_type === "monthly"
                            ? "bg-primary/10 text-primary"
                            : "bg-accent/10 text-accent"
                        }`}
                      >
                        {customer.payment_type === "monthly" ? "Monthly" : "Daily"}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Rate</p>
                      <p className="font-semibold">₹{customer.rate_per_liter}/L</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Since {new Date(customer.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="pt-3 border-t border-border flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold">{customer.daily_quantity}L</span>
                      <span className="text-sm text-muted-foreground">/day</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <IndianRupee className="h-4 w-4" />
                      <span className="font-medium">
                        {Math.round(customer.daily_quantity * customer.rate_per_liter * 30)}/month
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredCustomers.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No customers found</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first customer
            </Button>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
