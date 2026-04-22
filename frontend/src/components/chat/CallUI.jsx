import React, { useEffect, useRef, useState } from "react";

function CallUI({ localStream, peer }) {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // 🎥 Attach LOCAL stream
  useEffect(() => {
    if (localStream?.current && localVideo.current) {
      localVideo.current.srcObject = localStream.current;
    }
  }, [localStream?.current]);

  // 🎥 Listen for REMOTE stream
  useEffect(() => {
    const currentPeer = peer?.current;
    if (!currentPeer) return;

    const handleTrack = (event) => {
      console.log("Remote stream received");
      setRemoteStream(event.streams[0]);
    };

    currentPeer.addEventListener("track", handleTrack);

    return () => {
      currentPeer.removeEventListener("track", handleTrack);
    };
  }, [peer]);

  // 🎥 Attach REMOTE stream to video
  useEffect(() => {
    if (remoteStream && remoteVideo.current) {
      remoteVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // 🚫 render nothing if no streams
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
      {/* 🔵 Remote Video */}
      <video
        ref={remoteVideo}
        autoPlay
        playsInline
        style={{
          width: "100%",
          maxHeight: "300px",
          objectFit: "cover",
        }}
      />

      {/* 🟢 Local Video */}
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