import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import {
  initDB,
  getPendingActions,
  markActionSynced,
  clearSyncedActions,
  getAllFromStore,
  bulkPutInStore,
  clearStore,
  setMetadata,
  getMetadata,
  PendingAction,
} from "@/lib/offlineDB";
import { toast } from "sonner";

export type SyncStatus = "idle" | "syncing" | "synced" | "failed" | "offline";

export function useSyncEngine() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const syncInProgress = useRef(false);

  // Initialize DB and load pending count
  useEffect(() => {
    initDB().then(async () => {
      const actions = await getPendingActions();
      setPendingCount(actions.length);
      const lastSync = await getMetadata("lastSyncTime");
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }
    });
  }, []);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus("idle");
      // Auto-sync when back online
      if (user) {
        syncData();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user]);

  // Sync pending actions to server
  const syncPendingActions = async (): Promise<boolean> => {
    const pendingActions = await getPendingActions();
    if (pendingActions.length === 0) return true;

    let allSuccess = true;

    for (const action of pendingActions) {
      try {
        if (action.action === "insert") {
          const { error } = await supabase.from(action.table as any).insert(action.data);
          if (error) {
            // Check if it's a duplicate key error (already synced)
            if (error.code === "23505") {
              await markActionSynced(action.id);
              continue;
            }
            throw error;
          }
        } else if (action.action === "update") {
          const { error } = await supabase
            .from(action.table as any)
            .update(action.data)
            .eq("id", action.data.id);
          if (error) throw error;
        } else if (action.action === "delete") {
          const { error } = await supabase
            .from(action.table as any)
            .delete()
            .eq("id", action.data.id);
          if (error) throw error;
        }

        await markActionSynced(action.id);
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        allSuccess = false;
      }
    }

    await clearSyncedActions();
    return allSuccess;
  };

  // Fetch fresh data from server and update local cache
  const fetchAndCacheData = async () => {
    if (!user) return;

    try {
      // Fetch all data in parallel
      const [customersRes, deliveriesRes, productionRes, paymentsRes] = await Promise.all([
        supabase.from("customers").select("*").eq("user_id", user.id),
        supabase.from("deliveries").select("*, customer:customers(name, daily_quantity)").eq("user_id", user.id),
        supabase.from("production").select("*").eq("user_id", user.id),
        supabase.from("payments").select("*, customer:customers(name)").eq("user_id", user.id),
      ]);

      // Clear and repopulate stores
      if (customersRes.data) {
        await clearStore("customers");
        await bulkPutInStore("customers", customersRes.data);
      }
      if (deliveriesRes.data) {
        await clearStore("deliveries");
        await bulkPutInStore("deliveries", deliveriesRes.data);
      }
      if (productionRes.data) {
        await clearStore("production");
        await bulkPutInStore("production", productionRes.data);
      }
      if (paymentsRes.data) {
        await clearStore("payments");
        await bulkPutInStore("payments", paymentsRes.data);
      }

      const now = Date.now();
      await setMetadata("lastSyncTime", now);
      setLastSyncTime(new Date(now));
    } catch (error) {
      console.error("Failed to fetch and cache data:", error);
      throw error;
    }
  };

  // Main sync function
  const syncData = useCallback(async () => {
    if (!isOnline || !user || syncInProgress.current) return;

    syncInProgress.current = true;
    setSyncStatus("syncing");

    try {
      // First, push pending actions
      const pushSuccess = await syncPendingActions();

      // Then, fetch fresh data
      await fetchAndCacheData();

      setSyncStatus("synced");
      const actions = await getPendingActions();
      setPendingCount(actions.length);

      if (pushSuccess) {
        toast.success("Data synced successfully");
      } else {
        toast.warning("Some changes failed to sync");
        setSyncStatus("failed");
      }
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncStatus("failed");
      toast.error("Sync failed. Will retry when online.");
    } finally {
      syncInProgress.current = false;
    }
  }, [isOnline, user]);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const actions = await getPendingActions();
    setPendingCount(actions.length);
  }, []);

  return {
    isOnline,
    syncStatus,
    pendingCount,
    lastSyncTime,
    syncData,
    updatePendingCount,
  };
}
