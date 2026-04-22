import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"], // ✅ FIXED
});

// ✅ DEBUG (VERY IMPORTANT)
socket.on("connect", () => {
  console.log("✅ Socket Connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("❌ Socket Error:", err.message);
});