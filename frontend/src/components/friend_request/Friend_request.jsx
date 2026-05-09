import React, { useState } from "react";
import styles from "./Friend_request.module.css";
import axios from "axios";
import Footer from "../footer/Footer";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import EmailSchema from "../validation/input/EmailSchema";
import Header from "../header/Header";

function Friend_request() {
  const [requests, setRequests] = useState("");
  const [result, setResult] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(EmailSchema),
  });

  const ownemail = localStorage.getItem("email");

  // search user
  const fetchRequests = async (data) => {
    try {
      console.log("button clicked");
      const res = await axios.post(
        `${import.meta.env.VITE_URL}/friend-requests`,
        {
          email: data.email,
          ownemail: ownemail,
        },
        { withCredentials: true },
      );

      if (
        res.data.message === "already friend" ||
        res.data.message === "Cannot add yourself" ||
        res.data.message === "user not found" ||
        res.data.message === "Missing fields"
      ) {
        setResult(res.data.message);
        setRequests("");
      } else {
        setRequests(res.data);
        setResult("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // send request
  const handleSendRequest = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_URL}/send-friend-request`,
        {
          email: requests.email,
          ownemail: ownemail,
        },
        { withCredentials: true },
      );

      if (res.status === 200) {
        setResult(res.data.message);
        setRequests("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* <Header /> */}
      <form className={styles.container} onSubmit={handleSubmit(fetchRequests)}>
        <input
          type="text"
          className={styles.email}
          placeholder="Enter email..."
          {...register("email")}
        />

        <button type="submit">Search</button>
      </form>

      {errors.email && <p className={styles.error}>{errors.email.message}</p>}

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

      <Footer />
    </>
  );
}

export default Friend_request;
