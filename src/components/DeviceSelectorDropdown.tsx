import { Mic, Video, Volume2, X } from "lucide-react";
import type { MediaDeviceInfoState } from "../hooks/useMediaDevices";

interface DeviceSelectorDropdownProps {
  audioInputs: MediaDeviceInfoState[];
  videoInputs: MediaDeviceInfoState[];
  audioOutputs?: MediaDeviceInfoState[];
  selectedAudioId: string;
  selectedVideoId: string;
  selectedOutputId?: string;
  onSelectAudio: (deviceId: string) => void;
  onSelectVideo: (deviceId: string) => void;
  onSelectOutput?: (deviceId: string) => void;
  onClose: () => void;
}

export function DeviceSelectorDropdown({
  audioInputs,
  videoInputs,
  audioOutputs = [],
  selectedAudioId,
  selectedVideoId,
  selectedOutputId,
  onSelectAudio,
  onSelectVideo,
  onSelectOutput,
  onClose,
}: DeviceSelectorDropdownProps) {
  return (
    <div className="absolute bottom-20 right-0 z-50 w-80 p-5 bg-slate-900/95 border border-slate-800 rounded-2xl backdrop-blur-xl shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <span>Audio & Video Settings</span>
        </h3>
        <button
          onClick={onClose}
          aria-label="Close Settings"
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Microphone Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-indigo-400" />
          <span>Microphone (Input Device)</span>
        </label>
        <select
          value={selectedAudioId}
          onChange={(e) => onSelectAudio(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          {audioInputs.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </div>

      {/* Camera Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5 text-emerald-400" />
          <span>Camera (Video Input)</span>
        </label>
        <select
          value={selectedVideoId}
          onChange={(e) => onSelectVideo(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          {videoInputs.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </div>

      {/* Speaker Output Selection */}
      {audioOutputs.length > 0 && onSelectOutput && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-violet-400" />
            <span>Speaker (Audio Output)</span>
          </label>
          <select
            value={selectedOutputId}
            onChange={(e) => onSelectOutput(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {audioOutputs.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
