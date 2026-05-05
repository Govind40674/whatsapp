import React, { useEffect } from "react";
import styles from "./Member.module.css";
import useFetchMembers from "./useFetchMembers";
import { useNavigate } from "react-router-dom";
import {useContext} from "react";
import { MyContext } from "../create_context/MyContext";




function Member() {
  // const myemail = localStorage.getItem("email");
  const {onlineusers} = useContext(MyContext);
  const { member, fetchMember } = useFetchMembers();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);


  const handleClick = (email) => {
    navigate(`/chat/${email}`);
  };
 

  return (
    <div className={styles.member}>
      {/* 🔥 Show if no members */}
      {member.length === 0 ? (
        <div className={styles.noFriend}>No friends found 😔</div>
      ) : (
        member.map((m) => (
          <div
            key={m.email}
            className={styles.memberCard}
            onClick={() => handleClick(m.email)}
          >
            <div className={styles.left}>
              <img src={m.image} alt={m.email} className={styles.profilePic} />
            </div>

            <div className={styles.right}>
              <div className={styles.name}>{m.name}</div>
            </div>
            <div className={styles.dot}>
              {onlineusers.includes(m.email) && <div className={styles.dotOnline}></div>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Member;
