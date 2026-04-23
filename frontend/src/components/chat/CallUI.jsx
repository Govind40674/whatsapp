import React, { useEffect, useRef } from "react";
import { MdCallEnd } from "react-icons/md";
import { IoVideocam, IoCall } from "react-icons/io5";

function CallUI({
  localStream,
  remoteStream,
  endCall,
  switchMedia,
}) {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  /* LOCAL */
  useEffect(() => {
    if (localStream?.current && localVideo.current) {
      localVideo.current.srcObject = localStream.current;
    }
  }, [localStream]);

  /* REMOTE */
  useEffect(() => {
    if (remoteStream && remoteVideo.current) {
      remoteVideo.current.srcObject = remoteStream;

      remoteVideo.current.muted = false;
      remoteVideo.current.volume = 1;

      remoteVideo.current.play().catch(() => {});
    }
  }, [remoteStream]);

  if (!localStream?.current && !remoteStream) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "black",
        zIndex: 1000,
      }}
    >
      {/* 🔵 REMOTE VIDEO */}
      <video
        ref={remoteVideo}
        autoPlay
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* 🟢 LOCAL VIDEO */}
      <video
        ref={localVideo}
        autoPlay
        muted
        playsInline
        style={{
          position: "absolute",
          bottom: 100,
          right: 20,
          width: "120px",
          borderRadius: "10px",
          border: "2px solid white",
        }}
      />

      {/* 🔥 CONTROLS (VISIBLE) */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          zIndex: 2000, // 🔥 IMPORTANT
        }}
      >
        <button
          onClick={() => switchMedia("audio")}
          style={btnStyle}
        >
          <IoCall />
        </button>

        <button
          onClick={endCall}
          style={{ ...btnStyle, background: "red" }}
        >
          <MdCallEnd />
        </button>

        <button
          onClick={() => switchMedia("video")}
          style={btnStyle}
        >
          <IoVideocam />
        </button>
      </div>
    </div>
  );
}

const btnStyle = {
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  border: "none",
  fontSize: "22px",
  background: "#333",
  color: "white",
};

export default CallUI;