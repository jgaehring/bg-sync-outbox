navigator.serviceWorker.register('sw.js')
  .then( () => console.log("Service Worker registered successfully!"))
  .catch( (err) => console.error(err));

const IDB_VERS = 1

const postDataToServer = () => {};

const postDataToOutbox = () => {
  let db;
  let request = window.indexedDB.open('outbox', IDB_VERS);
  request.onerror = (event) => {/*DO SOMETHING*/};
  request.onsuccess = (event) => {/*DO SOMETHING*/};
  request.onupgradeneeded = (event) => {/*DO SOMETHING*/};

};

document.getElementById('btn-2').addEventListener('click', (event) => {
  console.log("Click Event: ", event);
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then( (reg) => {
      return reg.sync.register('outbox');
    }).then( () => {
      postDataToOutbox();
    }).catch( () => {
      // system was unable to register for a sync,
      // this could be an OS-level restriction
      postDataToServer();
    });
  } else {
    // serviceworker/sync not supported
    postDataToServer();
  }
});
