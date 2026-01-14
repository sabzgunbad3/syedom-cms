const CACHE_NAME = "dairyflow-v2";
const STATIC_CACHE = "dairyflow-static-v2";
const DYNAMIC_CACHE = "dairyflow-dynamic-v2";

// Static assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
];

// App shell routes to cache
const APP_ROUTES = [
  "/dashboard",
  "/deliveries",
  "/customers",
  "/payments",
  "/production",
  "/reports",
  "/settings",
  "/auth",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker v2...");
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker v2...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => 
            name.startsWith("dairyflow-") && 
            name !== STATIC_CACHE && 
            name !== DYNAMIC_CACHE
          )
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first for API, Cache first for assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip Supabase API requests - always fetch fresh when online
  if (url.hostname.includes("supabase")) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return empty response for offline API calls
        return new Response(JSON.stringify({ error: "offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      })
    );
    return;
  }

  // Skip external resources
  if (url.hostname !== self.location.hostname) {
    // Try to fetch, but don't fail on network errors
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // For navigation requests (HTML pages), use network-first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the successful response
          const clonedResponse = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(async () => {
          // Try to return cached version
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fall back to index.html for SPA routing
          return caches.match("/index.html") || caches.match("/");
        })
    );
    return;
  }

  // For other assets, use cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Update cache in background
        fetch(request)
          .then((response) => {
            if (response.status === 200) {
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, response);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // No cache, try network
      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Return offline fallback for HTML
          if (request.headers.get("Accept")?.includes("text/html")) {
            return caches.match("/index.html") || caches.match("/");
          }
          // Return empty response for other resources
          return new Response("", { status: 503 });
        });
    })
  );
});

// Background sync for offline data
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag);
  if (event.tag === "sync-deliveries") {
    event.waitUntil(notifyClientsToSync());
  }
});

// Notify all clients to sync
async function notifyClientsToSync() {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: "SYNC_REQUIRED" });
  });
}

// Listen for messages from clients
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});

// Push notification handler
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {
    title: "DairyFlow",
    body: "New update available",
  };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      vibrate: [100, 50, 100],
      data: data.url || "/",
    })
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow(event.notification.data || "/");
    })
  );
});
