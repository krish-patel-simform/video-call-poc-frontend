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
  const initialAudioId = location.state?.selectedAudioId as string | undefined;
  const initialVideoId = location.state?.selectedVideoId as string | undefined;

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
  } = useMediaDevices();

  // Sync initial passed device IDs from Home page if available
  useEffect(() => {
    if (initialAudioId) setSelectedAudioId(initialAudioId);
    if (initialVideoId) setSelectedVideoId(initialVideoId);
  }, [initialAudioId, initialVideoId, setSelectedAudioId, setSelectedVideoId]);

  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState<boolean>(initialMic);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(initialCamera);

  const myStreamRef = useRef<MediaStream | null>(null);
  const remoteEmailRef = useRef<string | null>(null);

  // Get local media using selected device IDs
  const startStream = useCallback(async () => {
    const audioConstraints = selectedAudioId
      ? { deviceId: { exact: selectedAudioId } }
      : true;
    const videoConstraints = selectedVideoId
      ? { deviceId: { exact: selectedVideoId } }
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
  }, [selectedAudioId, selectedVideoId, initialMic, initialCamera]);

  // Handle active audio (microphone) hardware device change mid-call
  const handleSelectAudioDevice = useCallback(
    async (newAudioId: string) => {
      setSelectedAudioId(newAudioId);
      if (!myStreamRef.current) return;

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: newAudioId } },
        });
        const newAudioTrack = newStream.getAudioTracks()[0];
        if (!newAudioTrack) return;

        newAudioTrack.enabled = isMicOn;

        const oldAudioTrack = myStreamRef.current.getAudioTracks()[0];
        if (oldAudioTrack) {
          myStreamRef.current.removeTrack(oldAudioTrack);
          oldAudioTrack.stop();
          await replaceTrack(oldAudioTrack, newAudioTrack);
        }

        myStreamRef.current.addTrack(newAudioTrack);
        setMyStream(new MediaStream(myStreamRef.current.getTracks()));
      } catch (err) {
        console.error("[RoomPage] Error switching audio device:", err);
      }
    },
    [isMicOn, replaceTrack, setSelectedAudioId]
  );

  // Handle active video (camera) hardware device change mid-call
  const handleSelectVideoDevice = useCallback(
    async (newVideoId: string) => {
      setSelectedVideoId(newVideoId);
      if (!myStreamRef.current) return;

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: newVideoId } },
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        if (!newVideoTrack) return;

        newVideoTrack.enabled = isCameraOn;

        const oldVideoTrack = myStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) {
          myStreamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
          await replaceTrack(oldVideoTrack, newVideoTrack);
        }

        myStreamRef.current.addTrack(newVideoTrack);
        setMyStream(new MediaStream(myStreamRef.current.getTracks()));
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

      const answer = await createAnswer(offer);
      socket?.emit("call-accepted", { emailId: fromUserEmail, answer });
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
