import React, { useEffect, useState } from "react";
import styles from "./Edit_profile.module.css";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import EditProfileSchema from "../validation/editprofile/Edit_profileSchema";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Edit_profile() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(EditProfileSchema),
  });

  // ✅ Prefill
  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(`${import.meta.env.VITE_URL}/profile`, {
        params: { email: localStorage.getItem("email") },
      });

      setValue("name", res.data.name);
      setPreview(res.data.image);
    };

    fetchData();
  }, [setValue]);

  // ✅ Submit
  const onSubmit = async (data) => {
    try {
      const formData = new FormData();

      formData.append("name", data.name);
      formData.append("email", localStorage.getItem("email"));

      if (data.image && data.image[0]) {
        formData.append("image", data.image[0]);
      }

      if (data.password) {
        formData.append("password", data.password);
      }

      // await axios.put(`${import.meta.env.VITE_URL}/profile/update`, formData);
      await axios.put(`${import.meta.env.VITE_URL}/profile/update`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Profile updated ✅");
      navigate("/profile");
    } catch (err) {
      console.error(err);
      alert("Error updating profile");
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.card}>
        <h2>Edit Profile</h2>

        {/* PREVIEW */}
        {preview && <img src={preview} className={styles.preview} />}

        {/* NAME */}
        <input {...register("name")} placeholder="Enter name" />
        {errors.name && <p>{errors.name.message}</p>}

        {/* IMAGE */}
        <input
          type="file"
          accept="image/*"
          {...register("image")}
          onChange={(e) => {
            if (e.target.files[0]) {
              setPreview(URL.createObjectURL(e.target.files[0]));
            }
          }}
        />
        {errors.image && <p>{errors.image.message}</p>}

        {/* PASSWORD */}
        <input
          type="password"
          {...register("password")}
          placeholder="New password"
        />
        {errors.password && <p>{errors.password.message}</p>}

        {/* CONFIRM */}
        <input
          type="password"
          {...register("confirmPassword")}
          placeholder="Confirm password"
        />
        {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}

        <button type="submit">Update Profile</button>
      </form>
    </div>
  );
}

export default Edit_profile;
