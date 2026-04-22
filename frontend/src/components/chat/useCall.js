import { useRef, useEffect } from "react";
import { socket } from "./socket";

export default function useCall(roomId) {
  const peer = useRef(null);
  const localStream = useRef(null);
  const pendingCandidates = useRef([]); // 🔥 FIX

  /* =========================
     🔹 START CALL
  ========================= */
  const startCall = async (type = "video") => {
    // stop previous stream (important)
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
    }

    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });

    peer.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // 🔥 attach remote stream
    peer.current.ontrack = () => {
      console.log("Remote stream received");
    };

    localStream.current.getTracks().forEach((track) => {
      peer.current.addTrack(track, localStream.current);
    });

    // ICE send
    peer.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          roomId,
        });
      }
    };

    // 🔥 APPLY pending ICE
    pendingCandidates.current.forEach(async (c) => {
      await peer.current.addIceCandidate(c);
    });
    pendingCandidates.current = [];

    const offer = await peer.current.createOffer();
    await peer.current.setLocalDescription(offer);

    socket.emit("call-user", { offer, roomId });
  };

  /* =========================
     🔹 RECEIVE CALL
  ========================= */
  useEffect(() => {
    socket.on("incoming-call", async ({ offer }) => {
      const accept = window.confirm("Incoming Call 📞");
      if (!accept) return;

      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }

      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      peer.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // 🔥 attach remote stream
      peer.current.ontrack = () => {
        console.log("Remote stream received");
      };

      localStream.current.getTracks().forEach((track) => {
        peer.current.addTrack(track, localStream.current);
      });

      peer.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            roomId,
          });
        }
      };

      await peer.current.setRemoteDescription(offer);

      // 🔥 APPLY pending ICE
      pendingCandidates.current.forEach(async (c) => {
        await peer.current.addIceCandidate(c);
      });
      pendingCandidates.current = [];

      const answer = await peer.current.createAnswer();
      await peer.current.setLocalDescription(answer);

      socket.emit("answer-call", { answer, roomId });
    });

    return () => socket.off("incoming-call");
  }, [roomId]);

  /* =========================
     🔹 FINAL CONNECTION
  ========================= */
  useEffect(() => {
    socket.on("call-accepted", async ({ answer }) => {
      if (!peer.current) return;
      await peer.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (peer.current) {
        try {
          await peer.current.addIceCandidate(candidate);
        } catch (err) {
          console.error(err);
        }
      } else {
        // 🔥 store if peer not ready
        pendingCandidates.current.push(candidate);
      }
    });

    return () => {
      socket.off("call-accepted");
      socket.off("ice-candidate");
    };
  }, []);

  return { startCall, localStream, peer };
}