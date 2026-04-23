import React, { useEffect, useRef } from "react";

function CallUI({
  localStream,
  remoteStream,
  switchMedia,
  endCall,
}) {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  /* =========================
     🔥 LOCAL STREAM FIX
  ========================= */
  useEffect(() => {
    if (localVideo.current && localStream?.current) {
      console.log("🎥 Updating LOCAL video");

      localVideo.current.srcObject = null; // reset
      localVideo.current.srcObject = localStream.current;

      localVideo.current.play().catch(() => {});
    }
  }, [localStream?.current]); // 🔥 KEY FIX

  /* =========================
     🔥 REMOTE STREAM
  ========================= */
  useEffect(() => {
    if (remoteVideo.current && remoteStream) {
      console.log("📡 Updating REMOTE video");

      remoteVideo.current.srcObject = null;
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
          bottom: 90,
          right: 10,
          width: "130px",
          borderRadius: "10px",
          background: "black",
          zIndex: 1001,
        }}
      />

      {/* 🔴 CONTROL BAR */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          zIndex: 1002,
        }}
      >
        <button onClick={() => switchMedia("audio")}>Audio</button>
        <button onClick={() => switchMedia("video")}>Video</button>
        <button
          onClick={endCall}
          style={{
            background: "red",
            color: "white",
            padding: "10px 15px",
            borderRadius: "8px",
          }}
        >
          End
        </button>
      </div>
    </div>
  );
}

export default CallUI;