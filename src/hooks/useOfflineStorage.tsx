import { useState, useEffect, useCallback } from "react";

interface OfflineData {
  customers: any[];
  production: any[];
  deliveries: any[];
  payments: any[];
  lastSynced: string | null;
}

const STORAGE_KEY = "dairyflow_offline_data";
const SESSION_KEY = "dairyflow_session";

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

  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        setOfflineData(JSON.parse(cached));
      }
    } catch (error) {
      console.error("Error loading from cache:", error);
    }
  }, []);

  const saveToCache = useCallback((data: Partial<OfflineData>) => {
    try {
      const newData = {
        ...offlineData,
        ...data,
        lastSynced: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setOfflineData(newData);
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  }, [offlineData]);

  const saveSession = useCallback((session: any) => {
    try {
      if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
    } catch (error) {
      console.error("Error saving session:", error);
    }
  }, []);

  const getSession = useCallback(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  }, []);

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  }, []);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setOfflineData({
        customers: [],
        production: [],
        deliveries: [],
        payments: [],
        lastSynced: null,
      });
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }, []);

  return {
    isOnline,
    offlineData,
    loadFromCache,
    saveToCache,
    saveSession,
    getSession,
    clearSession,
    clearCache,
  };
}
