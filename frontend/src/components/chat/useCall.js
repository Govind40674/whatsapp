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
      console.log("📡 Remote track received");

      if (e.streams && e.streams[0]) {
        setRemoteStream(e.streams[0]);
      } else {
        setRemoteStream(new MediaStream([e.track]));
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          candidate: e.candidate,
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
    try {
      cleanUp();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });

      localStream.current = stream;
      peer.current = createPeer();

      stream.getTracks().forEach((track) => {
        peer.current.addTrack(track, stream);
      });

      await new Promise((r) => setTimeout(r, 300)); // 🔥 important

      const offer = await peer.current.createOffer();
      await peer.current.setLocalDescription(offer);

      socket.emit("call-user", { offer, roomId, type });

      setCallActive(true);
      localStorage.setItem("activeCall", roomId);
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================
     ACCEPT CALL (SAFE)
  ========================= */
  const acceptCall = async (data) => {
    try {
      if (callActive) return; // 🔥 prevent double accept

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
    } catch (err) {
      console.error(err);
    }
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
     AUTO REJOIN
  ========================= */
  useEffect(() => {
    const saved = localStorage.getItem("activeCall");

    if (saved === roomId) {
      console.log("🔁 Rejoining call...");
      socket.emit("rejoin-call", { roomId });
    }
  }, [roomId]);

  /* =========================
     SOCKET EVENTS (FINAL FIX)
  ========================= */
  useEffect(() => {
    socket.on("incoming-call", async (data) => {
      const saved = localStorage.getItem("activeCall");

      // 🔥 AUTO ACCEPT AFTER REFRESH
      if (saved === roomId) {
        console.log("♻️ Auto accepting reconnect call");
        await acceptCall(data);
      } else {
        // 🆕 normal call
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

    socket.on("user-rejoined", async () => {
      console.log("♻️ Recreating offer");

      if (!peer.current) return;

      const offer = await peer.current.createOffer();
      await peer.current.setLocalDescription(offer);

      socket.emit("call-user", {
        offer,
        roomId,
        type: "video",
      });
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