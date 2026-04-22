import React, { useEffect, useRef } from "react";

function CallUI({ localStream, remoteStream }) {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  // 🎥 Attach LOCAL stream
  useEffect(() => {
    if (localStream?.current && localVideo.current) {
      localVideo.current.srcObject = localStream.current;

      // Debug
      console.log("LOCAL AUDIO:", localStream.current.getAudioTracks());
    }
  }, [localStream?.current]);

  // 🎥 Attach REMOTE stream (IMPORTANT FOR AUDIO)
  useEffect(() => {
    if (remoteStream && remoteVideo.current) {
      remoteVideo.current.srcObject = remoteStream;

      // 🔥 FORCE AUDIO PLAY
      remoteVideo.current.muted = false;
      remoteVideo.current.volume = 1;

      remoteVideo.current
        .play()
        .then(() => console.log("Audio playing"))
        .catch((err) => console.log("Autoplay blocked:", err));

      // Debug
      console.log("REMOTE AUDIO:", remoteStream.getAudioTracks());
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
      {/* 🔵 Remote Video (NOT MUTED) */}
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

      {/* 🟢 Local Video (MUTED) */}
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