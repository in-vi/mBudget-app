const CACHE_NAME = "budget-tracker-cache";
const urlsToCache = [
    "/",
    "/index.html",
    "/style.css",
    "/script.js",
    "/icons/groceries.jpeg",
    "/icons/eat-out.jpeg",
    "/icons/train.jpeg"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache).then(() => {
                console.log("All files cached successfully");
            }).catch((error) => {
                console.error("Failed to cache files:", error);
            });
        })
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
