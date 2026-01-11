// This file is intentionally left blank in this template.
// It will be populated with the necessary Firebase messaging service worker code.
// For security reasons, the actual code containing API keys is not shown here.

// In a real application, this file would contain:
// 1. Imports for the Firebase SDK
// 2. Firebase app initialization with your project's config
// 3. A background message handler

// Example structure:
/*
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

*/
// NOTE: For this to work, you MUST replace the placeholder firebaseConfig
// with your actual Firebase project configuration.
self.addEventListener('fetch', () => {
  // This is a placeholder to ensure the service worker is installed.
});
