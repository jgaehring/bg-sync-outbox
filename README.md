# The Outbox Pattern
This is a basic demo of the **outbox** or **queue** pattern for caching a web application's form data when it's ready to be sent but lacks network connectivity, then posting it to a server in the background when connectivity is restored. It uses IndexedDB and Background Sync (a.k.a. the SyncManager interface of the Service Worker API, a.k.a. 'one-off' Background Sync). This is intended to illustrate a rudimentary, generic and common use case for background sync, following these steps:

1. Try to send form data over the network first. (see ["Network First"](#network-first) below)
2. If the network request fails, store the form data in IndexedDB.
3. Fire a sync event once the data is stored.
4. When the sync event fires, take the form data from IDB and try sending it over the network again.
5. If the sync fails, keep retrying; a new sync event should be triggered each time one fails, as long as `.waitUntil()` is used.
6. Once the sync event succeeds, the form data can be deleted from IDB (optional).

At the time of posting this, there were many great demos illustrating background sync and how to create an outbox, but they got very involved with the view layer or with illustrating other features that are not essential to background sync, such as push notifications (instead, I'm just using `console.log()` to observe progress). I couldn't find a rudimentary example for showing the essential inner workings of the `'sync'` event and IndexedDB. I also wanted an example which didn't rely on other libraries, particularly for interacting with IndexedDB, although Jake Archibald's [idb](https://www.npmjs.com/package/idb) library should be recommended for real world applications. The only dependencies in this project are for the Node server.

Those other demos provide great examples of how to use and structure an "outbox" database in a larger application, and address some best practices I didn't want to go into here. They're great references, and I drew heavily from their examples in creating this demo:

- https://developers.google.com/web/updates/2015/12/background-sync  
- https://github.com/WICG/BackgroundSync/  
- https://github.com/jakearchibald/emojoy  
- https://serviceworke.rs/request-deferrer_service-worker_doc.html  
- https://www.twilio.com/blog/2017/02/send-messages-when-youre-back-online-with-service-workers-and-background-sync.html  

## FormData and Other Types of Data
I've focused here on multipart/form-data requests, but the basic pattern should apply to just about any RESTful HTTP requests to post data. The FormData object requires a little extra processing, since it cannot be stored in IndexedDB directly, but the trade-off is that it makes it trivial to handle any number of inputs of any type. You should be able to add or remove form elements to `index.html` without changing the logic or database scheme at all.

# Server
Included is a basic Node server for mocking. I just wanted something that would be able to verify that all form data was received and send an appropriate response to fetch calls. For just about all types of form data, [JSONPlaceholder](http://jsonplaceholder.typicode.com/) by typicode would have sufficed, but for uploading files I needed an Express server with [Multer](https://github.com/expressjs/multer) that could read and write the files to disk. Files will be saved in `./files` so their full contents can be viewed; the directory will be created the first time the server starts. The server is strictly for testing locally and does not give any regard to security, so it should never be exposed to the network.

To start the server, simply run `npm install && node server.js` from the project's root.

**Node version 8.6.0 or higher is required.**

# Network First
Since the main goal here is to send data, it makes sense to use a network-first approach, only using the outbox as a fallback, so we're not unnecessarily delaying our network calls when connectivity is strong. This assumes that persisting data to the server is our single purpose, with no other need to store data in IDB beyond that ultimate goal. We can even discard the entries in IDB once the POST call succeeds. Of course, there are many cases where one might wish to persist data in IDB for extended use by the client, and where local persistence might even take precedence over updating the server; however, such use cases introduce more complexity and go beyond the generic scope of the "outbox" model I was trying to exemplify here.

# Browser Support
While [other parts of the Service Worker API are seeing broader and broader support across all browsers](https://jakearchibald.github.io/isserviceworkerready/), Background Sync is still relegated to newer versions of Chrome (v.49 or higher), although it's currently in development for Firefox and Edge. I've also made generous use of ES6+ syntax, since it's already assumed a contemporary browser is being used to support the sync features.

# Other implementations
Over time it would be nice to add other implementations as separate branches of this repo, using some common libraries:
- Jake Archibald's [idb](https://www.npmjs.com/package/idb) library (or [idb-keyval](https://www.npmjs.com/package/idb-keyval))
- WorkBox
- ServiceWorkerWare
- localforage
