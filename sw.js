self.importScripts('outbox.js')

console.log("This is your friendly neighborhood service worker.");

self.addEventListener('sync', (event) => {
  if (event.tag === 'outbox-sync') {
    // Use waitUntil() to guarantee another sync event is registered if this one fails
    event.waitUntil(
      openOutbox()
      .then(db => getDataFromOutbox(db))
      .then(formData => postDataToServer(formData))
      .then(response => console.log("Successfully posted to server!\nResponse: ", response))
      .catch(err => console.error("Failed to sync with server: ", err))
    )
  };
})
