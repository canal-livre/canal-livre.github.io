/* Service worker do FCM (avisos com o app fechado).
   Só recebe o "toque" (título + corpo). As mensagens de verdade NÃO passam por aqui —
   continuam criptografadas ponta a ponta pelo canal P2P. */
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:"AIzaSyAYkGkibjEBZEqzQHN4RY3p3nhmXQa7q2Q",
  authDomain:"portal-interno-cd2a8.firebaseapp.com",
  projectId:"portal-interno-cd2a8",
  messagingSenderId:"93288022454",
  appId:"1:93288022454:web:99e1ddfb77a26067b20117"
});

var messaging = firebase.messaging();

// O carteiro manda um payload "notification" (webpush), então o próprio navegador já
// mostra o aviso com o app fechado. Este handler cobre o caso de mensagem só-dados.
messaging.onBackgroundMessage(function(payload){
  try{
    if(payload && payload.notification) return; // já foi mostrado automaticamente
    var d=(payload && payload.data) || {};
    var titulo=d.de || "Canal";
    var corpo=(d.tipo==="chamada") ? "Chamada recebida" : "Nova mensagem";
    self.registration.showNotification(titulo,{ body:corpo, tag:"canal", renotify:true });
  }catch(e){}
});

// Ao tocar no aviso, abre/foca o app.
self.addEventListener("notificationclick", function(e){
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type:"window", includeUncontrolled:true }).then(function(list){
      for(var i=0;i<list.length;i++){ if("focus" in list[i]) return list[i].focus(); }
      if(clients.openWindow) return clients.openWindow("https://canal-livre.github.io/");
    })
  );
});
