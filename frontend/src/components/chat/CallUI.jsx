import React, { useEffect, useRef } from "react";
import { MdCallEnd } from "react-icons/md";
import { IoVideocam, IoCall } from "react-icons/io5";

function CallUI({
  localStream,
  remoteStream,
 
  switchMedia,
   endCall,
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
    {/* 🔵 Remote Video */}
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

    {/* 🟢 Local Video */}
    <video
      ref={localVideo}
      autoPlay
      muted
      playsInline
      style={{
        position: "absolute",
        bottom: 90,
        right: 10,
        width: "120px",
        borderRadius: "10px",
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
        style={{ background: "red", color: "white" }}
      >
        End
      </button>
    </div>
  </div>
)
}

export default CallUI
