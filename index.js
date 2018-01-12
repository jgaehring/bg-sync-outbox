// Globals
const IDB_VERS = 1;
const OBJ_STORE_NAME = 'forms';
const POST_URL = 'https://jsonplaceholder.typicode.com/posts'

// Register Service Worker, if supported
const outboxIsSupported = (('serviceWorker' in navigator && 'SyncManager' in window))
if (outboxIsSupported) {
  navigator.serviceWorker.register('sw.js')
  .then( () => console.log("Service Worker registered successfully!"))
  .catch( (err) => console.error(err));
}

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

// Attach an event listener to hand over form submission to the Service Worker, if one exists.
// TODO: Try moving all this logic to the SW as a 'fetch' event listner for 'POST' calls.
const form = document.querySelector('.form');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  postDataToServer(formData)
  .then(response => console.log("Successfully posted to server!\nResponse: ", response))
  .catch( (err) => {
    if (outboxIsSupported) {
      openOutbox()
      .then(db => postDataToOutbox(db, formData))
      .then(result => console.log(result))
      .then(() => navigator.serviceWorker.ready)
      .then(reg => reg.sync.register('outbox-sync'))
      .catch(err => err);
    } else {
      console.error("Network down; outbox not supported.", err);
    }
  })
});

// Raw FormData object cannot be stored because it has method calls attached which IDB cannot store, so we'll only store the entries. The Service Worker will reconstruct a new FormData object using these key-value pairs before posting to server.
function unpackFormData(formData) {
  let arr = [];
  for (var [key, value] of formData.entries()) {
    arr.push({key, value})
  };
  return arr;
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
    .catch(error => reject(error))
  });
};

// Add Form Data to Outbox so Service Worker can post to server when it has connectivity.
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
