import { useEffect, useRef } from "react";
import { User, VideoOff } from "lucide-react";

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  isCameraOn?: boolean;
  displayName?: string;
  selectedOutputId?: string;
}

export function VideoPlayer({
  stream,
  muted = false,
  isCameraOn = true,
  displayName = "User",
  selectedOutputId,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if stream has an active enabled video track
  const hasActiveVideo =
    isCameraOn &&
    Boolean(stream?.getVideoTracks().some((track) => track.enabled));

  useEffect(() => {
    if (videoRef.current && stream && hasActiveVideo) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [stream, hasActiveVideo]);

  // Handle speaker / audio output device routing if supported by browser
  useEffect(() => {
    if (
      videoRef.current &&
      selectedOutputId &&
      "setSinkId" in videoRef.current
    ) {
      (
        videoRef.current as HTMLVideoElement & {
          setSinkId: (id: string) => Promise<void>;
        }
      )
        .setSinkId(selectedOutputId)
        .catch((err) => console.warn("[VideoPlayer] setSinkId error:", err));
    }
  }, [selectedOutputId]);

  if (!stream) {
    return (
      <div className="relative w-full h-full min-h-[240px] flex flex-col items-center justify-center rounded-xl bg-slate-900 border border-slate-800 p-6 text-slate-500">
        <User className="w-12 h-12 mb-2 text-slate-600" />
        <span className="text-sm font-medium">No video stream available</span>
      </div>
    );
  }

  if (!hasActiveVideo) {
    const initial = displayName.charAt(0).toUpperCase() || "U";

    return (
      <div className="relative w-full h-full min-h-[240px] flex flex-col items-center justify-center rounded-xl bg-slate-900 border border-slate-800 p-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/20 mb-3">
          {initial}
        </div>
        <span className="text-sm font-medium text-slate-300 mb-1">{displayName}</span>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-rose-400 text-xs font-medium">
          <VideoOff className="w-3.5 h-3.5" />
          <span>Camera Off</span>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className="w-full h-full object-cover rounded-xl bg-slate-900 border border-slate-800"
    />
  );
}
