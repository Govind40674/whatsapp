import React from "react";
import styles from "./Search_icon.module.css";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Search_icon() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/friend-request"); // 👈 your route
  };

  return (
    <div className={styles.fab} onClick={handleClick}>
      <FaSearch className={styles.icon} />
    </div>
  );
}

export default Search_icon;