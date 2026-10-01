var CACHE = 'panel-chiringuito-v1';
var SHELL = ['panel.html'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(cache){ return cache.addAll(SHELL); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  if (e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request).catch(function(){ return caches.match('panel.html'); })
    );
  }
});
