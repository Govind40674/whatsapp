import React from "react";
import { useEffect } from "react";
import Member from "../../components/member_lists/Member";
import Header from "../../components/header/Header";
import Search_icon from "../../components/search_icon/Search_icon";
import Footer from "../../components/footer/Footer";
// import axios from "axios";
import { getFCMToken } from "../../components/firebase/firebase";

function Home() {
  useEffect(() => {
    navigator.serviceWorker.getRegistrations().then((r) => {
      console.log("SW Registrations:", r);

      alert("SW count: " + r.length);
    });
  }, []);
  useEffect(() => {
    getFCMToken();
  }, []);

  return (
    <>
      <button
        onClick={() => {
          console.log("Button clicked");
          getFCMToken();
        }}
      >
        Enable Notifications 🔔
      </button>
      <Header />
      <Member />
      <Search_icon />
      <Footer />
    </>
  );
}

export default Home;
