import { useRef, useEffect, useState } from "react";
import { socket } from "./socket";

export default function useCall(roomId) {
  const peer = useRef(null);
  const localStream = useRef(null);
  const pendingCandidates = useRef([]);

  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callActive, setCallActive] = useState(false);

  // 🔥 IMPORTANT (forces UI update)
  const [localStreamVersion, setLocalStreamVersion] = useState(0);

  /* =========================
     CREATE PEER
  ========================= */
  const createPeer = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        setRemoteStream(e.streams[0]);
      } else {
        setRemoteStream(new MediaStream([e.track]));
      }
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
    cleanUp();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });

    localStream.current = stream;
    setLocalStreamVersion((v) => v + 1); // 🔥 trigger UI

    peer.current = createPeer();

    stream.getTracks().forEach((track) => {
      peer.current.addTrack(track, stream);
    });

    await new Promise((r) => setTimeout(r, 300));

    const offer = await peer.current.createOffer();
    await peer.current.setLocalDescription(offer);

    socket.emit("call-user", { offer, roomId, type });

    setCallActive(true);
    localStorage.setItem("activeCall", roomId);
  };

  /* =========================
     ACCEPT CALL
  ========================= */
  const acceptCall = async (data) => {
    if (callActive) return;

    const { offer, type } = data;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });

    localStream.current = stream;
    setLocalStreamVersion((v) => v + 1); // 🔥 trigger UI

    peer.current = createPeer();

    stream.getTracks().forEach((track) => {
      peer.current.addTrack(track, stream);
    });

    await peer.current.setRemoteDescription(offer);

    for (let c of pendingCandidates.current) {
      await peer.current.addIceCandidate(c);
    }
    pendingCandidates.current = [];

    const answer = await peer.current.createAnswer();
    await peer.current.setLocalDescription(answer);

    socket.emit("answer-call", { answer, roomId });

    setIncomingCall(null);
    setCallActive(true);

    localStorage.setItem("activeCall", roomId);
  };

  /* =========================
     🔥 SWITCH MEDIA (FINAL FIX)
  ========================= */
  const switchMedia = async (type) => {
    if (!peer.current) return;

    const newStream = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });

    const senders = peer.current.getSenders();

    newStream.getTracks().forEach((track) => {
      const sender = senders.find(
        (s) => s.track && s.track.kind === track.kind
      );

      if (sender) sender.replaceTrack(track);
      else peer.current.addTrack(track, newStream);
    });

    // 🔥 STOP OLD STREAM
    localStream.current?.getTracks().forEach((t) => t.stop());

    // 🔥 UPDATE STREAM
    localStream.current = newStream;

    // 🔥 FORCE UI UPDATE
    setLocalStreamVersion((v) => v + 1);
  };

  /* =========================
     CLEANUP
  ========================= */
  const cleanUp = () => {
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;

    peer.current?.close();
    peer.current = null;

    setRemoteStream(null);
    setCallActive(false);
    setIncomingCall(null);
    pendingCandidates.current = [];

    localStorage.removeItem("activeCall");
  };

  const endCall = () => {
    cleanUp();
    socket.emit("end-call", { roomId });
  };

  /* =========================
     SOCKET EVENTS
  ========================= */
  useEffect(() => {
    socket.on("incoming-call", async (data) => {
      const saved = localStorage.getItem("activeCall");

      if (saved === roomId) {
        await acceptCall(data);
      } else {
        setIncomingCall(data);
      }
    });

    socket.on("call-accepted", async ({ answer }) => {
      if (!peer.current) return;
      await peer.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (!peer.current) return;

      if (peer.current.remoteDescription) {
        await peer.current.addIceCandidate(candidate);
      } else {
        pendingCandidates.current.push(candidate);
      }
    });

    socket.on("end-call", cleanUp);

    return () => {
      socket.off("incoming-call");
      socket.off("call-accepted");
      socket.off("ice-candidate");
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
    localStreamVersion, // 🔥 important
  };
}