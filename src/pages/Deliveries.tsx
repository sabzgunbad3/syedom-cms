import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Truck,
  Check,
  X,
  AlertTriangle,
  Search,
  Milk,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCustomers } from "@/hooks/useCustomers";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useProduction } from "@/hooks/useProduction";

export default function Deliveries() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { customers, loading: customersLoading } = useCustomers();
  const { deliveries, loading: deliveriesLoading, addDelivery, fetchDeliveries } = useDeliveries();
  const { getTodayProduction } = useProduction();
  
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (selectedDate) {
      fetchDeliveries(selectedDate);
    }
  }, [selectedDate, fetchDeliveries]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const todayProduction = getTodayProduction();
  const availableMilk = todayProduction?.total_quantity || 0;

  // Create delivery items from customers + existing deliveries
  const activeCustomers = customers.filter(c => c.is_active);
  const deliveryItems = activeCustomers.map(customer => {
    const existingDelivery = deliveries.find(
      d => d.customer_id === customer.id && d.date === selectedDate
    );
    
    return {
      customerId: customer.id,
      customerName: customer.name,
      scheduledQuantity: customer.daily_quantity,
      deliveredQuantity: existingDelivery?.quantity ?? null,
      isDelivered: existingDelivery?.is_delivered ?? false,
      status: existingDelivery 
        ? (existingDelivery.is_delivered ? "delivered" : "skipped")
        : "pending",
    };
  });

  const filteredDeliveries = deliveryItems.filter((d) =>
    d.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalScheduled = deliveryItems.reduce((sum, d) => sum + d.scheduledQuantity, 0);
  const totalDelivered = deliveryItems.reduce(
    (sum, d) => sum + (d.deliveredQuantity || 0),
    0
  );
  const pendingCount = deliveryItems.filter((d) => d.status === "pending").length;
  const shortage = Math.max(0, totalScheduled - availableMilk);

  const handleMarkDelivered = async (customerId: string, quantity: number) => {
    setProcessingId(customerId);
    try {
      await addDelivery({
        customer_id: customerId,
        date: selectedDate,
        quantity,
        is_delivered: true,
      });
      toast.success("Delivery marked as complete");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSkipDelivery = async (customerId: string, reason: string = "Not available") => {
    setProcessingId(customerId);
    try {
      await addDelivery({
        customer_id: customerId,
        date: selectedDate,
        quantity: 0,
        is_delivered: false,
        shortage_reason: reason,
      });
      toast.info("Delivery skipped");
    } finally {
      setProcessingId(null);
    }
  };

  const loading = authLoading || customersLoading || deliveriesLoading;

  if (authLoading) {
    return (
      <DashboardLayout onLogout={handleLogout}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
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
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : filteredDeliveries.length > 0 ? (
              <div className="space-y-4">
                {filteredDeliveries.map((delivery) => (
                  <div
                    key={delivery.customerId}
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
                          id={`qty-${delivery.customerId}`}
                          disabled={processingId === delivery.customerId}
                        />
                        <Button
                          size="sm"
                          variant="success"
                          disabled={processingId === delivery.customerId}
                          onClick={() => {
                            const input = document.getElementById(
                              `qty-${delivery.customerId}`
                            ) as HTMLInputElement;
                            handleMarkDelivered(
                              delivery.customerId,
                              parseFloat(input.value) || delivery.scheduledQuantity
                            );
                          }}
                        >
                          {processingId === delivery.customerId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Done
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={processingId === delivery.customerId}
                          onClick={() => handleSkipDelivery(delivery.customerId)}
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
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No customers found. Add customers first to manage deliveries.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
