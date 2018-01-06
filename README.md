# The Outbox Pattern

This is a basic demo of the **outbox** or **queue** pattern for caching data before posting it to a server, using service workers, the SyncManager interface (also known as one-off Background Syncronization) and IndexedDB. This is intended to illustrate a generic and common use case for backround sync, though straight-forward examples of this were hard to find at the time of posting.

The basic pattern follows these steps:
1.

# Sources

I was just learning how to use background sync while I drafted this demo, so I borrowed snippets and patterns from the examples below.

https://developers.google.com/web/updates/2015/12/background-sync

https://github.com/WICG/BackgroundSync/tree/master/
https://jakearchibald.github.io/isserviceworkerready/demos/sync/

https://serviceworke.rs/request-deferrer_service-worker_doc.html


# Branches

Create git branches for other implementations that use various libraries:

- Plain IndexedDB
- IndexedDB w/ a simple promise wrapper
- IndexedDB via Jake Archibald's idb library (or idb-keyval)
- WorkBox
- ServiceWorkerWare
- localforage

send a pull request if you'd like to add your own implementation
