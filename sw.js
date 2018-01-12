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

const IDB_VERS = 1;
const OBJ_STORE_NAME = 'forms';
const POST_URL = 'https://jsonplaceholder.typicode.com/posts';
const outboxIsSupported = ('serviceWorker' in navigator && 'SyncManager' in window);

// Open a new db to use as the Outbox
const openOutbox = () => {
  return new Promise(function(resolve, reject) {
    const request = indexedDB.open('outbox', IDB_VERS);
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

// Raw FormData object cannot be stored because it has method calls attached which IDB cannot store, so we'll only store the entries. The Service Worker will reconstruct a new FormData object using these key-value pairs before posting to server.
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
  // keyValues.forEach(pair => formData.append(pair.key, pair.value));
  // console.log(unpackFormData(formData));
  return formData;
}

// Post data to server over network if Outbox fails; an identical function should be used by Service worker to eventually sync Outbox with server.
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
    // .catch(error => reject(new Error("Failed to connect to server. Error Code: " + error.message)))
  });
};
