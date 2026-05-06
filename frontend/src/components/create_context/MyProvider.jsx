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
    setOnlineUsers(data);
  };



  // ✅ attach listeners
  socket.on("onlineusers", handleOnline);
 

  // ✅ tell server I'm online
  socket.emit("user_online", myemail);

  // ✅ cleanup
  return () => {
    socket.off("onlineusers", handleOnline);
    

    // notify server
    
  };
}, []);

  return (
    <MyContext.Provider value={{ value, setValue, member, setMember, onlineusers, setOnlineUsers }}>
      {children}
    </MyContext.Provider>
  );
}

export default MyProvider;