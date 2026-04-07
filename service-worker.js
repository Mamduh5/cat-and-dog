const CACHE_NAME = "backyard-ballistics-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.json",
  "./play/play.css",
  "./play/desktop/index.html",
  "./play/tablet/index.html",
  "./play/mobile/index.html",
  "./src/config.js",
  "./src/core/AssetRefs.js",
  "./src/core/Game.js",
  "./src/core/GameState.js",
  "./src/core/InputManager.js",
  "./src/core/Renderer.js",
  "./src/entities/FloatingText.js",
  "./src/entities/Particle.js",
  "./src/entities/Player.js",
  "./src/entities/Projectile.js",
  "./src/entities/Shockwave.js",
  "./src/play/boot.js",
  "./src/play/devicePresets.js",
  "./src/play/renderShell.js",
  "./src/pwa/register.js",
  "./src/scenes/BattleScene.js",
  "./src/scenes/EndScene.js",
  "./src/scenes/MenuScene.js",
  "./src/systems/AISystem.js",
  "./src/systems/CollisionSystem.js",
  "./src/systems/DamageSystem.js",
  "./src/systems/PhysicsSystem.js",
  "./src/systems/TurnSystem.js",
  "./src/systems/UISystem.js",
  "./src/utils/helpers.js",
  "./src/utils/math.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request).then((response) => {
        if (response.ok && ["script", "style", "image", "document", "font"].includes(request.destination)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
