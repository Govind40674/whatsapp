import { Routes } from "react-router-dom"
import Router from "./components/routes/Router";
import { useEffect } from "react";




function App() {
  useEffect(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then((reg) => {
        console.log("✅ SW registered", reg);
        alert("SW registered");
      })
      .catch((err) => {
        console.error("❌ SW failed", err);
        alert("SW failed");
      });
  }
}, []);
  

  return (
    <>

    <Router/>
    {/* <h1>go</h1> */}
    
      
     
    </>
  )
}

export default App
