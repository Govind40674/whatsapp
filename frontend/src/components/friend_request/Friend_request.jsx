import React from "react";
import styles from "./Friend_request.module.css";
import axios from "axios";
import { useState } from "react";


function Friend_request() {
  // const [open, setOpen] =useState(false);
  const [requests, setRequests] = useState("");
  const [emailinput, setEmailInput] = useState("");
  const [result, setResult] = useState("");
  // const ownemail = localStorage.getItem("token.email");
  const ownemail = localStorage.getItem("email");
  console.log("ownemail:", ownemail);
  const fetchRequests = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_URL}/friend-requests`,
        { email: emailinput, ownemail: ownemail },
        { withCredentials: true },
      );
      // setRequests(res.data);
      if (res.data.message === "already friend") {
        setResult("Already friends 😔");
      } else {
        setRequests(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleSendRequest = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_URL}/send-friend-request`,
        {
          email: emailinput,
          ownemail: ownemail,
        },
        { withCredentials: true },
      );
      if (res.status === 200) {
        setResult(res.data.message);
        setRequests("");
      }

      // setResult(res.data.message);
    } catch (err) {
      console.error(err);
    }
  };

  const handlkeydown = (e) => {
    if (e.key === "Enter") {
      fetchRequests();
    }
  };
  // const navigate = useNavigate();

  return (
    <>
      <div className={styles.container}>
        <input
          type="text"
          className={styles.email}
          onKeyDown={handlkeydown}
          placeholder="Enter email..."
          onChange={(e) => setEmailInput(e.target.value)}
        />
      </div>
      {result && <div className={styles.result}>{result}</div>}
      {requests && (
        <div className={styles.send_requests}>
          <img src={requests.image} alt="" />
          <h4 className={styles.name}>{requests.email}</h4>
          <p className={styles.message}>{requests.name}</p>

          <button className={styles.send} onClick={handleSendRequest}>
            Send Request
          </button>
        </div>
      )}
    </>
  );
}

export default Friend_request;
