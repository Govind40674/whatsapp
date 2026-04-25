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
      if (e.streams && e.streams[0]) {
        console.log("📡 Remote stream received");
        setRemoteStream(e.streams[0]);
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
    await cleanUp();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });

    localStream.current = stream;
    peer.current = createPeer();

    stream.getTracks().forEach((track) => {
      peer.current.addTrack(track, stream);
    });

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
    const { offer, type } = data;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });

    localStream.current = stream;
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
     🔥 AUTO RECONNECT (FIXED)
  ========================= */
  useEffect(() => {
    const savedRoom = localStorage.getItem("activeCall");

    if (savedRoom === roomId) {
      console.log("🔁 Rejoining call...");
      socket.emit("rejoin-call", { roomId });
    }
  }, [roomId]);

  /* =========================
     SOCKET EVENTS
  ========================= */
  useEffect(() => {
    socket.on("incoming-call", (data) => {
      setIncomingCall(data);
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

    /* 🔥 KEY FIX */
    socket.on("user-rejoined", async () => {
      console.log("♻️ Other user refreshed → re-offer");

      if (!peer.current) return;

      const offer = await peer.current.createOffer();
      await peer.current.setLocalDescription(offer);

      socket.emit("call-user", { offer, roomId, type: "video" });
    });

    socket.on("end-call", cleanUp);

    return () => {
      socket.off("incoming-call");
      socket.off("call-accepted");
      socket.off("ice-candidate");
      socket.off("user-rejoined");
      socket.off("end-call");
    };
  }, []);

  return {
    startCall,
    acceptCall,
    endCall,
    localStream,
    remoteStream,
    incomingCall,
    callActive,
  };
}