import React, { useState, useEffect } from "react";
import styles from "./Signup.module.css";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import SignupSchema from "../../validation/signup/SignupSchema";

function Signup() {
  const navigate = useNavigate();

  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ NEW

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(SignupSchema(otpSent)),
  });

  useEffect(() => {
    reset(getValues());
  }, [otpSent, reset, getValues]);

  // ✅ SEND OTP
  const handleSendOtp = async () => {
    try {
      setServerError("");
      setSuccessMsg("");

      const email = getValues("email");

      if (!email) {
        setServerError("Enter email first");
        return;
      }

      setLoading(true); // 🔥 START LOADING

      const res = await fetch(`${import.meta.env.VITE_URL}/otp-send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();

      if (!res.ok) {
        setServerError(result.message || "Failed to send OTP");
        return;
      }

      setOtpSent(true);
      setSuccessMsg("OTP sent to your email ✅");
    } catch (error) {
      console.error(error);
      setServerError("Server not reachable");
    } finally {
      setLoading(false); // 🔥 STOP LOADING
    }
  };

  // ✅ REGISTER
  const onSubmit = async (data) => {
    try {
      setServerError("");
      setSuccessMsg("");

      const res = await fetch(`${import.meta.env.VITE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setServerError(result.message || "Registration failed");
        return;
      }

      // localStorage.setItem("token", result.token);
      localStorage.setItem("token", result.token);
      localStorage.setItem("email", result.email);
      setSuccessMsg("Signup successful ✅");
      navigate("/");
    } catch (error) {
      console.error(error);
      setServerError("Server not reachable");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formBox}>
        <h1 className={styles.heading}>Signup</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* EMAIL */}
          <input
            className={styles.input}
            {...register("email")}
            placeholder="Email"
          />
          <p className={styles.error}>{errors.email?.message}</p>

          {/* SEND OTP BUTTON */}
          {!otpSent && (
            <button
              type="button"
              className={styles.button}
              onClick={handleSendOtp}
              disabled={loading} // 🔥 disable while loading
            >
              {loading ? <span className={styles.spinner}></span> : "Send OTP"}
            </button>
          )}

          {/* OTP */}
          {otpSent && (
            <>
              <input
                className={styles.input}
                {...register("otp")}
                placeholder="Enter OTP"
              />
              <p className={styles.error}>{errors.otp?.message}</p>
            </>
          )}

          {/* PASSWORD */}
          {otpSent && (
            <>
              <input
                type="password"
                className={styles.input}
                {...register("password")}
                placeholder="Password"
              />
              <p className={styles.error}>{errors.password?.message}</p>
            </>
          )}

          {/* REGISTER */}
          {otpSent && (
            <button className={styles.button} type="submit">
              Register
            </button>
          )}
        </form>

        {serverError && <p className={styles.error}>{serverError}</p>}
        {successMsg && <p className={styles.success}>{successMsg}</p>}
      </div>
    </div>
  );
}

export default Signup;
