import React, { useState } from "react";
import { MyContext } from "./MyContext";

function MyProvider({ children }) {
  const [value, setValue] = useState(0);
  const [member, setMember] = useState([]);

  return (
    <MyContext.Provider value={{ value, setValue, member, setMember }}>
      {children}
    </MyContext.Provider>
  );
}

export default MyProvider;