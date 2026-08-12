'use strict';

const CACHE = 'summersonic2026-v9';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './assets/timetable_tokyo0815.jpg',
  './assets/icon-180.png',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE).then(function(cache){
      var failed = false;
      return Promise.all(ASSETS.map(function(path){
        var url = new URL(path, self.registration.scope).href;
        return fetch(url,{cache:'reload'}).then(function(response){
          if(!response || !response.ok)throw new Error('Precache failed: '+path);
          return cache.put(url,response);
        }).catch(function(){failed=true;});
      })).then(function(){
        if(!failed)return;
        return caches.delete(CACHE).then(function(){throw new Error('Precache incomplete; keeping the previous version.');});
      });
    }).then(function(){return self.skipWaiting();})
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(key){return key.indexOf('summersonic2026-')===0 && key!==CACHE;}).map(function(key){return caches.delete(key);}));
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch', function(event){
  var request = event.request;
  if(request.method!=='GET')return;
  event.respondWith(
    caches.match(request,{ignoreSearch:true}).then(function(cached){
      if(cached)return cached;
      return fetch(request).then(function(response){
        if(!response || !response.ok || response.type==='opaque')return response;
        var copy=response.clone();
        caches.open(CACHE).then(function(cache){cache.put(request,copy);});
        return response;
      });
    })
  );
});
