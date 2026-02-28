
// Import and initialize the Firebase SDK
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

async function initMessaging() {
  let firebaseConfig = null;

  // On Firebase Hosting, this endpoint provides web config for the active site.
  try {
    const response = await fetch('/__/firebase/init.json');
    if (response.ok) {
      firebaseConfig = await response.json();
    }
  } catch (error) {
    // No-op: local/dev or non-Firebase-hosting environments may not expose this endpoint.
  }

  if (!firebaseConfig || !firebaseConfig.apiKey) {
    console.warn('[firebase-messaging-sw.js] Firebase config unavailable; background messaging disabled.');
    return;
  }

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload?.notification?.title || 'MJSTEM Update';
    const notificationOptions = {
      body: payload?.notification?.body || '',
      icon: '/icons/apple/apple-touch-icon-180x180.png',
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

initMessaging();
