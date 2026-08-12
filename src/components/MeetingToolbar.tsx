import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { cn } from "../utils/cn";

interface MeetingToolbarProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onLeaveCall: () => void;
}

export function MeetingToolbar({
  isMicOn,
  isCameraOn,
  onToggleMic,
  onToggleCamera,
  onLeaveCall,
}: MeetingToolbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-slate-900/90 border border-slate-800/90 rounded-2xl backdrop-blur-xl shadow-2xl shadow-slate-950/80">
      {/* Microphone Toggle Button */}
      <button
        type="button"
        onClick={onToggleMic}
        aria-label={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
        aria-pressed={isMicOn}
        className={cn(
          "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer",
          isMicOn
            ? "bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700/80"
            : "bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30"
        )}
      >
        {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>

      {/* Camera Toggle Button */}
      <button
        type="button"
        onClick={onToggleCamera}
        aria-label={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
        aria-pressed={isCameraOn}
        className={cn(
          "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer",
          isCameraOn
            ? "bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700/80"
            : "bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30"
        )}
      >
        {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>

      <div className="w-px h-6 bg-slate-800 my-auto" />

      {/* Leave Meeting Button */}
      <button
        type="button"
        onClick={onLeaveCall}
        aria-label="Leave Meeting"
        className="flex items-center justify-center gap-2 px-5 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-lg shadow-rose-600/25 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
      >
        <PhoneOff className="w-5 h-5" />
        <span className="text-sm font-semibold hidden sm:inline">Leave Call</span>
      </button>
    </div>
  );
}
