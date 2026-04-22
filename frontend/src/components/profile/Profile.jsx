import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./Profile.module.css";
import { useNavigate } from "react-router-dom";
import { FaEdit } from "react-icons/fa";
import Footer from "../footer/Footer";

function Profile() {
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_URL}/profile`,
        {
          params: { email: localStorage.getItem("email") },
        }
      );
      setResult(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleEdit = () => {
    navigate("/edit-profile"); // 👈 create this route
  };

  return (
    <>
    <div className={styles.container}>
      {result ? (
        <div className={styles.card}>
          {/* PROFILE IMAGE */}
          {result.image ? (
            <img src={result.image} alt="profile" className={styles.image} />
          ) : (
            <div className={styles.avatar}>
              {result.name?.[0]?.toUpperCase()}
            </div>
          )}

          {/* NAME */}
          <h2 className={styles.name}>{result.name}</h2>

          {/* EMAIL */}
          <p className={styles.email}>{result.email}</p>

          {/* EDIT BUTTON */}
          <button className={styles.editBtn} onClick={handleEdit}>
            <FaEdit /> Edit Profile
          </button>
        </div>
      ) : (
        <p className={styles.loading}>Loading...</p>
      )}
    </div>
    <Footer/>
    </>
    
  );
}

export default Profile;