import { useEffect, useCallback, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { useSocket } from "../hooks/useSocket";
import { usePeer } from "../hooks/usePeer";
import type { SocketCallbackResponse } from "../types/socket.type";
import { VideoPlayer } from "../components/VideoPlayer";

export default function RoomPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email as string | undefined;

  const { socket } = useSocket();
  const {
    createOffer,
    createAnswer,
    setRemoteAnswer,
    remoteStream,
    sendStream,
    onIceCandidate,
    addIceCandidate,
  } = usePeer();

  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  // Store the remote user's email so we can route ICE candidates correctly
  const remoteEmailRef = useRef<string | null>(null);

  // ------------------------------------------------------------------
  // Get local media (called once on mount or when user clicks Start Video)
  // ------------------------------------------------------------------
  const startStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setMyStream(stream);
    return stream;
  }, []);

  // ------------------------------------------------------------------
  // Existing user: a new user just joined → create offer and call them
  // ------------------------------------------------------------------
  const handleNewUserJoined = useCallback(
    async ({ newUserEmail }: { newUserEmail: string }) => {
      console.log(`[RoomPage] New user joined: ${newUserEmail}`);
      remoteEmailRef.current = newUserEmail;
      const offer = await createOffer();
      socket?.emit("call-user", { newUserEmail, offer });
    },
    [createOffer, socket],
  );

  // ------------------------------------------------------------------
  // New user: received an offer from the existing user → answer it,
  // then send our own stream immediately after the connection is ready
  // ------------------------------------------------------------------
  const handleIncommingCall = useCallback(
    async ({
      offer,
      fromUserEmail,
    }: {
      offer: RTCSessionDescriptionInit;
      fromUserEmail: string;
    }) => {
      console.log(`[RoomPage] Incoming call from ${fromUserEmail}`);
      remoteEmailRef.current = fromUserEmail;
      const answer = await createAnswer(offer);
      socket?.emit("call-accepted", { emailId: fromUserEmail, answer });
    },
    [createAnswer, socket],
  );

  // ------------------------------------------------------------------
  // Existing user: the new user accepted our offer → set remote answer,
  // then add our stream tracks so they flow over the established connection
  // ------------------------------------------------------------------
  const handleCallAccepted = useCallback(
    async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      console.log("[RoomPage] Call accepted — setting remote answer");
      await setRemoteAnswer(answer);

      // NOW it is safe to add tracks (connection is fully negotiated)
      const stream = myStream ?? (await startStream());
      await sendStream(stream);
    },
    [setRemoteAnswer, myStream, startStream, sendStream],
  );

  // ------------------------------------------------------------------
  // ICE candidate relay — forward locally generated candidates to the
  // remote peer and apply remotely received candidates locally
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    const cleanupIce = onIceCandidate((candidate) => {
      if (remoteEmailRef.current) {
        socket.emit("peer:ice-candidate", {
          targetEmail: remoteEmailRef.current,
          candidate,
        });
      }
    });

    socket.on(
      "peer:ice-candidate",
      ({ candidate }: { candidate: RTCIceCandidateInit }) => {
        addIceCandidate(candidate);
      },
    );

    return () => {
      cleanupIce();
      socket.off("peer:ice-candidate");
    };
  }, [socket, onIceCandidate, addIceCandidate]);

  // ------------------------------------------------------------------
  // Also send our stream when the incoming user's call is answered
  // (the answering side must also push tracks after setLocalDescription)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    // After WE answered an incoming call, add our tracks too
    async function handleStreamAfterAnswer() {
      if (myStream) {
        await sendStream(myStream);
      } else {
        const stream = await startStream();
        await sendStream(stream);
      }
    }

    socket.on("call-accepted-ack", handleStreamAfterAnswer);
    return () => {
      socket.off("call-accepted-ack", handleStreamAfterAnswer);
    };
  }, [socket, myStream, sendStream, startStream]);

  // ------------------------------------------------------------------
  // Main socket event setup + room join
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    if (!email || !roomId) {
      console.warn("[RoomPage] Missing email or roomId — redirecting to home");
      navigate("/");
      return;
    }

    socket.on("user-joined", handleNewUserJoined);
    socket.on("incomming-call", handleIncommingCall);
    socket.on("call-accepted", handleCallAccepted);

    socket.emit(
      "join-room",
      { roomId, email },
      (response: SocketCallbackResponse) => {
        if (response.success) {
          console.log("[RoomPage] Successfully joined the room");
        }
      },
    );

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

  // ------------------------------------------------------------------
  // When the answering side finishes answering, also push their stream.
  // We do this by watching `remoteStream` arriving — it means the peer
  // connection is live and we should make sure our tracks are sent.
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!remoteStream || !myStream) return;
    // Peer connection is established — ensure our tracks are sent
    sendStream(myStream);
  }, [remoteStream, myStream, sendStream]);

  return (
    <div>
      <h1>Room Page: {roomId}</h1>
      <p>Logged in as: {email}</p>

      <div className="flex w-screen justify-between">
        <button className="border p-4 rounded" onClick={startStream}>
          Start Video
        </button>
        {myStream && (
          <section className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <h6>You</h6>
            <VideoPlayer stream={myStream} muted={true} />
          </section>
        )}
        <section className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <h6>Remote User</h6>
          {remoteStream && <VideoPlayer stream={remoteStream} muted={false} />}
        </section>
      </div>
    </div>
  );
}
