// Globals
const IDB_VERS = 1;
const OBJ_STORE_NAME = 'forms';
const POST_URL = 'https://jsonplaceholder.typicode.com/posts'

// Register Service Worker, if supported
const useServiceWorker = (('serviceWorker' in navigator && 'SyncManager' in window))
if (useServiceWorker) {
  navigator.serviceWorker.register('sw.js')
  .then( () => console.log("Service Worker registered successfully!"))
  .catch( (err) => console.error(err));
}

// Open a new db to use as the Outbox
let outboxDB;
const openOutbox = () => {
  const request = indexedDB.open('outbox', IDB_VERS);
  request.onerror = function(event) {
    console.error(event.target.errorcode);
  };
  request.onsuccess = function(event) {
    console.log("Database opened...");
    outboxDB = this.result;
  };
  request.onupgradeneeded = function(event) {
    // const db = event.target.result;
    const store = event.currentTarget.result.createObjectStore(
      OBJ_STORE_NAME, {keyPath:'id', autoIncrement: true}
    );
    console.log("onupgradeneeded() fired! store: ", store);
  };
}
openOutbox();

// Attach an event listener to hand over form submission to the Service Worker, if one exists.
const form = document.querySelector('.form');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  if (useServiceWorker) {
    postDataToOutbox(formData, outboxDB);
    navigator.serviceWorker.ready.then( (reg) => {
      return reg.sync.register('outbox');
    });
  } else {
    postDataToServer(formData);
  }
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
  fetch(POST_URL, {
    method: 'POST',
    body: formData
  })
    .then(resp => resp.json())
    .then(data => console.log("Response: ", data))
};

// Add Form Data to Outbox so Service Worker can post to server when it has connectivity.
const postDataToOutbox = (formData, outboxDB) => {
  const formArray = unpackFormData(formData);
  console.log("Outbox Array: ", formArray);
  const store = outboxDB.transaction(OBJ_STORE_NAME, 'readwrite').objectStore(OBJ_STORE_NAME);
  console.log(store);
  const request = store.add(...formArray);
  request.onerror = function(event) {
    console.error(event.target.errorcode)
  };
  request.onsuccess = function(event) {
    console.log("Post Result: ", event.target.result)
  };
};
