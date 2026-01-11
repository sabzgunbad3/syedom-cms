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
import { Plus, Search, Phone, MapPin, Calendar, IndianRupee } from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  type: "monthly" | "daily";
  dailyQuantity: number;
  pricePerLiter: number;
  balance: number;
  joinedDate: string;
}

export default function Customers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "monthly" | "daily">("all");

  // Mock data - will be replaced with real data
  const [customers] = useState<Customer[]>([
    {
      id: "1",
      name: "Sharma Family",
      phone: "+91 98765 43210",
      address: "123 Main Street, Village A",
      type: "monthly",
      dailyQuantity: 2,
      pricePerLiter: 60,
      balance: -1200,
      joinedDate: "2024-01-15",
    },
    {
      id: "2",
      name: "Gupta Store",
      phone: "+91 98765 12345",
      address: "Market Road, Village B",
      type: "monthly",
      dailyQuantity: 10,
      pricePerLiter: 55,
      balance: 0,
      joinedDate: "2023-06-20",
    },
    {
      id: "3",
      name: "Singh Household",
      phone: "+91 87654 32109",
      address: "Temple Lane, Village A",
      type: "daily",
      dailyQuantity: 1.5,
      pricePerLiter: 62,
      balance: 0,
      joinedDate: "2024-03-10",
    },
    {
      id: "4",
      name: "Patel Dairy Shop",
      phone: "+91 76543 21098",
      address: "Highway Road, Town Center",
      type: "monthly",
      dailyQuantity: 15,
      pricePerLiter: 52,
      balance: -5400,
      joinedDate: "2022-12-01",
    },
  ]);

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    type: "monthly" as "monthly" | "daily",
    dailyQuantity: "",
    pricePerLiter: "",
  });

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);
    const matchesType = filterType === "all" || customer.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone || !newCustomer.dailyQuantity) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success(`Customer "${newCustomer.name}" added successfully`);
    setIsDialogOpen(false);
    setNewCustomer({
      name: "",
      phone: "",
      address: "",
      type: "monthly",
      dailyQuantity: "",
      pricePerLiter: "",
    });
  };

  return (
    <DashboardLayout onLogout={() => navigate("/")}>
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
                  <Label htmlFor="phone">Phone Number *</Label>
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
                      value={newCustomer.type}
                      onValueChange={(value: "monthly" | "daily") =>
                        setNewCustomer({ ...newCustomer, type: value })
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
                      value={newCustomer.dailyQuantity}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, dailyQuantity: e.target.value })
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
                    value={newCustomer.pricePerLiter}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, pricePerLiter: e.target.value })
                    }
                  />
                </div>
                <Button className="w-full" variant="hero" onClick={handleAddCustomer}>
                  Add Customer
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
                        customer.type === "monthly"
                          ? "bg-primary/10 text-primary"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      {customer.type === "monthly" ? "Monthly" : "Daily"}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p
                      className={`font-semibold ${
                        customer.balance < 0 ? "text-destructive" : "text-success"
                      }`}
                    >
                      {customer.balance < 0 ? "-" : ""}₹{Math.abs(customer.balance)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{customer.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Since {new Date(customer.joinedDate).toLocaleDateString()}</span>
                </div>
                <div className="pt-3 border-t border-border flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold">{customer.dailyQuantity}L</span>
                    <span className="text-sm text-muted-foreground">/day</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <IndianRupee className="h-4 w-4" />
                    <span className="font-medium">{customer.pricePerLiter}/L</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
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
