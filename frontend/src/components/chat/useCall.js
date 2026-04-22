import { useRef, useEffect } from "react";
import { socket } from "./socket";

export default function useCall(roomId) {
  const peer = useRef(null);
  const localStream = useRef(null);
  const pendingCandidates = useRef([]);

  /* =========================
     🔹 START CALL
  ========================= */
  const startCall = async (type = "video") => {
    try {
      // stop old stream
      if (localStream.current) {
        localStream.current.getTracks().forEach((t) => t.stop());
      }

      // get media
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });

      peer.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // 🔥 ADD TRACKS
      localStream.current.getTracks().forEach((track) => {
        peer.current.addTrack(track, localStream.current);
      });

      // 🔥 ICE SEND
      peer.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            roomId,
          });
        }
      };

      // 🔥 APPLY pending ICE
      for (let c of pendingCandidates.current) {
        await peer.current.addIceCandidate(c);
      }
      pendingCandidates.current = [];

      // OFFER
      const offer = await peer.current.createOffer();
      await peer.current.setLocalDescription(offer);

      socket.emit("call-user", { offer, roomId });

    } catch (err) {
      console.error("Call start error:", err);
    }
  };

  /* =========================
     🔹 RECEIVE CALL
  ========================= */
  useEffect(() => {
    const handleIncoming = async ({ offer }) => {
      const accept = window.confirm("Incoming Call 📞");
      if (!accept) return;

      try {
        if (localStream.current) {
          localStream.current.getTracks().forEach((t) => t.stop());
        }

        localStream.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        peer.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

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
        for (let c of pendingCandidates.current) {
          await peer.current.addIceCandidate(c);
        }
        pendingCandidates.current = [];

        const answer = await peer.current.createAnswer();
        await peer.current.setLocalDescription(answer);

        socket.emit("answer-call", { answer, roomId });

      } catch (err) {
        console.error("Incoming call error:", err);
      }
    };

    socket.on("incoming-call", handleIncoming);
    return () => socket.off("incoming-call", handleIncoming);
  }, [roomId]);

  /* =========================
     🔹 FINAL CONNECTION
  ========================= */
  useEffect(() => {
    const handleAccepted = async ({ answer }) => {
      if (!peer.current) return;
      await peer.current.setRemoteDescription(answer);
    };

    const handleICE = async ({ candidate }) => {
      if (peer.current) {
        try {
          await peer.current.addIceCandidate(candidate);
        } catch (err) {
          console.error("ICE error:", err);
        }
      } else {
        pendingCandidates.current.push(candidate);
      }
    };

    socket.on("call-accepted", handleAccepted);
    socket.on("ice-candidate", handleICE);

    return () => {
      socket.off("call-accepted", handleAccepted);
      socket.off("ice-candidate", handleICE);
    };
  }, []);

  return { startCall, localStream, peer };
}