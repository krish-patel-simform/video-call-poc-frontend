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

  /**
   * myStreamRef mirrors myStream state but is accessible in callbacks WITHOUT
   * being listed as a dependency.
   *
   * WHY THIS MATTERS:
   *   The main useEffect (which emits join-room) re-runs whenever any of its
   *   deps change. If handleNewUserJoined / handleIncommingCall / handleCallAccepted
   *   have `myStream` in their deps, they get recreated every time the stream
   *   starts. That recreates the handlers → triggers the main useEffect → emits
   *   join-room AGAIN mid-call → the server treats the already-in-call peer as a
   *   "new" user → the other side sends another offer → WebRTC state machine
   *   gets corrupted ("Called in wrong state: stable").
   *
   *   Using a ref lets handlers read the current stream value at call-time
   *   without needing to declare it as a dependency.
   */
  const myStreamRef = useRef<MediaStream | null>(null);
  const remoteEmailRef = useRef<string | null>(null);

  // ------------------------------------------------------------------
  // Get local media (called once on mount or when user clicks Start Video)
  // ------------------------------------------------------------------
  const startStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    myStreamRef.current = stream; // keep ref in sync
    setMyStream(stream);
    return stream;
  }, []);

  // ------------------------------------------------------------------
  // HOST side: a new guest joined the room.
  //
  // CRITICAL ORDER — tracks MUST be added before createOffer():
  //   The SDP offer is a contract that enumerates which tracks will be
  //   sent. addTrack() after createOffer() = tracks not in SDP = the
  //   remote peer's ontrack never fires = no video on either side.
  //
  // NO myStream in deps — we read myStreamRef.current instead.
  //   If myStream were in deps, this callback would be recreated when the
  //   stream starts, causing the main effect to re-run and re-emit join-room.
  // ------------------------------------------------------------------
  const handleNewUserJoined = useCallback(
    async ({ newUserEmail }: { newUserEmail: string }) => {
      console.log(`[RoomPage] New user joined: ${newUserEmail}`);
      remoteEmailRef.current = newUserEmail;

      // Read current stream from ref — no dependency on myStream state
      const stream = myStreamRef.current ?? (await startStream());
      await sendStream(stream); // addTrack() BEFORE createOffer()

      const offer = await createOffer();
      socket?.emit("call-user", { newUserEmail, offer });
    },
    [createOffer, socket, startStream, sendStream], // ← no myStream
  );

  // ------------------------------------------------------------------
  // GUEST side: received an offer from the host.
  //
  // Same rule: tracks before createAnswer().
  // Same ref trick: no myStream in deps.
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

      const stream = myStreamRef.current ?? (await startStream());
      await sendStream(stream); // addTrack() BEFORE createAnswer()

      const answer = await createAnswer(offer);
      socket?.emit("call-accepted", { emailId: fromUserEmail, answer });
    },
    [createAnswer, socket, startStream, sendStream], // ← no myStream
  );

  // ------------------------------------------------------------------
  // HOST side: guest accepted → apply remote answer.
  // Tracks were already added before createOffer() — nothing extra needed.
  // ------------------------------------------------------------------
  const handleCallAccepted = useCallback(
    async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      console.log("[RoomPage] Call accepted — setting remote answer");
      await setRemoteAnswer(answer);
    },
    [setRemoteAnswer], // ← no myStream — stable forever
  );

  // ------------------------------------------------------------------
  // ICE candidate relay
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
  // Emit join-room ONCE — separate from event listener registration so
  // that re-registration of listeners never re-triggers join-room.
  // Deps are all stable after mount: socket (memoized), email, roomId
  // (from URL), navigate (stable router fn).
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    if (!email || !roomId) {
      console.warn("[RoomPage] Missing email or roomId — redirecting to home");
      navigate("/");
      return;
    }

    socket.emit(
      "join-room",
      { roomId, email },
      (response: SocketCallbackResponse) => {
        if (response.success) {
          console.log("[RoomPage] Successfully joined the room");
        }
      },
    );
  }, [socket, email, roomId, navigate]); // ← no handler deps here

  // ------------------------------------------------------------------
  // Register call event listeners — separate effect so that if handlers
  // are ever recreated, only listeners re-register, NOT join-room.
  // With myStreamRef in place handlers are stable so this runs once too.
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    socket.on("user-joined", handleNewUserJoined);
    socket.on("incomming-call", handleIncommingCall);
    socket.on("call-accepted", handleCallAccepted);

    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incomming-call", handleIncommingCall);
      socket.off("call-accepted", handleCallAccepted);
    };
  }, [socket, handleNewUserJoined, handleIncommingCall, handleCallAccepted]);

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
          <h6>
            {remoteEmailRef.current ? remoteEmailRef.current : "Awaiting Connection"}
          </h6>
          {remoteStream && <VideoPlayer stream={remoteStream} muted={false} />}
        </section>
      </div>
    </div>
  );
}
