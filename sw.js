console.log("This is your friendly neighborhood service worker.");

self.addEventListener('sync', (event) => {
  if (event.tag === 'outbox') {
    console.log(`Sync Event: `, event);
    event.waitUntil(
      caches.open('outbox').then((cache) => {
        cache.add('/index.html')
      })
    )
  }
})
