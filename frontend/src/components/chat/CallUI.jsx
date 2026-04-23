import React, { useEffect, useRef } from "react";

function CallUI({ localStream, remoteStream }) {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  /* ================= LOCAL ================= */
  useEffect(() => {
    if (localStream?.current && localVideo.current) {
      localVideo.current.srcObject = localStream.current;

      localVideo.current
        .play()
        .catch((e) => console.log("Local play blocked:", e));
    }
  }, [localStream]);

  /* ================= REMOTE ================= */
  useEffect(() => {
    if (remoteStream && remoteVideo.current) {
      console.log("ATTACHING REMOTE STREAM:", remoteStream);

      remoteVideo.current.srcObject = remoteStream;

      remoteVideo.current.muted = false;
      remoteVideo.current.volume = 1;

      setTimeout(() => {
        remoteVideo.current
          .play()
          .then(() => console.log("REMOTE PLAYING"))
          .catch((err) => console.log("Autoplay blocked:", err));
      }, 300);
    }
  }, [remoteStream]);

  if (!localStream?.current && !remoteStream) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "black",
        zIndex: 9999,
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
          background: "black",
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
          bottom: 20,
          right: 20,
          width: "140px",
          height: "180px",
          borderRadius: "12px",
          objectFit: "cover",
          border: "2px solid white",
        }}
      />
    </div>
  );
}

export default CallUI;