import styles from "./Header.module.css";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEllipsisV } from "react-icons/fa";
import { socket } from "../chat/socket"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);

  const ownemail = localStorage.getItem("email");
  const navigate = useNavigate();

  // Toggle menu
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    socket.emit("user_offline", ownemail);

    window.location.reload();
  };

  // 🔥 API CALL
  const fetchUsers = async () => {
    if (search.trim() === "") {
      setUsers([]);
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_URL}/users/search`,
        { email: search, ownemail },
        { withCredentials: true }
      );

      setUsers(res.data.data || []);
    } catch (err) {
      console.log(err.response?.data?.message);
      setUsers([]);
    }
  };

  // Handle typing
  const handleChange = (e) => {
    setSearch(e.target.value);
  };

  // Enter key search
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      fetchUsers();
    }
  };

  // Navigate on click
  const handleUserClick = (email) => {
    navigate(`/chat/${encodeURIComponent(email)}`);
    setSearch("");
    setUsers([]);
  };

  return (
    <>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.logo}>WhatsApp</div>

        <div className={styles.menuContainer}>
          <FaEllipsisV className={styles.icon} onClick={toggleMenu} />

          {menuOpen && (
            <div className={styles.dropdown}>
              <Link to="/profile" className={styles.link}>
                Profile
              </Link>

              <Link to="/friend-request-list" className={styles.link}>
                Friend Requests
              </Link>

              <Link to="/logout" onClick={handleLogout} className={styles.link}>
                Logout
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={styles.searchInput}
        />
      </div>

      {/* SEARCH RESULTS */}
      <div className={styles.results}>
        {users.length > 0 ? (
          users.map((user, i) => (
            <div
              key={user._id || i}
              className={styles.userCard}
              onClick={() => handleUserClick(user.email)}
            >
              {/* Profile Image */}
              <img
                src={
                  user.image ||
                  "https://ui-avatars.com/api/?name=User&background=random"
                }
                alt="profile"
                className={styles.avatar}
              />

              {/* User Info */}
              <div className={styles.userInfo}>
                <div className={styles.name}>{user.name}</div>
                <div className={styles.email}>{user.email}</div>
              </div>
            </div>
          ))
        ) : (
          search && <div className={styles.noResult}>No users found</div>
        )}
      </div>
    </>
  );
}
