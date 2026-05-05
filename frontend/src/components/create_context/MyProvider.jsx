import React, { useState,useEffect } from "react";
import { MyContext } from "./MyContext";
import { socket } from "../chat/socket";

function MyProvider({ children }) {
  const myemail = localStorage.getItem("email");
  const [value, setValue] = useState(0);
  const [member, setMember] = useState([]);
  const [onlineusers, setOnlineUsers] = useState([]);

useEffect(() => {
  // ✅ define handlers (VERY IMPORTANT)
  const handleOnline = (data) => {
    setOnlineUsers((prev) => {
      if (prev.includes(data)) return prev; // avoid duplicate
      return [...prev, data];
    });
  };

  const handleOffline = (data) => {
    setOnlineUsers((prev) =>
      prev.filter((user) => user !== data) // remove user
    );
  };

  // ✅ attach listeners
  socket.on("onlineusers", handleOnline);
  socket.on("offlineusers", handleOffline);

  // ✅ tell server I'm online
  socket.emit("user_online", myemail);

  // ✅ cleanup
  return () => {
    socket.off("onlineusers", handleOnline);
    socket.off("offlineusers", handleOffline);

    // notify server
    socket.emit("user_offline", myemail);
  };
}, []);

  return (
    <MyContext.Provider value={{ value, setValue, member, setMember, onlineusers, setOnlineUsers }}>
      {children}
    </MyContext.Provider>
  );
}

export default MyProvider;