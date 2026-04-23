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
     ✅ CREATE PEER
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
          urls: "turn:global.relay.metered.ca:443",
          username: "06233b956b58f15417080948",
          credential: "SNcVJO2SbmlqNjHz",
        },
      ],
    });

    /* 🔥 TRACK (VERY IMPORTANT FIX) */
    pc.ontrack = (event) => {
      console.log("TRACK RECEIVED:", event);

      let stream;

      if (event.streams && event.streams[0]) {
        stream = event.streams[0];
      } else {
        // fallback for some browsers
        stream = new MediaStream();
        stream.addTrack(event.track);
      }

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
    try {
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
    } catch (err) {
      console.error("Start call error:", err);
    }
  };

  /* =========================
     🔹 ACCEPT CALL
  ========================= */
  const acceptCall = async () => {
    try {
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

      // ✅ APPLY ICE AFTER REMOTE DESC
      for (let c of pendingCandidates.current) {
        await peer.current.addIceCandidate(c);
      }
      pendingCandidates.current = [];

      const answer = await peer.current.createAnswer();
      await peer.current.setLocalDescription(answer);

      socket.emit("answer-call", { answer, roomId });

      setIncomingCall(null);
      setCallActive(true);
    } catch (err) {
      console.error("Accept error:", err);
    }
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

    const senders = peer.current.getSenders();

    const videoTrack = newStream.getVideoTracks()[0];
    const audioTrack = newStream.getAudioTracks()[0];

    senders.forEach((sender) => {
      if (sender.track?.kind === "video" && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
      if (sender.track?.kind === "audio" && audioTrack) {
        sender.replaceTrack(audioTrack);
      }
    });

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

      // ✅ APPLY ICE AFTER ANSWER
      for (let c of pendingCandidates.current) {
        await peer.current.addIceCandidate(c);
      }
      pendingCandidates.current = [];
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (peer.current && peer.current.remoteDescription) {
        try {
          await peer.current.addIceCandidate(candidate);
        } catch (err) {
          console.error("ICE error:", err);
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