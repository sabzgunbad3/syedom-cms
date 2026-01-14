// IndexedDB-based offline storage with sync queue
const DB_NAME = "dairyflow_db";
const DB_VERSION = 2;

export interface PendingAction {
  id: string;
  table: string;
  action: "insert" | "update" | "delete";
  data: any;
  timestamp: number;
  synced: boolean;
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

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Failed to open IndexedDB");
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create object stores
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
      if (!database.objectStoreNames.contains("pendingActions")) {
        const pendingStore = database.createObjectStore("pendingActions", { keyPath: "id" });
        pendingStore.createIndex("by_synced", "synced", { unique: false });
      }
      if (!database.objectStoreNames.contains("metadata")) {
        database.createObjectStore("metadata", { keyPath: "key" });
      }
    };
  });
}

// Generic CRUD operations
export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getFromStore<T>(storeName: string, id: string): Promise<T | undefined> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putInStore<T>(storeName: string, data: T): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearStore(storeName: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function bulkPutInStore<T>(storeName: string, items: T[]): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    items.forEach((item) => {
      store.put(item);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Pending Actions Queue
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

// Metadata operations
export async function getMetadata(key: string): Promise<any> {
  const data = await getFromStore<{ key: string; value: any }>("metadata", key);
  return data?.value;
}

export async function setMetadata(key: string, value: any): Promise<void> {
  await putInStore("metadata", { key, value });
}

// Query by index
export async function getByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
