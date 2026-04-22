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
     ✅ CREATE PEER (WITH YOUR TURN)
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
        {
          urls: "turn:global.relay.metered.ca:80?transport=tcp",
          username: "06233b956b58f15417080948",
          credential: "SNcVJO2SbmlqNjHz",
        },
        {
          urls: "turn:global.relay.metered.ca:443",
          username: "06233b956b58f15417080948",
          credential: "SNcVJO2SbmlqNjHz",
        },
        {
          urls: "turns:global.relay.metered.ca:443?transport=tcp",
          username: "06233b956b58f15417080948",
          credential: "SNcVJO2SbmlqNjHz",
        },
      ],
    });

    /* 🔥 TRACK (AUDIO FIX) */
    pc.ontrack = (event) => {
      const stream = event.streams[0];

      // ensure audio enabled
      stream.getAudioTracks().forEach((t) => (t.enabled = true));

      setRemoteStream(stream);
    };

    /* 🔥 ICE SEND */
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
     🔹 START CALL
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

    socket.emit("call-user", { offer, roomId });

    setCallActive(true);
  };

  /* =========================
     🔹 ACCEPT CALL
  ========================= */
  const acceptCall = async () => {
    const offer = incomingCall;

    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    peer.current = createPeer();

    localStream.current.getTracks().forEach((track) => {
      peer.current.addTrack(track, localStream.current);
    });

    await peer.current.setRemoteDescription(offer);

    // ✅ APPLY pending ICE
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
     🔹 END CALL
  ========================= */
  const endCall = () => {
    localStream.current?.getTracks().forEach((t) => t.stop());

    if (peer.current) {
      peer.current.close();
      peer.current = null;
    }

    setRemoteStream(null);
    setCallActive(false);

    socket.emit("end-call", { roomId });
  };

  /* =========================
     🔹 SWITCH AUDIO / VIDEO
  ========================= */
  const switchMedia = async (type) => {
    if (!peer.current) return;

    const newStream = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });

    const videoTrack = newStream.getVideoTracks()[0];

    const sender = peer.current
      .getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender && videoTrack) {
      sender.replaceTrack(videoTrack);
    }

    localStream.current = newStream;
  };

  /* =========================
     🔹 SOCKET EVENTS
  ========================= */
  useEffect(() => {
    socket.on("incoming-call", ({ offer }) => {
      setIncomingCall(offer);
    });

    socket.on("call-accepted", async ({ answer }) => {
      await peer.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (peer.current) {
        try {
          await peer.current.addIceCandidate(candidate);
        } catch {
          pendingCandidates.current.push(candidate);
        }
      } else {
        pendingCandidates.current.push(candidate);
      }
    });

    socket.on("end-call", () => {
      endCall();
    });

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
    endCall,
    switchMedia,
    localStream,
    remoteStream,
    incomingCall,
    callActive,
  };
}