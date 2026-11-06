var CACHE = 'mapa-v1';
var SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'apple-touch-icon.png'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }));
  self.clients.claim();
});

// Página: primero la red (para tener siempre la última versión); sin señal, la copia guardada.
// Los links no pasan por acá: los guarda la página en el equipo.
self.addEventListener('fetch', function(e){
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function(r){
        var copy = r.clone();
        caches.open(CACHE).then(function(c){ c.put('index.html', copy); });
        return r;
      }).catch(function(){ return caches.match('index.html'); })
    );
  }
});
