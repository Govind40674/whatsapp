import { useRef, useEffect, useState } from "react";
import { socket } from "./socket";

export default function useCall(roomId) {
  const peer = useRef(null);
  const localStream = useRef(null);
  const pendingCandidates = useRef([]);

  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callActive, setCallActive] = useState(false);

  /* =========================
     CREATE PEER
  ========================= */
  const createPeer = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { candidate: e.candidate, roomId });
      }
    };

    return pc;
  };

  /* =========================
     START CALL
  ========================= */
  const startCall = async (type = "video") => {
    await cleanUp();

    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });

    peer.current = createPeer();

    localStream.current.getTracks().forEach((track) => {
      peer.current.addTrack(track, localStream.current);
    });

    const offer = await peer.current.createOffer();
    await peer.current.setLocalDescription(offer);

    socket.emit("call-user", { offer, roomId, type });

    setCallActive(true);
  };

  /* =========================
     ACCEPT CALL
  ========================= */
  const acceptCall = async (data) => {
    const { offer, type } = data;

    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });

    peer.current = createPeer();

    localStream.current.getTracks().forEach((track) => {
      peer.current.addTrack(track, localStream.current);
    });

    await peer.current.setRemoteDescription(offer);

    // 🔥 IMPORTANT FIX
    for (let c of pendingCandidates.current) {
      await peer.current.addIceCandidate(c);
    }
    pendingCandidates.current = [];

    const answer = await peer.current.createAnswer();
    await peer.current.setLocalDescription(answer);

    socket.emit("answer-call", { answer, roomId });

    setIncomingCall(null);
    setCallActive(true);
  };

  /* =========================
     SWITCH MEDIA (FIXED)
  ========================= */
  const switchMedia = async (type) => {
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });

    const senders = peer.current.getSenders();

    newStream.getTracks().forEach((track) => {
      const sender = senders.find((s) => s.track?.kind === track.kind);

      if (sender) {
        sender.replaceTrack(track);
      } else {
        peer.current.addTrack(track, newStream);
      }
    });

    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = newStream;

    // 🔥 renegotiation fix
    const offer = await peer.current.createOffer();
    await peer.current.setLocalDescription(offer);

    socket.emit("renegotiate", { offer, roomId });
  };

  /* =========================
     CLEANUP (VERY IMPORTANT)
  ========================= */
  const cleanUp = async () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
      localStream.current = null;
    }

    if (peer.current) {
      peer.current.close();
      peer.current = null;
    }

    setRemoteStream(null);
    setCallActive(false);
    setIncomingCall(null);
    pendingCandidates.current = [];
  };

  const endCall = () => {
    cleanUp();
    socket.emit("end-call", { roomId });
  };

  /* =========================
     SOCKET EVENTS
  ========================= */
  useEffect(() => {
    socket.on("incoming-call", (data) => {
      setIncomingCall(data);
    });

    socket.on("call-accepted", async ({ answer }) => {
      await peer.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (peer.current?.remoteDescription) {
        await peer.current.addIceCandidate(candidate);
      } else {
        pendingCandidates.current.push(candidate);
      }
    });

    socket.on("renegotiate", async ({ offer }) => {
      await peer.current.setRemoteDescription(offer);

      const answer = await peer.current.createAnswer();
      await peer.current.setLocalDescription(answer);

      socket.emit("renegotiate-answer", { answer, roomId });
    });

    socket.on("renegotiate-answer", async ({ answer }) => {
      await peer.current.setRemoteDescription(answer);
    });

    socket.on("end-call", cleanUp);

    return () => {
      socket.off("incoming-call");
      socket.off("call-accepted");
      socket.off("ice-candidate");
      socket.off("renegotiate");
      socket.off("renegotiate-answer");
      socket.off("end-call");
    };
  }, []);

  return {
    startCall,
    acceptCall,
    switchMedia,
    endCall,
    localStream,
    remoteStream,
    incomingCall,
    callActive,
  };
}