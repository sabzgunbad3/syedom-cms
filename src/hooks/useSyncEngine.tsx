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
} from "@/lib/offlineDB";
import { toast } from "sonner";

export type SyncStatus = "idle" | "syncing" | "synced" | "failed" | "offline";

export function useSyncEngine() {
  const { user, isOfflineSession } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(navigator.onLine ? "idle" : "offline");
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const syncInProgress = useRef(false);
  const initialized = useRef(false);

  // Initialize DB and load pending count
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    initDB().then(async () => {
      const actions = await getPendingActions();
      setPendingCount(actions.length);
      const lastSync = await getMetadata("lastSyncTime");
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }
    }).catch(console.error);
  }, []);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus("idle");
      // Auto-sync when back online (only if user is logged in and not in offline session)
      if (user && !isOfflineSession) {
        setTimeout(() => syncData(), 1000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set initial state
    if (!navigator.onLine) {
      setSyncStatus("offline");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user, isOfflineSession]);

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
          // Handle profile updates specially (using user_id instead of id)
          if (action.table === "profiles") {
            const { error } = await supabase
              .from("profiles")
              .upsert(action.data);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from(action.table as any)
              .update(action.data)
              .eq("id", action.data.id);
            if (error) throw error;
          }
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

      // Clear and repopulate stores (only if we got data)
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
    if (!isOnline || !user || syncInProgress.current || isOfflineSession) return;

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

      if (pushSuccess && actions.length === 0) {
        toast.success("Data synced successfully");
      } else if (!pushSuccess) {
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
  }, [isOnline, user, isOfflineSession]);

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
