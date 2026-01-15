import { useState, useEffect, useCallback } from "react";
import { getAllFromStore, bulkPutInStore, getMetadata } from "@/lib/offlineDB";

interface OfflineData {
  customers: any[];
  production: any[];
  deliveries: any[];
  payments: any[];
  lastSynced: string | null;
}

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData>({
    customers: [],
    production: [],
    deliveries: [],
    payments: [],
    lastSynced: null,
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load cached data on mount
    loadFromCache();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadFromCache = useCallback(async () => {
    try {
      const [customers, production, deliveries, payments, lastSyncTime] = await Promise.all([
        getAllFromStore<any>("customers"),
        getAllFromStore<any>("production"),
        getAllFromStore<any>("deliveries"),
        getAllFromStore<any>("payments"),
        getMetadata("lastSyncTime"),
      ]);

      setOfflineData({
        customers,
        production,
        deliveries,
        payments,
        lastSynced: lastSyncTime ? new Date(lastSyncTime).toISOString() : null,
      });
    } catch (error) {
      console.error("Error loading from cache:", error);
    }
  }, []);

  const saveToCache = useCallback(async (data: Partial<OfflineData>) => {
    try {
      const promises: Promise<void>[] = [];

      if (data.customers?.length) {
        promises.push(bulkPutInStore("customers", data.customers));
      }
      if (data.production?.length) {
        promises.push(bulkPutInStore("production", data.production));
      }
      if (data.deliveries?.length) {
        promises.push(bulkPutInStore("deliveries", data.deliveries));
      }
      if (data.payments?.length) {
        promises.push(bulkPutInStore("payments", data.payments));
      }

      await Promise.all(promises);
      await loadFromCache();
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  }, [loadFromCache]);

  return {
    isOnline,
    offlineData,
    loadFromCache,
    saveToCache,
  };
}
