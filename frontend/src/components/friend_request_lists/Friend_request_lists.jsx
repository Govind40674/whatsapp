import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./Friend_request_lists.module.css";
import { MyContext } from "../create_context/MyContext";
import { useContext } from "react";

function Friend_request_lists() {
  const { setValue } = useContext(MyContext);
  const [friendRequests, setFriendRequests] = useState([]);

  const email = localStorage.getItem("email");

  // 🔹 Fetch requests
  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_URL}/friend-requests-lists`,
          {
            params: { email },
            withCredentials: true,
          }
        );
        

        setFriendRequests(res.data);

      } catch (err) {
        console.error(err);
      }
    };

    fetchFriendRequests();
  }, [email]);

  // 🔹 Accept request
  const handleAccept = async (requestemail) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_URL}/friend-requests/accept`,
        {
          email,
          requestemail,
        },
        { withCredentials: true }
      );

      // remove from UI
      setFriendRequests((prev) =>
        prev.filter((req) => req !== requestemail)
      );
      setValue((prev) => prev + 1); // trigger member list refresh

    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Reject request
  const handleReject = async (requestemail) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_URL}/friend-requests/reject`,
        {
          email,
          requestemail,
        },
        { withCredentials: true }
      );

      // remove from UI
      setFriendRequests((prev) =>
        prev.filter((req) => req !== requestemail)
      );

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Friend Requests</h2>

      {friendRequests.length === 0 ? (
        <p className={styles.empty}>No friend requests found.</p>
      ) : (
        <div className={styles.list}>
          {friendRequests.map((request) => (
            <div key={request} className={styles.requestItem}>
              
              {/* 🔹 Email */}
              <p className={styles.email}>{request}</p>

              {/* 🔹 Buttons */}
              <div className={styles.actions}>
                <button
                  className={styles.acceptButton}
                  onClick={() => handleAccept(request)}
                >
                  Accept
                </button>

                <button
                  className={styles.rejectButton}
                  onClick={() => handleReject(request)}
                >
                  Reject
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Friend_request_lists;
