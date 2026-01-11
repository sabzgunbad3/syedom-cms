import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Check,
  X,
  AlertTriangle,
  Search,
  Calendar,
  Milk,
} from "lucide-react";
import { toast } from "sonner";

interface DeliveryItem {
  id: string;
  customerId: string;
  customerName: string;
  scheduledQuantity: number;
  deliveredQuantity: number | null;
  status: "pending" | "delivered" | "skipped" | "shortage";
  time: string | null;
  notes: string;
}

export default function Deliveries() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [availableMilk, setAvailableMilk] = useState(450);

  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([
    {
      id: "1",
      customerId: "1",
      customerName: "Sharma Family",
      scheduledQuantity: 2,
      deliveredQuantity: 2,
      status: "delivered",
      time: "6:30 AM",
      notes: "",
    },
    {
      id: "2",
      customerId: "2",
      customerName: "Gupta Store",
      scheduledQuantity: 10,
      deliveredQuantity: 10,
      status: "delivered",
      time: "7:00 AM",
      notes: "",
    },
    {
      id: "3",
      customerId: "3",
      customerName: "Singh Household",
      scheduledQuantity: 1.5,
      deliveredQuantity: null,
      status: "pending",
      time: null,
      notes: "",
    },
    {
      id: "4",
      customerId: "4",
      customerName: "Patel Dairy Shop",
      scheduledQuantity: 15,
      deliveredQuantity: null,
      status: "pending",
      time: null,
      notes: "",
    },
    {
      id: "5",
      customerId: "5",
      customerName: "Kumar Residence",
      scheduledQuantity: 1,
      deliveredQuantity: null,
      status: "pending",
      time: null,
      notes: "",
    },
  ]);

  const totalScheduled = deliveries.reduce((sum, d) => sum + d.scheduledQuantity, 0);
  const totalDelivered = deliveries.reduce(
    (sum, d) => sum + (d.deliveredQuantity || 0),
    0
  );
  const pendingCount = deliveries.filter((d) => d.status === "pending").length;
  const shortage = Math.max(0, totalScheduled - availableMilk);

  const handleMarkDelivered = (id: string, quantity?: number) => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: "delivered" as const,
              deliveredQuantity: quantity ?? d.scheduledQuantity,
              time: new Date().toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }),
            }
          : d
      )
    );
    toast.success("Delivery marked as complete");
  };

  const handleSkipDelivery = (id: string, reason: string = "Not available") => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: "skipped" as const,
              deliveredQuantity: 0,
              notes: reason,
            }
          : d
      )
    );
    toast.info("Delivery skipped");
  };

  const filteredDeliveries = deliveries.filter((d) =>
    d.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout onLogout={() => navigate("/")}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif">Deliveries</h1>
            <p className="text-muted-foreground mt-1">
              Manage today's milk deliveries
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="stat" className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Milk className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-xl font-bold">{availableMilk}L</p>
              </div>
            </div>
          </Card>
          <Card variant="stat" className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <p className="text-xl font-bold">{totalScheduled}L</p>
              </div>
            </div>
          </Card>
          <Card variant="stat" className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Delivered</p>
                <p className="text-xl font-bold">{totalDelivered}L</p>
              </div>
            </div>
          </Card>
          <Card variant="stat" className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Shortage Alert */}
        {shortage > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-destructive">Milk Shortage Alert</p>
              <p className="text-sm text-muted-foreground">
                You're {shortage}L short for today's scheduled deliveries. Some
                customers may receive reduced quantities.
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Delivery List */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Today's Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border transition-all ${
                    delivery.status === "delivered"
                      ? "bg-success/5 border-success/20"
                      : delivery.status === "skipped"
                      ? "bg-muted border-muted-foreground/20 opacity-60"
                      : "bg-card border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        delivery.status === "delivered"
                          ? "bg-success/20"
                          : delivery.status === "skipped"
                          ? "bg-muted-foreground/20"
                          : "bg-primary/10"
                      }`}
                    >
                      {delivery.status === "delivered" ? (
                        <Check className="h-5 w-5 text-success" />
                      ) : delivery.status === "skipped" ? (
                        <X className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Truck className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{delivery.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {delivery.scheduledQuantity}L scheduled
                        {delivery.time && ` • ${delivery.time}`}
                      </p>
                    </div>
                  </div>

                  {delivery.status === "pending" ? (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Input
                        type="number"
                        placeholder="Qty"
                        className="w-20"
                        defaultValue={delivery.scheduledQuantity}
                        step="0.5"
                        min="0"
                        id={`qty-${delivery.id}`}
                      />
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => {
                          const input = document.getElementById(
                            `qty-${delivery.id}`
                          ) as HTMLInputElement;
                          handleMarkDelivered(
                            delivery.id,
                            parseFloat(input.value) || delivery.scheduledQuantity
                          );
                        }}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Done
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSkipDelivery(delivery.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Skip
                      </Button>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span
                        className={`text-sm px-3 py-1 rounded-full ${
                          delivery.status === "delivered"
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {delivery.status === "delivered"
                          ? `Delivered ${delivery.deliveredQuantity}L`
                          : "Skipped"}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
