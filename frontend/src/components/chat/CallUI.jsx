import React, { useEffect, useRef } from "react";

function CallUI({ localStream, remoteStream, switchMedia, endCall, localStreamVersion }) {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  useEffect(() => {
    if (localVideo.current && localStream?.current) {
      localVideo.current.srcObject = localStream.current;
    }
  }, [localStreamVersion]); // 🔥 KEY FIX

  useEffect(() => {
    if (remoteVideo.current && remoteStream) {
      remoteVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div style={styles.container}>
      <video ref={remoteVideo} autoPlay playsInline style={styles.remoteVideo} />

      {/* 🔥 key forces re-render */}
      <video
        key={localStreamVersion}
        ref={localVideo}
        autoPlay
        muted
        playsInline
        style={styles.localVideo}
      />

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
    padding: "10px",
    borderRadius: "50%",
    cursor: "pointer",
  },
  endBtn: {
    backgroundColor: "red",
    color: "white",
    padding: "10px 20px",
    borderRadius: "20px",
    cursor: "pointer",
  },
};

export default CallUI;