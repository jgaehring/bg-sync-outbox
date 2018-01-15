// Register Service Worker, if supported
if (outboxIsSupported) {
  navigator.serviceWorker.register('sw.js')
  .then(() => console.log("Service Worker registered successfully!"))
  .catch(err => console.error(err));
}

// Try submitting the Form Data over the network first, but if this fails, store it in Outbox, then trigger a sync event to keep retrying the network until it succeeds.
const form = document.querySelector('.form');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  postDataToServer(formData)
  .then(response => console.log("Successfully posted to server!\nResponse: ", response))
  .catch(err => {
    if (outboxIsSupported) {
      openOutbox()
      .then(db => postDataToOutbox(db, formData))
      .then(() => navigator.serviceWorker.ready)
      .then(reg => reg.sync.register('outbox-sync'))
      .catch(err => err);
    } else {
      console.error("Network down; outbox not supported.", err);
    }
  })
});
