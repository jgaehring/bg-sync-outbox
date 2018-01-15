// Import the Outbox module. Remember: sw.js runs in a different global scope from the rest of the page scripts (WorkerGlobalScope instead of Window) and will run independently even after the page/browser has been closed, so it needs to have its own copy of everything.
self.importScripts('outbox.js')

// Listen for a sync event to start trying to send Form Data from the Outbox to the Server. Use waitUntil() to guarantee another sync event is registered if this one fails.
self.addEventListener('sync', (event) => {
  if (event.tag === 'outbox-sync') {
    console.log("Sync event fired");
    event.waitUntil(
      openOutbox()
      .then(db => getDataFromOutbox(db))
      .then(formData => postDataToServer(formData))
      .then(response => {
        console.log("Successfully posted to server!\nResponse: ", response);
      })
      .catch(error => {
        console.error("Failed to sync with server: ", error);
        return Promise.reject(error);
      })
    )
  };
})
