import React, { useState } from 'react';
import styles from "./Login.module.css";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import LoginSchema from "../../validation/login/LoginSchema";

function Login() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(LoginSchema)
  });

  const onSubmit = async (data) => {
    try {
      setServerError("");
      setSuccessMsg("");

      const res = await fetch(`${import.meta.env.VITE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (!res.ok) {
        setServerError(result.message || "Invalid credentials");
        return;
      }

      setSuccessMsg("Login successful ✅");
      localStorage.setItem("token", result.token);
      localStorage.setItem("email", result.email); // ✅ store email
      console.log(result);

      navigate("/");

    } catch (error) {
      console.error(error);
      setServerError("Server not reachable");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formBox}>
        <h1 className={styles.heading}>Login</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            type="email"
            className={styles.input}
            {...register("email")}
            placeholder="Email"
          />
          <p className={styles.error}>{errors.email?.message}</p>

          <input
            type="password"
            className={styles.input}
            {...register("password")}
            placeholder="Password"
          />
          <p className={styles.error}>{errors.password?.message}</p>

          <button className={styles.button} type="submit">
            Login
          </button>
        </form>

        {/* Server messages */}
        {serverError && <p className={styles.error}>{serverError}</p>}
        {successMsg && <p className={styles.success}>{successMsg}</p>}

        {/* 👉 Signup button */}
        <p className={styles.switchText}>
          Don't have an account?
        </p>
        <button
          className={styles.signupButton}
          onClick={() => navigate("/signup")}
        >
          Signup
        </button>

      </div>
    </div>
  );
}

export default Login;