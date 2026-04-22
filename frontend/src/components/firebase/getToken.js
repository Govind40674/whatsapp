import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";

export const getFCMToken = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: "YOUR_PUBLIC_VAPID_KEY",
    });

    return token;
  } catch (err) {
    console.log(err);
  }
};