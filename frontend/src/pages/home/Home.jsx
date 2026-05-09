import React from "react";
import { useEffect } from "react";
import Member from "../../components/member_lists/Member";
import Header from "../../components/header/Header";
import Search_icon from "../../components/search_icon/Search_icon";
import Footer from "../../components/footer/Footer";

import axios from "axios";
import { getFCMToken } from "../../components/firebase/firebase";

function Home() {
  // useEffect(() => {
  //   navigator.serviceWorker.getRegistrations().then((r) => {
  //     console.log("SW Registrations:", r);

  //     alert("SW count: " + r.length);
  //   });
  // }, []);
  useEffect(() => {
    const savetoken = async () => {
      try {
        const token = await getFCMToken();

        if (!token) return;

        const res = await axios.post(`${import.meta.env.VITE_URL}/save-token`, {
          email: localStorage.getItem("email"),
          fcmToken: token,
        });

        console.log(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    savetoken();
  }, []);

  return (
    <>
      {/* <button
        onClick={() => {
          console.log("Button clicked");
          savetoken();
        }}
      >
        Enable Notifications 🔔
      </button> */}
      <Header />
      <Member />
      <Search_icon />
      <Footer />
    </>
  );
}

export default Home;
