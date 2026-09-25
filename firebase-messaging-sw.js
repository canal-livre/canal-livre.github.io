/* Portal web2. Cache contains only public application files, never messages or profiles. */
var CACHE='portal-web2', APP_URL=self.location.origin+'/';
var ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png',
 './firebase-app-compat.js','./firebase-database-compat.js','./firebase-messaging-compat.js','./peerjs.min.js','./qrcode.js'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS);}));});
// Activate on next open, avoiding replacement during a conversation.
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.filter(function(k){return k==='canal-livre-v2'||k.indexOf('portal-web')===0&&k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){
 var r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==self.location.origin)return;
 if(r.mode==='navigate'){
  e.respondWith(fetch(r).then(function(v){if(v.ok){var copy=v.clone();e.waitUntil(caches.open(CACHE).then(function(c){return c.put('./index.html',copy);}));}return v;}).catch(function(){return caches.match('./index.html').then(function(v){return v||Response.error();});}));return;
 }
 if(!ASSETS.some(function(a){return new URL(a,self.registration.scope).pathname===u.pathname;}))return;
 e.respondWith(caches.match(r).then(function(v){return v||fetch(r);}));
});
self.addEventListener('push',function(e){
 e.waitUntil(self.registration.showNotification('Portal',{body:'Há uma atualização disponível.',tag:'portal-atualizacao',icon:'icon-192.png',badge:'icon-192.png',data:{link:APP_URL}}));
});
self.addEventListener('notificationclick',function(e){e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){for(var i=0;i<list.length;i++){if(new URL(list[i].url).origin===self.location.origin&&'focus' in list[i])return list[i].focus();}return self.clients.openWindow(APP_URL);}));});
