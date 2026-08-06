import { useEffect } from "react";
import { useSocket } from "../hooks/useSocket";
import { usePeer } from "../hooks/usePeer";

export default function RoomPage() {
  const { socket } = useSocket();
  const { createOffer, createAnswer, setRemoteAnswer } = usePeer();

  async function handleNewUserJoined(newUserEmail: string) {
    console.log(`A new User ${newUserEmail} joined in room`);
    // create an offer
    const offer = await createOffer();

    // send an offer to the new joined user
    socket.emit("call-user", { newUserEmail, offer });
  }

  async function handleIncommingCall({
    offer,
    fromUserEmail,
  }: {
    offer: RTCSessionDescriptionInit;
    fromUserEmail: string;
  }) {
    console.log(
      `A inComming call is received from ${fromUserEmail} with offer`,
    );
    console.log(offer);
    const answer = await createAnswer(offer);
    socket.emit("call-accepted", { emailId: fromUserEmail, answer });
  }

  async function handleCallAccepted(answer: RTCSessionDescriptionInit) {
    setRemoteAnswer(answer);
  }

  // put a listener for thr new-user jpoint in the room
  useEffect(() => {
    socket.on("user-joined", handleNewUserJoined);
    socket.on("incomming-call", handleIncommingCall);
    socket.on("call-accepted", handleCallAccepted);

    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incomming-call", handleIncommingCall);
      socket.off("call-accepted", handleCallAccepted);
    };
  }, [socket]);

  return <div>RoomPage</div>;
}
