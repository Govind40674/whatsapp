import { useRef, useEffect, useState } from "react";
import { socket } from "./socket";

export default function useCall(roomId) {
  const peer = useRef(null);
  const localStream = useRef(null);
  const pendingCandidates = useRef([]);
  const isEnding = useRef(false);

  const [, forceUpdate] = useState(0);

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
      ],
    });

    // 🎥 REMOTE STREAM
    pc.ontrack = (event) => {
      const stream =
        event.streams?.[0] || new MediaStream([event.track]);

      setRemoteStream(stream);
    };

    // ❄️ ICE
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          roomId,
        });
      }
    };

    // 🔥 CONNECTION STATE (IMPORTANT FIX)
    pc.onconnectionstatechange = () => {
      console.log("STATE:", pc.connectionState);

      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        console.log("❌ Connection lost");

        socket.emit("peer-disconnected", { roomId });
        cleanUp();
      }
    };

    return pc;
  };

  /* =========================
     🔹 START CALL
  ========================= */
  const startCall = async (type = "video") => {
    try {
      cleanUp();

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
      localStorage.setItem("activeCall", roomId);
    } catch (err) {
      console.error("Start error:", err);
    }
  };

  /* =========================
     🔹 ACCEPT CALL
  ========================= */
  const acceptCall = async (offer) => {
    try {
      if (!offer) return;

      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      peer.current = createPeer();

      localStream.current.getTracks().forEach((track) => {
        peer.current.addTrack(track, localStream.current);
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
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  /* =========================
     🔹 CLEANUP
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
    localStorage.removeItem("reconnecting");
  };

  /* =========================
     🔹 END CALL
  ========================= */
  const endCall = () => {
    if (isEnding.current) return;

    isEnding.current = true;

    cleanUp();

    setTimeout(() => (isEnding.current = false), 500);

    socket.emit("end-call", { roomId });
  };

  /* =========================
     🔹 SWITCH MEDIA
  ========================= */
  const switchMedia = async (type) => {
    if (!peer.current) return;

    try {
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
      });

      localStream.current?.getTracks().forEach((t) => t.stop());
      localStream.current = newStream;

      forceUpdate((prev) => prev + 1);
    } catch (err) {
      console.error("Switch error:", err);
    }
  };

  /* =========================
     🔁 AUTO RECONNECT (AFTER REFRESH)
  ========================= */
  useEffect(() => {
    const savedRoom = localStorage.getItem("activeCall");

    if (savedRoom === roomId) {
      localStorage.setItem("reconnecting", "true");
      socket.emit("rejoin-call", { roomId });
    }
  }, [roomId]);

  /* =========================
     🔁 PEER DISCONNECT HANDLE
  ========================= */
  useEffect(() => {
    socket.on("peer-disconnected", async () => {
      console.log("🔄 Peer disconnected → restarting");

      const savedRoom = localStorage.getItem("activeCall");

      if (savedRoom === roomId) {
        await startCall("video");
      }
    });

    return () => socket.off("peer-disconnected");
  }, []);

  /* =========================
     🔹 SOCKET EVENTS
  ========================= */
  useEffect(() => {
    socket.on("incoming-call", async (data) => {
      if (!data?.offer) return;

      const isReconnect = localStorage.getItem("reconnecting");

      // 🔥 AUTO ACCEPT (NO POPUP)
      if (isReconnect === "true") {
        console.log("⚡ Auto reconnect accept");

        await acceptCall(data.offer);
        localStorage.removeItem("reconnecting");
        return;
      }

      // normal call
      setIncomingCall(data.offer);
    });

    socket.on("call-accepted", async (data) => {
      if (!data?.answer || !peer.current) return;

      await peer.current.setRemoteDescription(data.answer);

      for (let c of pendingCandidates.current) {
        await peer.current.addIceCandidate(c);
      }
      pendingCandidates.current = [];
    });

    socket.on("ice-candidate", async (data) => {
      if (!data?.candidate) return;

      if (peer.current?.remoteDescription) {
        await peer.current.addIceCandidate(data.candidate);
      } else {
        pendingCandidates.current.push(data.candidate);
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
    endCall,
    switchMedia,
    localStream,
    remoteStream,
    incomingCall,
    callActive,
  };
}