// OUTBOX MODULE: These functions and configuration details need to be reachable from both the service worker and index.js for making calls to IndexedDB and the network. For simplicity sake, I'm just adding another script tag to index.html and using importScripts() to pull everything into the Service Worker. Remember: sw.js runs in a different global scope from index.js (WorkerGlobalScope instead of Window) and will run independently even after the page/browser has been closed, so it needs to have its own copy of everything; ES6 import/export won't work either. I don't want to add any other dependencies to this demo, but in production a more robust module loader/bundler should be used.

// Globals
const IDB_VERS = 1;
const DB_NAME = 'outbox'
const OBJ_STORE_NAME = 'forms';
const POST_URL = 'https://jsonplaceholder.typicode.com/posts';

const outboxIsSupported = ('serviceWorker' in navigator && 'SyncManager' in window);

// Open the db we're using as our Outbox; a new instance will be created the first time it is called, or when the version number is updated.
const openOutbox = () => {
  return new Promise(function(resolve, reject) {
    const request = indexedDB.open(DB_NAME, IDB_VERS);
    request.onerror = function(event) {
      reject(event.target.errorcode);
    };
    request.onsuccess = function(event) {
      console.log("Database opened...");
      resolve(this.result);
    };
    request.onupgradeneeded = function(event) {
      const store = event.currentTarget.result.createObjectStore(
        OBJ_STORE_NAME, {keyPath:'id', autoIncrement: true}
      );
      console.log("onupgradeneeded() fired! store: ", store);
    };
  });
}

// Add Form Data to Outbox so it can be sync'ed with server when connectivity is restored.
const postDataToOutbox = (db, formData) => {
  return new Promise(function(resolve, reject) {
    const formArray = unpackFormData(formData);
    console.log("Outbox Array: ", formArray);
    const store = db.transaction(OBJ_STORE_NAME, 'readwrite').objectStore(OBJ_STORE_NAME);
    console.log(store);
    const request = store.add(...formArray);
    request.onerror = function(event) {
      reject(new Error(event.target.errorcode))
    };
    request.onsuccess = function(event) {
      resolve(event.target.result)
    };
  });
};

// Retrieve Form Data from Outbox when it's time to sync.
const getDataFromOutbox = (outbox) => {
  return new Promise(function(resolve, reject) {
    const store = outbox.transaction(OBJ_STORE_NAME, 'readwrite').objectStore(OBJ_STORE_NAME);
    console.log(store);
    const request = store.getAll();
    request.onerror = function(event) {
      reject(new Error("Could not access IDB. Error Code: " + event.target.errorcode))
    };
    request.onsuccess = function(event) {
      resolve(repackFormData(event.target.result))
    };
  });
};

// Post form data to server over the network.
const postDataToServer = (formData) => {
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
    .then(response => resolve(response))
    .catch(error => reject(new Error("Failed to connect to server. Error Code: " + error.message)))
  });
};

// A raw FormData object cannot be stored because it has method calls attached which IDB cannot store, so we'll only store the entries. The Service Worker will reconstruct a new FormData object using these key-value pairs before posting to server.
function unpackFormData(formData) {
  let arr = [];
  for (var [key, value] of formData.entries()) {
    arr.push({key, value})
  };
  return arr;
}

function repackFormData(keyValues) {
  const formData = new FormData();
  for (var pair of keyValues) {
    formData.append(pair.key, pair.value)
  };
  return formData;
}
