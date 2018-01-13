# The Outbox Pattern

This is a basic demo of the **outbox** or **queue** pattern for caching data before posting it to a server with Service Worker. It uses IndexedDB and Background Sync (the SyncManager interface, also known as one-off Background Sync). This is intended to illustrate a generic and common use case for background sync, though straight-forward examples of this were hard to find at the time of posting.

At the time of posting this, there were many great demos illustrating background sync, but they got very involved with the view layer or with illustrating other features which are not essential to background sync, such as push notifications. I also wanted an example which didn't rely on other libraries, particularly for interacting with IndexedDB. These other demos provide great examples of how to use and structure an outbox in a larger application, and address some best practices I don't want to go into here. They're great references, and I used them a lot in creating this demo:

https://developers.google.com/web/updates/2015/12/background-sync
https://github.com/WICG/BackgroundSync/tree/master/
https://jakearchibald.github.io/isserviceworkerready/demos/sync/
https://serviceworke.rs/request-deferrer_service-worker_doc.html


# Other implementations

Over time it would be nice to add other implementations, in their own branches of this repo, using some common libraries:
- IndexedDB w/ a simple promise wrapper
- IndexedDB via Jake Archibald's idb library (or idb-keyval)
- WorkBox
- ServiceWorkerWare
- localforage

# Network First

As a POST request, it makes sense to use a network-first approach, so we're not unnecessarily delaying our network calls when connectivity is strong. This assumes that persisting data to the server is our main goal, with no other need to store data in IDB beyond that ultimate purpose. We can discard the entries in IDB once the POST call succeeds. Of course, there are many cases where one might wish to persist data in IDB for extended use by the client, and where local persistence might take precedence over updating the server; however, such use cases introduce more complexity and go beyond the generic example of an "outbox" I was trying to exemplify here.
