/* Service worker do app (endereço próprio e neutro).
   REDE PRIMEIRO, cache só como reserva. Com internet, sempre a versão do
   servidor; sem internet, a última cópia que funcionou.
   NÃO guarda mensagens, fotos, senhas nem o desenho. */
var CACHE = "canal-livre-v1";
var BASICOS = ["./", "./index.html", "./manifest.json", "icon-192.png", "icon-512.png"];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(BASICOS); }).catch(function(){}));
});
self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); }).catch(function(){})
  );
});
self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  if(new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function(resp){
      if(resp && resp.status === 200 && resp.type === "basic"){
        var copia = resp.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copia); }).catch(function(){});
      }
      return resp;
    }).catch(function(){
      return caches.match(req).then(function(m){ return m || caches.match("./index.html"); });
    })
  );
});
