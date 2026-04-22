import React, { useEffect, useRef } from "react";

function CallUI({
  localStream,
  remoteStream,
  callActive,
  incomingCall,
  acceptCall,
  endCall,
}) {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  useEffect(() => {
    if (localStream?.current && localVideo.current) {
      localVideo.current.srcObject = localStream.current;
    }
  }, [localStream?.current]);

  useEffect(() => {
    if (remoteStream && remoteVideo.current) {
      remoteVideo.current.srcObject = remoteStream;

      remoteVideo.current.muted = false;
      remoteVideo.current.volume = 1;

      remoteVideo.current.play().catch(() => {});
    }
  }, [remoteStream]);

  /* 🔴 Incoming Call UI */
  if (incomingCall && !callActive) {
    return (
      <div style={overlay}>
        <h2>Incoming Call 📞</h2>
        <button onClick={acceptCall}>Accept</button>
        <button onClick={endCall}>Reject</button>
      </div>
    );
  }

  if (!callActive) return null;

  return (
    <div style={overlay}>
      {/* Remote */}
      <video ref={remoteVideo} autoPlay playsInline style={remoteStyle} />

      {/* Local */}
      <video ref={localVideo} autoPlay muted playsInline style={localStyle} />

      {/* Controls */}
      <div style={controls}>
        <button onClick={endCall} style={{ background: "red" }}>
          End
        </button>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "black",
  zIndex: 999,
};

const remoteStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const localStyle = {
  position: "absolute",
  bottom: 20,
  right: 20,
  width: "120px",
  borderRadius: "10px",
};

const controls = {
  position: "absolute",
  bottom: 40,
  width: "100%",
  display: "flex",
  justifyContent: "center",
};

export default CallUI;