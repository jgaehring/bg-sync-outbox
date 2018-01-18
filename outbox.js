// OUTBOX MODULE: These functions and configuration details need to be
// reachable from both the service worker and index.js for making
// calls to IndexedDB and the network. For simplicity sake, I'm just
// adding another script tag to index.html and using importScripts()
// to pull everything into the Service Worker. I don't want to add any
// other dependencies to this demo, but in production a more robust
// module loader/bundler should be used.

// Globals
const IDB_VERS = 1;
const DB_NAME = 'outbox'
const OBJ_STORE_NAME = 'forms-v' + IDB_VERS;
const POST_URL = 'https://jsonplaceholder.typicode.com/posts';

const outboxIsSupported = ('serviceWorker' in navigator && 'SyncManager' in window);

// Post form data to server over the network.
const postFormToServer = (formData) => {
  return new Promise(function(resolve, reject) {
    fetch(POST_URL, {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(response.statusText)
      }
      return response.json();
    })
    .catch(error => reject(error))
    .then(response => resolve(response))
  });
};

// Open the db we're using as our Outbox; a new instance will be created
// the first time it is called, or when the version number is updated.
const openOutbox = () => {
  return new Promise(function(resolve, reject) {
    const request = indexedDB.open(DB_NAME, IDB_VERS);
    request.onerror = function(event) {
      reject(event.target.errorcode);
    };
    request.onsuccess = function(event) {
      console.log("Outbox opened...");
      resolve(this.result);
    };
    request.onupgradeneeded = function(event) {
      const store = event.currentTarget.result.createObjectStore(
        OBJ_STORE_NAME, {keyPath:'id', autoIncrement: true}
      );
      const msg = (event.oldVersion === 0) ?
        "Outbox installed!" :
        `Outbox upgraded from v.${event.oldVersion} to v.${event.newVersion}!`
      console.log(msg);
    };
  });
}

// Add Form Data to Outbox so it can be sync'ed with server when
// connectivity is restored.
const addFormToOutbox = (db, formData) => {
  return new Promise(function(resolve, reject) {
    const formArray = unpackFormData(formData);
    const store = db.transaction(OBJ_STORE_NAME, 'readwrite').objectStore(OBJ_STORE_NAME);
    const request = store.add(formArray);
    request.onerror = function(event) {
      reject(new Error(event.target.errorcode))
    };
    request.onsuccess = function(event) {
      console.log("Form data saved to outbox successfully.");
      resolve(event.target.result);
    };
  });
};

// Retrieve Form Data from Outbox when it's time to sync.
const getAllFormsFromOutbox = (outbox) => {
  return new Promise(function(resolve, reject) {
    const store = outbox.transaction(OBJ_STORE_NAME, 'readonly').objectStore(OBJ_STORE_NAME);
    const request = store.getAll();
    request.onerror = function(event) {
      reject(new Error("Could not access IDB. Error Code: " + event.target.errorcode))
    };
    request.onsuccess = function(event) {
      console.log("Form data retrieved from outbox.");
      resolve(event.target.result)
    };
  });
};

// When forms have successfully reached the server, we can delete them
// from IDB, which makes sure they are not resent during a later sync.
const deleteFormFromOutbox = (db, id) => {
  return new Promise((resolve, reject) => {
    const store = db.transaction(OBJ_STORE_NAME, 'readwrite').objectStore(OBJ_STORE_NAME);
    const request = store.delete(id)
    request.onsuccess = (event) => {
      resolve()
    };
    request.onerror = (event) => {
      reject(console.error(`Failed to clear form id#${id} from db. Error code: ${event.error}`))
    };
  });
}

// A raw FormData object cannot be stored because it has method calls
// attached which IDB cannot store, so we'll only store the entries.
// The Service Worker will reconstruct a new FormData object using
// these key-value pairs before posting to server.
const unpackFormData = (formData) => {
  let arr = [];
  for (var [key, value] of formData.entries()) {
    arr.push({key, value})
  };
  return arr;
}

const repackFormData = (keyValues) => {
  const formData = new FormData();
  for (var pair of keyValues) {
    formData.append(pair.key, pair.value)
  };
  return formData;
}
