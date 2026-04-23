import React, { useEffect, useState, useRef } from "react";
import styles from "./MessageBox.module.css";
import { useParams } from "react-router-dom";
import { socket } from "./socket";
import axios from "axios";
import useCall from "./useCall";
import CallUI from "./CallUI";
import { IoVideocam, IoCall } from "react-icons/io5";
import { MdCallEnd } from "react-icons/md";

function MessageBox() {
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
     🔹 FETCH USER
  ========================= */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_URL}/user`, {
          params: { email: decodedEmail },
        });
        setChattingWith(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    if (decodedEmail) fetchUser();
  }, [decodedEmail]);

  /* =========================
     🔹 SOCKET ROOM
  ========================= */
  useEffect(() => {
    if (!myEmail || !decodedEmail) return;

    socket.emit("joinRoom", roomId);
    return () => socket.emit("leaveRoom", roomId);
  }, [roomId, myEmail, decodedEmail]);

  /* =========================
     🔹 FETCH MESSAGES
  ========================= */
  useEffect(() => {
    const fetchMessages = async () => {
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
    };

    fetchMessages();
  }, [decodedEmail, myEmail]);

  /* =========================
     🔹 RECEIVE MESSAGE
  ========================= */
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("receiveMessage");
  }, []);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={styles.container}>
      {/* ================= HEADER ================= */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {chattingWith.image ? (
            <img
              src={chattingWith.image}
              alt=""
              className={styles.profilePic}
            />
          ) : (
            <div className={styles.defaultAvatar}>
              {chattingWith.name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <div className={styles.headerCenter}>{chattingWith.name || "User"}</div>
        <div>
          {!callActive && (
            <>
              <button onClick={() => startCall("audio")}>
                <IoCall />
              </button>
              <button onClick={() => startCall("video")}>
                <IoVideocam />
              </button>
            </>
          )}

          {callActive && (
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

      {/* INCOMING */}
      {incomingCall && !callActive && (
        <div className={styles.popup}>
          <p>Incoming Call</p>
          <button onClick={acceptCall}>Accept</button>
          <button onClick={endCall}>Reject</button>
        </div>
      )}

      {/* CALL UI */}
      {callActive && (
        <CallUI
          localStream={localStream}
          remoteStream={remoteStream}
          endCall={endCall}
          switchMedia={switchMedia}
        />
      )}

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

      {/* ================= INPUT ================= */}
      <div className={styles.inputArea}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
      </div>
    </div>
  );
}

export default MessageBox;
