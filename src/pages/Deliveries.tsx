import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { SyncStatusBar } from "@/components/layout/SyncStatusBar";
import { DeliveryCard, DeliveryItem } from "@/components/delivery/DeliveryCard";
import { BulkActions, FilterType } from "@/components/delivery/BulkActions";
import { DeliveryStats } from "@/components/delivery/DeliveryStats";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCustomers } from "@/hooks/useCustomers";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useProduction } from "@/hooks/useProduction";
import { useSyncEngine } from "@/hooks/useSyncEngine";
import {
  putInStore,
  addPendingAction,
  getByIndex,
  getAllFromStore,
} from "@/lib/offlineDB";

export default function Deliveries() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { customers, loading: customersLoading } = useCustomers();
  const { deliveries, loading: deliveriesLoading, addDelivery, fetchDeliveries } = useDeliveries();
  const { getTodayProduction } = useProduction();
  const { isOnline, syncStatus, pendingCount, lastSyncTime, syncData, updatePendingCount } = useSyncEngine();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterType>("all");
  const [localDeliveries, setLocalDeliveries] = useState<Map<string, any>>(new Map());

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

  // Merge server deliveries with local state
  useEffect(() => {
    const newMap = new Map();
    deliveries.forEach((d) => {
      newMap.set(d.customer_id, d);
    });
    // Merge with existing local changes
    localDeliveries.forEach((value, key) => {
      if (!newMap.has(key)) {
        newMap.set(key, value);
      }
    });
    setLocalDeliveries(newMap);
  }, [deliveries]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const todayProduction = getTodayProduction();
  const availableMilk = todayProduction?.total_quantity || 0;

  // Build delivery items from customers + existing deliveries
  const deliveryItems: DeliveryItem[] = useMemo(() => {
    const activeCustomers = customers.filter((c) => c.is_active);
    return activeCustomers.map((customer) => {
      const existingDelivery = localDeliveries.get(customer.id);

      let status: DeliveryItem["status"] = "pending";
      let currentQuantity: number | null = null;

      if (existingDelivery) {
        if (!existingDelivery.is_delivered && existingDelivery.quantity === 0) {
          status = "missed";
          currentQuantity = 0;
        } else if (existingDelivery.is_delivered) {
          status = existingDelivery.quantity !== customer.daily_quantity ? "custom" : "delivered";
          currentQuantity = existingDelivery.quantity;
        }
      }

      return {
        customerId: customer.id,
        customerName: customer.name,
        defaultQuantity: customer.daily_quantity,
        currentQuantity,
        status,
        isSelected: selectedIds.has(customer.id),
      };
    });
  }, [customers, localDeliveries, selectedIds]);

  // Filter and search
  const filteredItems = useMemo(() => {
    let items = deliveryItems;

    // Apply filter
    if (filter !== "all") {
      items = items.filter((item) => item.status === filter);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => item.customerName.toLowerCase().includes(query));
    }

    return items;
  }, [deliveryItems, filter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const pending = deliveryItems.filter((d) => d.status === "pending");
    const delivered = deliveryItems.filter((d) => d.status === "delivered" || d.status === "custom");
    const missed = deliveryItems.filter((d) => d.status === "missed");

    return {
      totalScheduled: deliveryItems.reduce((sum, d) => sum + d.defaultQuantity, 0),
      totalDelivered: delivered.reduce((sum, d) => sum + (d.currentQuantity || 0), 0),
      pendingCount: pending.length,
      missedCount: missed.length,
    };
  }, [deliveryItems]);

  // Save delivery (online or offline)
  const saveDelivery = useCallback(
    async (customerId: string, quantity: number, isDelivered: boolean) => {
      if (!user) return;

      const deliveryData = {
        id: crypto.randomUUID(),
        customer_id: customerId,
        user_id: user.id,
        date: selectedDate,
        quantity,
        is_delivered: isDelivered,
        shortage_reason: isDelivered ? null : "Not available",
        created_at: new Date().toISOString(),
      };

      // Update local state immediately
      setLocalDeliveries((prev) => new Map(prev).set(customerId, deliveryData));

      if (isOnline) {
        // Try to save to server
        await addDelivery({
          customer_id: customerId,
          date: selectedDate,
          quantity,
          is_delivered: isDelivered,
          shortage_reason: isDelivered ? undefined : "Not available",
        });
      } else {
        // Save to IndexedDB and queue for sync
        await putInStore("deliveries", deliveryData);
        await addPendingAction({
          table: "deliveries",
          action: "insert",
          data: deliveryData,
        });
        await updatePendingCount();
      }
    },
    [user, selectedDate, isOnline, addDelivery, updatePendingCount]
  );

  // Action handlers
  const handleMinus = useCallback(
    async (customerId: string) => {
      setProcessingIds((prev) => new Set(prev).add(customerId));
      try {
        await saveDelivery(customerId, 0, false);
        toast.info("Marked as missed");
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(customerId);
          return next;
        });
      }
    },
    [saveDelivery]
  );

  const handlePlus = useCallback(
    async (customerId: string) => {
      setProcessingIds((prev) => new Set(prev).add(customerId));
      try {
        const item = deliveryItems.find((d) => d.customerId === customerId);
        if (item) {
          await saveDelivery(customerId, item.defaultQuantity, true);
          toast.success("Delivered!");
        }
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(customerId);
          return next;
        });
      }
    },
    [deliveryItems, saveDelivery]
  );

  const handleCustom = useCallback(
    async (customerId: string, quantity: number) => {
      setProcessingIds((prev) => new Set(prev).add(customerId));
      try {
        await saveDelivery(customerId, quantity, true);
        toast.success(`Delivered ${quantity}L`);
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(customerId);
          return next;
        });
      }
    },
    [saveDelivery]
  );

  const handleSelect = useCallback((customerId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  }, []);

  // Bulk actions
  const handleSelectAll = useCallback(() => {
    const pendingIds = filteredItems.filter((d) => d.status === "pending").map((d) => d.customerId);
    setSelectedIds(new Set(pendingIds));
  }, [filteredItems]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkDeliver = useCallback(async () => {
    const targetItems =
      selectedIds.size > 0
        ? deliveryItems.filter((d) => selectedIds.has(d.customerId) && d.status === "pending")
        : deliveryItems.filter((d) => d.status === "pending");

    for (const item of targetItems) {
      await saveDelivery(item.customerId, item.defaultQuantity, true);
    }
    setSelectedIds(new Set());
    toast.success(`Delivered to ${targetItems.length} customers`);
  }, [selectedIds, deliveryItems, saveDelivery]);

  const handleBulkMissed = useCallback(async () => {
    const targetItems =
      selectedIds.size > 0
        ? deliveryItems.filter((d) => selectedIds.has(d.customerId) && d.status === "pending")
        : deliveryItems.filter((d) => d.status === "pending");

    for (const item of targetItems) {
      await saveDelivery(item.customerId, 0, false);
    }
    setSelectedIds(new Set());
    toast.info(`Marked ${targetItems.length} as missed`);
  }, [selectedIds, deliveryItems, saveDelivery]);

  const loading = authLoading || customersLoading;

  if (authLoading) {
    return (
      <DashboardLayout onLogout={handleLogout}>
        <div className="space-y-4 pb-20 lg:pb-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
        <BottomNavigation />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-4 pb-20 lg:pb-6 animate-fade-in">
        {/* Header with sync status */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold font-serif">Deliveries</h1>
            <p className="text-sm text-muted-foreground">Manage daily milk deliveries</p>
          </div>
          <SyncStatusBar
            isOnline={isOnline}
            syncStatus={syncStatus}
            pendingCount={pendingCount}
            lastSyncTime={lastSyncTime}
            onSync={syncData}
          />
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40 h-9"
          />
        </div>

        {/* Stats */}
        <DeliveryStats
          availableMilk={availableMilk}
          totalScheduled={stats.totalScheduled}
          totalDelivered={stats.totalDelivered}
          pendingCount={stats.pendingCount}
          missedCount={stats.missedCount}
        />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Bulk actions */}
        <BulkActions
          selectedCount={selectedIds.size}
          totalCount={filteredItems.length}
          pendingCount={stats.pendingCount}
          filter={filter}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBulkDeliver={handleBulkDeliver}
          onBulkMissed={handleBulkMissed}
          onFilterChange={setFilter}
          disabled={processingIds.size > 0}
        />

        {/* Delivery list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <DeliveryCard
                key={item.customerId}
                item={item}
                isProcessing={processingIds.has(item.customerId)}
                onMinus={handleMinus}
                onPlus={handlePlus}
                onCustom={handleCustom}
                onSelect={handleSelect}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? "No customers found" : "No customers yet. Add customers first."}
            </p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </DashboardLayout>
  );
}
