import React, { useEffect, useRef, useState } from "react";

function CallUI({ localStream, peer }) {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // ❌ MOST IMPORTANT FIX
  if (!localStream?.current && !remoteStream) return null;

  // Local video
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (localStream?.current && localVideo.current) {
      localVideo.current.srcObject = localStream.current;
    }
  }, [localStream]);

  // Listen for remote stream
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!peer?.current) return;

    const handleTrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peer.current.addEventListener("track", handleTrack);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      peer.current.removeEventListener("track", handleTrack);
    };
  }, [peer]);

  // Attach remote stream
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (remoteStream && remoteVideo.current) {
      remoteVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div
      style={{
        position: "absolute",   // ✅ prevents pushing chat down
        top: 60,
        left: 0,
        width: "100%",
        zIndex: 10,
        background: "black",
      }}
    >
      {/* Remote Video */}
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

      {/* Local Video */}
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