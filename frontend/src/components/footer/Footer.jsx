import React from "react";
import styles from "./Footer.module.css";
import { Link, useLocation } from "react-router-dom";
import { IoHome, IoPerson } from "react-icons/io5";

function Footer() {
  const location = useLocation();

  return (
    <div className={styles.footer}>
      <Link
        to="/"
        className={`${styles.link} ${
          location.pathname === "/" ? styles.active : ""
        }`}
      >
        <IoHome />
        <span>Home</span>
      </Link>

      <Link
        to="/profile"
        className={`${styles.link} ${
          location.pathname === "/profile" ? styles.active : ""
        }`}
      >
        <IoPerson />
        <span>Profile</span>
      </Link>
    </div>
  );
}

export default Footer;