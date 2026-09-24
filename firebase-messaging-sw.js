/* Service worker ÚNICO do app (endereço neutro).
   1) Cache: REDE PRIMEIRO, cache só como reserva (sem internet, abre a última cópia).
   2) Avisos com o app fechado (push): mostra o "toque" que o carteiro manda.
   Não usa biblioteca externa (nada de importScripts) — assim nunca quebra ao carregar.
   NÃO guarda mensagens, fotos, senhas nem o desenho. O aviso só traz nome + "nova mensagem"/"chamada". */
var CACHE = "canal-livre-v2";
var APP_URL = "https://canal-livre.github.io/";
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

// ---------- avisos (push) ----------
self.addEventListener("push", function(e){
  var d = {};
  try{ d = e.data ? e.data.json() : {}; }catch(x){ try{ d = { notification:{ body: e.data.text() } }; }catch(y){ d = {}; } }
  var n = d.notification || {};
  var dados = d.data || {};
  var chamada = (dados.tipo === "chamada") || /chamada/i.test(n.body || "");
  var titulo = n.title || dados.de || "Canal";
  var corpo = n.body || (chamada ? "Chamada recebida" : "Nova mensagem");
  var link = (d.fcmOptions && d.fcmOptions.link) || n.click_action || APP_URL;
  e.waitUntil(self.registration.showNotification(titulo, {
    body: corpo,
    tag: n.tag || "canal",
    renotify: true,
    requireInteraction: !!chamada,
    vibrate: chamada ? [400,200,400,200,400] : [300,150,300],
    icon: "icon-192.png",
    badge: "icon-192.png",
    data: { link: link }
  }));
});

// tocar no aviso: abre (ou traz para a frente) o app
self.addEventListener("notificationclick", function(e){
  e.notification.close();
  var link = (e.notification.data && e.notification.data.link) || APP_URL;
  e.waitUntil(
    self.clients.matchAll({ type:"window", includeUncontrolled:true }).then(function(list){
      for(var i=0;i<list.length;i++){ if("focus" in list[i]) return list[i].focus(); }
      if(self.clients.openWindow) return self.clients.openWindow(link);
    })
  );
});
