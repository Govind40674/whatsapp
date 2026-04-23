import React, { useEffect, useRef } from "react";

function CallUI({ localStream, remoteStream, switchMedia, endCall }) {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  useEffect(() => {
    if (localVideo.current && localStream?.current) {
      localVideo.current.srcObject = localStream.current;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideo.current && remoteStream) {
      remoteVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div style={styles.container}>
      {/* REMOTE VIDEO */}
      <video
        ref={remoteVideo}
        autoPlay
        playsInline
        style={styles.remoteVideo}
      />

      {/* LOCAL VIDEO */}
      <video
        ref={localVideo}
        autoPlay
        muted
        playsInline
        style={styles.localVideo}
      />

      {/* CONTROLS */}
      <div style={styles.controls}>
        <button onClick={() => switchMedia("audio")} style={styles.btn}>
          🎤
        </button>

        <button onClick={() => switchMedia("video")} style={styles.btn}>
          🎥
        </button>

        <button onClick={endCall} style={styles.endBtn}>
          ❌ End
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    inset: 0,
    backgroundColor: "#000",
    zIndex: 9999,
  },
  remoteVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  localVideo: {
    position: "absolute",
    bottom: "90px",
    right: "15px",
    width: "140px",
    height: "180px",
    borderRadius: "12px",
    border: "2px solid white",
    objectFit: "cover",
    backgroundColor: "#000",
  },
  controls: {
    position: "absolute",
    bottom: "20px",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    gap: "20px",
  },
  btn: {
    padding: "10px 15px",
    fontSize: "18px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
  },
  endBtn: {
    padding: "10px 18px",
    fontSize: "16px",
    borderRadius: "20px",
    border: "none",
    backgroundColor: "red",
    color: "white",
    cursor: "pointer",
  },
};

export default CallUI;