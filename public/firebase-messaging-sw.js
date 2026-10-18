/* Service Worker: recebe notificações push quando o aplicativo está fechado.
   O servidor deverá enviar mensagens FCM com campos data.title e data.body,
   preferencialmente sem o campo notification para evitar avisos duplicados. */
self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch {
    payload = { data: { body: event.data ? event.data.text() : "" } };
  }
  const info = payload.data || payload.notification || {};
  const title = info.title || "Marcos Magazine";
  const body = info.body || "Nova solicitação de serviço";
  const url = info.url && String(info.url).startsWith("/") ? info.url : "/";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag: info.tag || "nova-solicitacao",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil((async () => {
    const clientsList = await clients.matchAll({ type: "window", includeUncontrolled: true });
    const sameOrigin = clientsList.find((client) => client.url.startsWith(self.location.origin));
    if (sameOrigin) { await sameOrigin.focus(); return; }
    await clients.openWindow(url);
  })());
});
