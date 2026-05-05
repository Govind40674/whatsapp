import React, { useEffect, useState, useRef } from "react";
import styles from "./MessageBox.module.css";
import { useParams } from "react-router-dom";
import { socket } from "./socket";
import axios from "axios";
import useCall from "./useCall";
import CallUI from "./CallUI";
import { IoVideocam, IoCall } from "react-icons/io5";
import { MdCallEnd } from "react-icons/md";
import { useContext } from "react";
import { MyContext } from "../create_context/MyContext";

function MessageBox() {
  const { onlineusers } = useContext(MyContext);
  const { email } = useParams();
  const decodedEmail = decodeURIComponent(email || "");

  const [chattingWith, setChattingWith] = useState({});
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const myEmail = localStorage.getItem("email")?.toLowerCase().trim();
  const bottomRef = useRef(null);

  const roomId = [myEmail, decodedEmail].sort().join("_");

  const {
    startCall,
    acceptCall,
    endCall,
    switchMedia,
    localStream,
    remoteStream,
    incomingCall,
    callActive,
  } = useCall(roomId);

  /* =========================
     🚫 PREVENT SELF CHAT
  ========================= */
  useEffect(() => {
    if (myEmail === decodedEmail) {
      console.warn("Cannot chat with yourself");
    }
  }, [myEmail, decodedEmail]);

  /* =========================
     👤 FETCH USER
  ========================= */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_URL}/user`, {
          params: { email: decodedEmail },
        });
        setChattingWith(res.data);
      } catch (err) {
        console.error("User fetch error:", err);
      }
    };

    if (decodedEmail) fetchUser();
  }, [decodedEmail]);

  /* =========================
     🔌 SOCKET ROOM JOIN
  ========================= */
  useEffect(() => {
    if (!myEmail || !decodedEmail) return;

    socket.emit("joinRoom", roomId);

    return () => {
      socket.emit("leaveRoom", roomId);
    };
  }, [roomId, myEmail, decodedEmail]);

  /* =========================
     💬 FETCH OLD MESSAGES
  ========================= */
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_URL}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: myEmail,
            receiver: decodedEmail,
          }),
        });

        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Message fetch error:", err);
      }
    };

    fetchMessages();
  }, [decodedEmail, myEmail]);

  /* =========================
     🔁 RECEIVE MESSAGE (FIXED)
  ========================= */
  useEffect(() => {
    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receiveMessage", handleMessage);

    return () => {
      socket.off("receiveMessage", handleMessage);
    };
  }, [roomId]);

  /* =========================
     📤 SEND MESSAGE
  ========================= */
  const sendMessage = () => {
    if (!input.trim()) return;

    socket.emit("sendMessage", {
      sender: myEmail,
      receiver: decodedEmail,
      content: input,
      roomId,
    });

    setInput("");
  };

  /* =========================
     🔽 AUTO SCROLL
  ========================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={styles.container}>
      {/* =========================
          📞 CALL UI (TOP LAYER)
      ========================= */}
      {callActive && (
        <CallUI
          localStream={localStream}
          remoteStream={remoteStream}
          switchMedia={switchMedia}
          endCall={endCall}
        />
      )}

      {/* =========================
          HEADER
      ========================= */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {chattingWith.image ? (
            <img src={chattingWith.image} className={styles.profilePic} />
          ) : (
            <div className={styles.defaultAvatar}>
              {chattingWith.name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* <div className={styles.headerCenter}>{chattingWith.name || "User"}</div> */}

        <div className={styles.headerCenterWrapper}>
          <div className={styles.headerCenter}>
            {chattingWith.name || "User"}
          </div>

          <div className={styles.statusWrapper}>
            {onlineusers.includes(decodedEmail) ? (
              <span className={styles.onlineStatus}>Online</span>
            ) : (
              <span className={styles.offlineStatus}>Offline</span>
            )}
          </div>
        </div>

        <div className={styles.headerRight}>
          {!callActive ? (
            <>
              <button onClick={() => startCall("audio")}>
                <IoCall />
              </button>
              <button onClick={() => startCall("video")}>
                <IoVideocam />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => switchMedia("audio")}>Audio</button>
              <button onClick={() => switchMedia("video")}>Video</button>
              <button onClick={endCall}>
                <MdCallEnd color="red" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* =========================
          📲 INCOMING CALL
      ========================= */}
      {incomingCall && !callActive && (
        <div className={styles.callOverlay}>
          <div className={styles.callCard}>
            <div className={styles.avatarWrapper}>
              {chattingWith.image ? (
                <img src={chattingWith.image} className={styles.avatar} />
              ) : (
                <div className={styles.avatarFallback}>
                  {chattingWith.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            <h2 className={styles.callerName}>
              {chattingWith.name || "Incoming Call"}
            </h2>

            <p className={styles.callText}>Incoming call...</p>

            <div className={styles.callButtons}>
              <button onClick={endCall} className={styles.rejectBtn}>
                ❌
              </button>

              <button
                onClick={() => acceptCall(incomingCall)}
                className={styles.acceptBtn}
              >
                📞
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          💬 CHAT AREA (HIDDEN DURING CALL)
      ========================= */}
      {!callActive && (
        <div className={styles.chatArea}>
          {messages.map((msg, i) => {
            const isMe = msg.sender === myEmail;
            return (
              <div key={i} className={isMe ? styles.sent : styles.received}>
                {msg.content}
              </div>
            );
          })}
          <div ref={bottomRef}></div>
        </div>
      )}

      {/* =========================
          ✍️ INPUT (HIDDEN DURING CALL)
      ========================= */}
      {!callActive && (
        <div className={styles.inputArea}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage} className={styles.sendBtn}>
            ➤
          </button>
        </div>
      )}
    </div>
  );
}

export default MessageBox;
