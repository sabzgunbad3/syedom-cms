// IndexedDB-based offline storage with sync queue
// PRIMARY source of truth - server is for backup only
const DB_NAME = "syedom_dfms_db";
const DB_VERSION = 3;

export interface PendingAction {
  id: string;
  table: string;
  action: "insert" | "update" | "delete";
  data: any;
  timestamp: number;
  synced: boolean;
}

export interface LocalSession {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  createdAt: number;
}

export interface UserProfile {
  userId: string;
  fullName: string;
  farmName: string | null;
  phone: string | null;
  setupComplete: boolean;
  currency: string;
  defaultRate: number;
}

export interface OfflineStore {
  customers: any[];
  deliveries: any[];
  production: any[];
  payments: any[];
  pendingActions: PendingAction[];
  lastSyncTime: number | null;
}

let db: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Failed to open IndexedDB:", request.error);
      dbInitPromise = null;
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Core data stores
      if (!database.objectStoreNames.contains("customers")) {
        database.createObjectStore("customers", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("deliveries")) {
        const deliveriesStore = database.createObjectStore("deliveries", { keyPath: "id" });
        deliveriesStore.createIndex("by_date", "date", { unique: false });
        deliveriesStore.createIndex("by_customer", "customer_id", { unique: false });
      }
      if (!database.objectStoreNames.contains("production")) {
        const productionStore = database.createObjectStore("production", { keyPath: "id" });
        productionStore.createIndex("by_date", "date", { unique: false });
      }
      if (!database.objectStoreNames.contains("payments")) {
        database.createObjectStore("payments", { keyPath: "id" });
      }
      
      // Sync queue
      if (!database.objectStoreNames.contains("pendingActions")) {
        const pendingStore = database.createObjectStore("pendingActions", { keyPath: "id" });
        pendingStore.createIndex("by_synced", "synced", { unique: false });
      }
      
      // Metadata store
      if (!database.objectStoreNames.contains("metadata")) {
        database.createObjectStore("metadata", { keyPath: "key" });
      }

      // Auth and profile stores - CRITICAL for offline-first
      if (!database.objectStoreNames.contains("session")) {
        database.createObjectStore("session", { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains("profile")) {
        database.createObjectStore("profile", { keyPath: "userId" });
      }
    };
  });

  return dbInitPromise;
}

// ============================================
// GENERIC CRUD OPERATIONS
// ============================================

export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => {
      console.error(`Failed to get all from ${storeName}:`, request.error);
      resolve([]);
    };
  });
}

export async function getFromStore<T>(storeName: string, id: string): Promise<T | undefined> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.error(`Failed to get from ${storeName}:`, request.error);
      resolve(undefined);
    };
  });
}

export async function putInStore<T>(storeName: string, data: T): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error(`Failed to put in ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

export async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error(`Failed to delete from ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

export async function clearStore(storeName: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error(`Failed to clear ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

export async function bulkPutInStore<T>(storeName: string, items: T[]): Promise<void> {
  if (!items.length) return;
  
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    items.forEach((item) => {
      store.put(item);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
      console.error(`Failed to bulk put in ${storeName}:`, transaction.error);
      reject(transaction.error);
    };
  });
}

// ============================================
// SESSION MANAGEMENT - CRITICAL FOR OFFLINE AUTH
// ============================================

export async function saveLocalSession(session: LocalSession): Promise<void> {
  await putInStore("session", { key: "current", ...session });
}

export async function getLocalSession(): Promise<LocalSession | null> {
  const data = await getFromStore<{ key: string } & LocalSession>("session", "current");
  if (!data) return null;
  
  const { key, ...session } = data;
  return session;
}

export async function clearLocalSession(): Promise<void> {
  await deleteFromStore("session", "current");
}

// ============================================
// PROFILE MANAGEMENT - LOCAL FIRST
// ============================================

export async function saveLocalProfile(profile: UserProfile): Promise<void> {
  await putInStore("profile", profile);
}

export async function getLocalProfile(userId: string): Promise<UserProfile | null> {
  const profile = await getFromStore<UserProfile>("profile", userId);
  return profile || null;
}

export async function isSetupComplete(userId: string): Promise<boolean> {
  const profile = await getLocalProfile(userId);
  return profile?.setupComplete || false;
}

// ============================================
// PENDING ACTIONS QUEUE
// ============================================

export async function addPendingAction(action: Omit<PendingAction, "id" | "timestamp" | "synced">): Promise<void> {
  const pendingAction: PendingAction = {
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    synced: false,
  };
  await putInStore("pendingActions", pendingAction);
}

export async function getPendingActions(): Promise<PendingAction[]> {
  const actions = await getAllFromStore<PendingAction>("pendingActions");
  return actions.filter((a) => !a.synced).sort((a, b) => a.timestamp - b.timestamp);
}

export async function markActionSynced(id: string): Promise<void> {
  const action = await getFromStore<PendingAction>("pendingActions", id);
  if (action) {
    action.synced = true;
    await putInStore("pendingActions", action);
  }
}

export async function clearSyncedActions(): Promise<void> {
  const actions = await getAllFromStore<PendingAction>("pendingActions");
  const syncedActions = actions.filter((a) => a.synced);
  for (const action of syncedActions) {
    await deleteFromStore("pendingActions", action.id);
  }
}

// ============================================
// METADATA OPERATIONS
// ============================================

export async function getMetadata(key: string): Promise<any> {
  const data = await getFromStore<{ key: string; value: any }>("metadata", key);
  return data?.value;
}

export async function setMetadata(key: string, value: any): Promise<void> {
  await putInStore("metadata", { key, value });
}

// ============================================
// QUERY BY INDEX
// ============================================

export async function getByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => {
      console.error(`Failed to get by index from ${storeName}:`, request.error);
      resolve([]);
    };
  });
}

// ============================================
// CLEAR ALL DATA (for logout)
// ============================================

export async function clearAllData(): Promise<void> {
  await Promise.all([
    clearStore("customers"),
    clearStore("deliveries"),
    clearStore("production"),
    clearStore("payments"),
    clearStore("pendingActions"),
    clearStore("metadata"),
    clearStore("session"),
    clearStore("profile"),
  ]);
}
