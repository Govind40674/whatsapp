import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "whatsapp-2626c.firebaseapp.com",
  projectId: "whatsapp-2626c",
  storageBucket: "whatsapp-2626c.firebasestorage.app",
  messagingSenderId: "436835470842",
  appId: "1:436835470842:web:88db08f5a3ade46ac5a843",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const getFCMToken = async () => {
  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "👉 PASTE YOUR VAPID KEY HERE",
      });

      console.log("🔥 FCM Token:", token);
      return token;
    } else {
      console.log("❌ Notification permission denied");
    }
  } catch (err) {
    console.error("Token error:", err);
  }
};