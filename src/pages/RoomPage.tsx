import { useEffect, useCallback, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { useSocket } from "../hooks/useSocket";
import { usePeer } from "../hooks/usePeer";
import { useMediaDevices } from "../hooks/useMediaDevices";
import type { SocketCallbackResponse } from "../types/socket.type";
import { VideoPlayer } from "../components/VideoPlayer";
import { MeetingToolbar } from "../components/MeetingToolbar";

export default function RoomPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email as string | undefined;
  const initialMic = (location.state?.initialMic as boolean | undefined) ?? true;
  const initialCamera = (location.state?.initialCamera as boolean | undefined) ?? true;
  // Device IDs selected on the Home page before joining
  const initialAudioId = (location.state?.selectedAudioId as string | undefined) ?? "";
  const initialVideoId = (location.state?.selectedVideoId as string | undefined) ?? "";

  const { socket } = useSocket();
  const {
    createOffer,
    createAnswer,
    setRemoteAnswer,
    remoteStream,
    sendStream,
    replaceTrack,
    onIceCandidate,
    addIceCandidate,
  } = usePeer();

  // Pass initial device IDs so useMediaDevices seeds its state/refs correctly.
  // This eliminates the async race where enumerateDevices would overwrite the user's choice.
  const {
    audioInputs,
    videoInputs,
    audioOutputs,
    selectedAudioId,
    selectedVideoId,
    selectedOutputId,
    setSelectedAudioId,
    setSelectedVideoId,
    setSelectedOutputId,
  } = useMediaDevices(initialAudioId, initialVideoId);

  /**
   * activeAudioIdRef / activeVideoIdRef
   *
   * These refs are the single source of truth for which hardware device is
   * currently IN USE (or will be used on the next startStream call).
   *
   * WHY REFS, NOT STATE:
   *   startStream is wrapped in useCallback and is used inside handleNewUserJoined
   *   and handleIncommingCall. Those handlers are registered as socket listeners.
   *   If startStream depended on React state for device IDs, it would capture a
   *   stale value from the render at registration time. Refs are always current.
   *
   * Initialised directly from location.state so the value is ready synchronously
   * before any effect or socket event fires.
   */
  const activeAudioIdRef = useRef<string>(initialAudioId);
  const activeVideoIdRef = useRef<string>(initialVideoId);

  // Keep activeAudioIdRef / activeVideoIdRef in sync with the dropdown selection.
  // This is safe because both state and ref stay aligned from this point on.
  useEffect(() => {
    if (selectedAudioId) {
      activeAudioIdRef.current = selectedAudioId;
    }
  }, [selectedAudioId]);

  useEffect(() => {
    if (selectedVideoId) {
      activeVideoIdRef.current = selectedVideoId;
    }
  }, [selectedVideoId]);

  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState<boolean>(initialMic);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(initialCamera);

  const myStreamRef = useRef<MediaStream | null>(null);
  const remoteEmailRef = useRef<string | null>(null);
  // Separate ref for isMicOn so handleSelectAudioDevice always reads the current value
  const isMicOnRef = useRef<boolean>(initialMic);

  // Keep isMicOnRef synced
  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  /**
   * startStream — acquires local camera + microphone.
   *
   * Reads device IDs from refs (not state) so the correct device is always
   * used regardless of when this callback was captured in a closure.
   *
   * Deliberately has NO device-ID state in its deps — only initialMic/initialCamera
   * (from location.state, which never changes for the lifetime of this component).
   */
  const startStream = useCallback(async () => {
    const targetAudioId = activeAudioIdRef.current;
    const targetVideoId = activeVideoIdRef.current;

    console.log("[RoomPage] startStream — using audio device:", targetAudioId || "browser default");
    console.log("[RoomPage] startStream — using video device:", targetVideoId || "browser default");

    const audioConstraints: MediaTrackConstraints = {
      // Use { ideal: true } instead of plain `true` for audio processing flags.
      // A plain boolean is treated as a REQUIRED constraint in Safari — if the
      // browser doesn't support noiseSuppression or autoGainControl it throws
      // OverconstrainedError. { ideal: true } makes them best-effort: applied when
      // supported, silently skipped when not (Chrome, Firefox, Safari all safe).
      echoCancellation: { ideal: true },
      noiseSuppression: { ideal: true },
      autoGainControl: { ideal: true },
      // Use `ideal` for deviceId here too — pre-permission IDs may be placeholder
      // strings that don't match real hardware after permission is granted.
      ...(targetAudioId ? { deviceId: { ideal: targetAudioId } } : {}),
    };
    const videoConstraints: MediaTrackConstraints | boolean = targetVideoId
      ? { deviceId: { ideal: targetVideoId } }
      : true;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints,
      video: videoConstraints,
    });

    stream.getAudioTracks().forEach((track) => {
      track.enabled = initialMic;
    });
    stream.getVideoTracks().forEach((track) => {
      track.enabled = initialCamera;
    });

    myStreamRef.current = stream;
    setMyStream(stream);
    return stream;
  }, [initialMic, initialCamera]); // Stable — device IDs read from refs at call time

  /**
   * handleSelectAudioDevice — switches microphone mid-call.
   *
   * 1. Update the ref FIRST so any concurrent startStream calls pick up the new device.
   * 2. Acquire the new audio track with { exact: deviceId } — no silent fallback.
   * 3. Replace the track on the WebRTC sender BEFORE stopping the old track
   *    (stopping first would null out sender.track, making replacement fail).
   * 4. Stop the old track after replacement to release hardware.
   */
  const handleSelectAudioDevice = useCallback(
    async (newAudioId: string) => {
      // Commit immediately to both ref and UI state
      activeAudioIdRef.current = newAudioId;
      setSelectedAudioId(newAudioId);

      if (!myStreamRef.current) return;

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: { exact: newAudioId },
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
          },
        });
        const newAudioTrack = newStream.getAudioTracks()[0];
        if (!newAudioTrack) {
          console.error("[RoomPage] No audio track returned for device:", newAudioId);
          return;
        }

        newAudioTrack.enabled = isMicOnRef.current;

        const oldAudioTrack = myStreamRef.current.getAudioTracks()[0];

        // Step 1: Replace on WebRTC peer connection (old track must still be live)
        await replaceTrack(newAudioTrack);

        // Step 2: Swap track on the local MediaStream
        if (oldAudioTrack) {
          myStreamRef.current.removeTrack(oldAudioTrack);
          oldAudioTrack.stop(); // Release hardware AFTER replace
        }
        myStreamRef.current.addTrack(newAudioTrack);

        // Trigger re-render of local preview
        setMyStream(new MediaStream(myStreamRef.current.getTracks()));

        console.log("[RoomPage] Switched microphone to:", newAudioTrack.label);
      } catch (err) {
        console.error("[RoomPage] Error switching audio device:", err);
      }
    },
    [replaceTrack, setSelectedAudioId]
  );

  /**
   * handleSelectVideoDevice — switches camera mid-call.
   * Same safety ordering as handleSelectAudioDevice: replace then stop.
   */
  const handleSelectVideoDevice = useCallback(
    async (newVideoId: string) => {
      activeVideoIdRef.current = newVideoId;
      setSelectedVideoId(newVideoId);

      if (!myStreamRef.current) return;

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: newVideoId } },
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        if (!newVideoTrack) {
          console.error("[RoomPage] No video track returned for device:", newVideoId);
          return;
        }

        newVideoTrack.enabled = isCameraOn;

        const oldVideoTrack = myStreamRef.current.getVideoTracks()[0];

        await replaceTrack(newVideoTrack);

        if (oldVideoTrack) {
          myStreamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        myStreamRef.current.addTrack(newVideoTrack);

        setMyStream(new MediaStream(myStreamRef.current.getTracks()));

        console.log("[RoomPage] Switched camera to:", newVideoTrack.label);
      } catch (err) {
        console.error("[RoomPage] Error switching video device:", err);
      }
    },
    [isCameraOn, replaceTrack, setSelectedVideoId]
  );

  // HOST side: new user joined
  const handleNewUserJoined = useCallback(
    async ({ newUserEmail }: { newUserEmail: string }) => {
      console.log(`[RoomPage] New user joined: ${newUserEmail}`);
      remoteEmailRef.current = newUserEmail;

      const stream = myStreamRef.current ?? (await startStream());
      await sendStream(stream);

      const offer = await createOffer();
      socket?.emit("call-user", { newUserEmail, offer });
    },
    [createOffer, socket, startStream, sendStream]
  );

  // GUEST side: incoming call
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
      await sendStream(stream);

      try {
        const answer = await createAnswer(offer);
        socket?.emit("call-accepted", { emailId: fromUserEmail, answer });
      } catch (err) {
        // This fires if createAnswer is called while the peer is already past
        // have-remote-offer state (e.g., a duplicate socket event). Log and ignore.
        console.warn("[RoomPage] handleIncommingCall: duplicate or late offer — ignoring.", err);
      }
    },
    [createAnswer, socket, startStream, sendStream]
  );

  // HOST side: call accepted
  const handleCallAccepted = useCallback(
    async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      console.log("[RoomPage] Call accepted — setting remote answer");
      await setRemoteAnswer(answer);
    },
    [setRemoteAnswer]
  );

  // Toggle Microphone
  const toggleMic = useCallback(() => {
    if (!myStreamRef.current) return;
    const newMicState = !isMicOn;
    myStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = newMicState;
    });
    setIsMicOn(newMicState);
  }, [isMicOn]);

  // Toggle Camera
  const toggleCamera = useCallback(() => {
    if (!myStreamRef.current) return;
    const newCameraState = !isCameraOn;
    myStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = newCameraState;
    });
    setIsCameraOn(newCameraState);
  }, [isCameraOn]);

  // Leave Call
  const handleLeaveCall = useCallback(() => {
    if (myStreamRef.current) {
      myStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    navigate("/");
  }, [navigate]);

  // ICE candidate relay
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

    socket.on("peer:ice-candidate", ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      addIceCandidate(candidate);
    });

    return () => {
      cleanupIce();
      socket.off("peer:ice-candidate");
    };
  }, [socket, onIceCandidate, addIceCandidate]);

  // Join room once on mount
  useEffect(() => {
    if (!socket) return;
    if (!email || !roomId) {
      navigate("/");
      return;
    }

    socket.emit("join-room", { roomId, email }, (res: SocketCallbackResponse) => {
      if (res.success) console.log("[RoomPage] Joined room successfully");
    });
  }, [socket, email, roomId, navigate]);

  // Register socket listeners
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-6 pb-28 relative">
      {/* Top Header info */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Room: {roomId}</h1>
          <p className="text-xs text-slate-400">Signed in as: {email}</p>
        </div>
        {!myStream && (
          <button
            onClick={startStream}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow cursor-pointer transition-colors"
          >
            Start Video
          </button>
        )}
      </header>

      {/* Main Video Stream Grid */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full mx-auto">
        {/* Local Participant View */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col aspect-video relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between mb-3 z-10">
            <span className="text-sm font-semibold text-slate-200">You ({email})</span>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden relative">
            <VideoPlayer
              stream={myStream}
              muted={true}
              isCameraOn={isCameraOn}
              displayName={email?.split("@")[0] || "You"}
            />
          </div>
        </section>

        {/* Remote Participant View */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col aspect-video relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between mb-3 z-10">
            <span className="text-sm font-semibold text-slate-200">
              {remoteEmailRef.current ? remoteEmailRef.current : "Awaiting Remote Peer..."}
            </span>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden relative">
            <VideoPlayer
              stream={remoteStream}
              muted={false}
              isCameraOn={Boolean(remoteStream)}
              displayName={remoteEmailRef.current?.split("@")[0] || "Remote User"}
            />
          </div>
        </section>
      </main>

      {/* In-Call Meeting Floating Control Toolbar */}
      <MeetingToolbar
        isMicOn={isMicOn}
        isCameraOn={isCameraOn}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onLeaveCall={handleLeaveCall}
        audioInputs={audioInputs}
        videoInputs={videoInputs}
        audioOutputs={audioOutputs}
        selectedAudioId={selectedAudioId}
        selectedVideoId={selectedVideoId}
        selectedOutputId={selectedOutputId}
        onSelectAudio={handleSelectAudioDevice}
        onSelectVideo={handleSelectVideoDevice}
        onSelectOutput={setSelectedOutputId}
      />
    </div>
  );
}
