// eslint-disable-next-line no-undef
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
// eslint-disable-next-line no-undef
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// ✅ important
const firebase = self.firebase;

// ✅ paste REAL config (same as frontend)
firebase.initializeApp({
  apiKey: "AIzaSyBSW_Dm_u0Ujrf6CjfO6r2kJaTYYVFVAdU",
  authDomain: "whatsapp-2626c.firebaseapp.com",
  projectId: "whatsapp-2626c",
  messagingSenderId: "436835470842",
  appId: "1:436835470842:web:88db08f5a3ade46ac5a843",
});

const messaging = firebase.messaging();

// ✅ background notification
messaging.onBackgroundMessage((payload) => {
  console.log("🔥 Background message:", payload);

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
  });
});