// Import the Outbox module. Remember: sw.js runs in a different
// global scope from the rest of the page scripts (WorkerGlobalScope
// instead of Window) and will run independently even after the
// page/browser has been closed, so it needs to have its own copy
// of everything.
self.importScripts('outbox.js')

// Listen for a sync event to start trying to send Form Data from
// the Outbox to the Server. Use waitUntil() to guarantee another
// sync event is registered if this one fails.
self.addEventListener('sync', event => {
  console.log("Sync event fired!");
  if (event.tag === 'outbox-sync') {
    event.waitUntil(
      openOutbox()
      .then(db => syncOutbox(db))
      .then(results => handleSyncResults(results))
      .catch(error => handleSyncError(error))
    )
  };
})

// Once the Outbox is open, try syncing: take array of forms out of Outbox,
// convert the key-values back into FormData objects, and try sending.
// If successful, delete the form from Outbox and return the server response.
const syncOutbox = (db) => {
  return new Promise((resolve, reject) => {
    getAllFormsFromOutbox(db)
    .then(forms => Promise.all(
      forms.map(form => {
        const formData = repackFormData(form)
        return postFormToServer(formData)
        .then(response => {
          deleteFormFromOutbox(db, form.id);
          return Promise.resolve(response);
        })
        .catch(error => Promise.reject(error));
      })
    ))
    .then(results => resolve(results))
    .catch(error => reject(error))
  });
}

// I'm just handling the sync results/error by logging messages
// to the console, but this is where one could trigger an event in
// the main page to alert the user, navigate to a new page, etc.
const handleSyncResults = (results) => {
  results.forEach(result => {
    console.log(
      "Successfully posted to server!\n" +
      "Results: \n",
      result
    );
  })
}
const handleSyncError = (error) => {
  console.log(
    "The server couldn't be reached.\n" +
    "Reason: " + error + "\n" +
    "We'll retry in a few minutes."
  );
  // Important! Return a rejected Promise so the 'sync' event will fire again.
  return Promise.reject(error);
}
