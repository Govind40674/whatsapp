import { useRef, useEffect, useState } from "react";
import { socket } from "./socket";

export default function useCall(roomId) {
  const peer = useRef(null);
  const localStream = useRef(null);
  const pendingCandidates = useRef([]);

  const [, forceUpdate] = useState(0);

  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callActive, setCallActive] = useState(false);

  /* =========================
     CREATE PEER
  ========================= */
  const createPeer = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.relay.metered.ca:80" },
        {
          urls: "turn:global.relay.metered.ca:80",
          username: "06233b956b58f15417080948",
          credential: "SNcVJO2SbmlqNjHz",
        },
      ],
    });

    pc.ontrack = (event) => {
      const stream =
        event.streams?.[0] || new MediaStream([event.track]);
      setRemoteStream(stream);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          roomId,
        });
      }
    };

    return pc;
  };

  /* =========================
     START CALL
  ========================= */
  const startCall = async (type = "video") => {
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

      if (sender) {
        sender.replaceTrack(track);
      } else {
        peer.current.addTrack(track, newStream);
      }
    });

    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = newStream;

    forceUpdate((p) => p + 1);

    // 🔥 RENEGOTIATION
    const offer = await peer.current.createOffer();
    await peer.current.setLocalDescription(offer);

    socket.emit("renegotiate", { offer, roomId });
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

    // 🔥 HANDLE RENEGOTIATION
    socket.on("renegotiate", async ({ offer }) => {
      await peer.current.setRemoteDescription(offer);

      const answer = await peer.current.createAnswer();
      await peer.current.setLocalDescription(answer);

      socket.emit("renegotiate-answer", { answer, roomId });
    });

    socket.on("renegotiate-answer", async ({ answer }) => {
      await peer.current.setRemoteDescription(answer);
    });

    socket.on("end-call", () => {
      peer.current?.close();
      peer.current = null;
      setCallActive(false);
      setRemoteStream(null);
    });

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
    endCall: () => socket.emit("end-call", { roomId }),
    localStream,
    remoteStream,
    incomingCall,
    callActive,
  };
}