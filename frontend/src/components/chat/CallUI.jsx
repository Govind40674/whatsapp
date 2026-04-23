import React, { useEffect, useRef } from "react";

function CallUI({ localStream, remoteStream, switchMedia, endCall }) {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  useEffect(() => {
    if (localVideo.current && localStream?.current) {
      localVideo.current.srcObject = localStream.current;
    }
  }, [localStream?.current]);

  useEffect(() => {
    if (remoteVideo.current && remoteStream) {
      remoteVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "black" }}>
      {/* REMOTE */}
      <video ref={remoteVideo} autoPlay playsInline style={{ width: "100%" }} />

      {/* LOCAL (ONLY IF VIDEO EXISTS) */}
      {localStream?.current?.getVideoTracks().length > 0 && (
        <video
          ref={localVideo}
          autoPlay
          muted
          playsInline
          style={{
            position: "absolute",
            bottom: 80,
            right: 10,
            width: "120px",
          }}
        />
      )}

      <div style={{ position: "absolute", bottom: 10, width: "100%" }}>
        <button onClick={() => switchMedia("audio")}>Audio</button>
        <button onClick={() => switchMedia("video")}>Video</button>
        <button onClick={endCall}>End</button>
      </div>
    </div>
  );
}

export default CallUI;