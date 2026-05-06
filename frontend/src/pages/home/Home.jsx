import React from 'react'
import { useEffect } from 'react'
import Member from '../../components/member_lists/Member'
import Header from '../../components/header/Header'
import Search_icon from '../../components/search_icon/Search_icon'
import Footer from '../../components/footer/Footer'
import axios from "axios";
import { getFCMToken } from "../../firebase/firebase";

function Home() {


useEffect(() => {
  const setupNotifications = async () => {
    // 🔥 1. Ask permission FIRST
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("❌ Notification permission denied");
      return;
    }

    // 🔥 2. Then get FCM token
    const token = await getFCMToken();

    if (!token) return;

    // 🔥 3. Send token to backend
    await axios.post(`${import.meta.env.VITE_URL}/save-token`, {
      email: localStorage.getItem("email"),
      token,
    });

    console.log("✅ FCM token saved");
  };

  setupNotifications();
}, []);
  return (
    <>
    <Header/>
    <Member/>
    <Search_icon/>
    <Footer/>
    </>
  )
}

export default Home