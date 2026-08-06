import { useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { useSocket } from "../hooks/useSocket";
import { usePeer } from "../hooks/usePeer";
import type { SocketCallbackResponse } from "../types/socket.type";

export default function RoomPage() {
  // Get roomId from URL params (/room/:roomId)
  const { roomId } = useParams();

  // Get email from React Router state passed from the Home page
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const { socket } = useSocket();
  const { createOffer, createAnswer, setRemoteAnswer } = usePeer();

  const handleNewUserJoined = useCallback(
    async ({ newUserEmail }: { newUserEmail: string }) => {
      console.log(`A new user joined: ${newUserEmail}`);
      const offer = await createOffer();
      socket?.emit("call-user", { newUserEmail, offer });
    },
    [createOffer, socket],
  );

  const handleIncommingCall = useCallback(
    async ({
      offer,
      fromUserEmail,
    }: {
      offer: RTCSessionDescriptionInit;
      fromUserEmail: string;
    }) => {
      console.log(`Incoming call from ${fromUserEmail}`);
      const answer = await createAnswer(offer);
      socket?.emit("call-accepted", { emailId: fromUserEmail, answer });
    },
    [createAnswer, socket],
  );

  const handleCallAccepted = useCallback(
    async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      console.log("Call accepted! Setting remote answer...");
      await setRemoteAnswer(answer);
    },
    [setRemoteAnswer],
  );

  useEffect(() => {
    if (!socket) return;

    // If the user lands here directly without an email, kick them back to home
    if (!email || !roomId) {
      console.warn("Missing email or roomId, redirecting to home...");
      navigate("/");
      return;
    }

    // 1. Attach listeners FIRST so no events are dropped
    socket.on("user-joined", handleNewUserJoined);
    socket.on("incomming-call", handleIncommingCall);
    socket.on("call-accepted", handleCallAccepted);

    // 2. NOW emit join-room
    socket.emit(
      "join-room",
      { roomId, email },
      (response: SocketCallbackResponse) => {
        if (response.success) {
          console.log("Successfully joined the room on the server!");
        }
      },
    );

    // Cleanup listeners when component unmounts
    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incomming-call", handleIncommingCall);
      socket.off("call-accepted", handleCallAccepted);
    };
  }, [
    socket,
    email,
    roomId,
    navigate,
    handleNewUserJoined,
    handleIncommingCall,
    handleCallAccepted,
  ]);

  return (
    <div>
      <h1>Room Page: {roomId}</h1>
      <p>Logged in as: {email}</p>
    </div>
  );
}
