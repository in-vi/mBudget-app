const CACHE_NAME = "budget-tracker-cache";
const urlsToCache = [
    "/",
    "/index.html",
    "/styles.css",
    "/script.js",
    "/icons/groceries.png",
    "/icons/eat-out.png",
    "/icons/train.png"
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

// Handling the fetch event
self.addEventListener("fetch", (event) => {
    const requestUrl = new URL(event.request.url);
    
    // If the request is for an external resource (e.g., Google Apps Script API)
    if (requestUrl.origin === "https://script.google.com") {
        event.respondWith(
            fetch(event.request) // Make a direct request to the external API
                .then((response) => {
                    return response; // Return the fetched response
                })
                .catch((error) => {
                    console.error("Error fetching external API:", error);
                    return new Response("Error fetching data", { status: 500 });
                })
        );
    } else {
        // Cache the request for internal assets
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request);
            })
        );
    }
});
