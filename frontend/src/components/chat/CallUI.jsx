import React, { useEffect, useRef } from "react";

function CallUI({ localStream, remoteStream }) {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  // 🎥 Local stream
  useEffect(() => {
    if (localStream?.current && localVideo.current) {
      localVideo.current.srcObject = localStream.current;
    }
  }, [localStream?.current]);

  // 🎥 Remote stream
  useEffect(() => {
    if (remoteStream && remoteVideo.current) {
      remoteVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!localStream?.current && !remoteStream) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 0,
        width: "100%",
        zIndex: 10,
        background: "black",
      }}
    >
      {/* 🔵 Remote */}
      <video
        ref={remoteVideo}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          maxHeight: "300px",
          objectFit: "cover",
        }}
      />

      {/* 🟢 Local */}
      <video
        ref={localVideo}
        autoPlay
        muted
        playsInline
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          width: "120px",
          borderRadius: "10px",
        }}
      />
    </div>
  );
}

export default CallUI;