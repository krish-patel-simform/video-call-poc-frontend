import { useState, useEffect, useCallback } from "react";

export interface MediaDeviceInfoState {
  deviceId: string;
  label: string;
}

export function useMediaDevices() {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfoState[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfoState[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfoState[]>([]);

  const [selectedAudioId, setSelectedAudioId] = useState<string>("");
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [selectedOutputId, setSelectedOutputId] = useState<string>("");

  const enumerateDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;

      let devices = await navigator.mediaDevices.enumerateDevices();

      // Check if labels are empty (browser permission not granted yet).
      // Prompt temporary permission so browser returns actual microphone names & unique device IDs.
      const hasLabels = devices.some((d) => Boolean(d.label));
      if (!hasLabels && navigator.mediaDevices.getUserMedia) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
          tempStream.getTracks().forEach((t) => t.stop());
          devices = await navigator.mediaDevices.enumerateDevices();
        } catch {
          // Fall back to available basic list if permission prompt is dismissed
        }
      }

      const mics = devices
        .filter((d) => d.kind === "audioinput")
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${index + 1}`,
        }));

      const cams = devices
        .filter((d) => d.kind === "videoinput")
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
        }));

      const speakers = devices
        .filter((d) => d.kind === "audiooutput")
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Speaker ${index + 1}`,
        }));

      setAudioInputs(mics);
      setVideoInputs(cams);
      setAudioOutputs(speakers);

      if (mics.length > 0 && !selectedAudioId) {
        setSelectedAudioId(mics[0].deviceId);
      }
      if (cams.length > 0 && !selectedVideoId) {
        setSelectedVideoId(cams[0].deviceId);
      }
      if (speakers.length > 0 && !selectedOutputId) {
        setSelectedOutputId(speakers[0].deviceId);
      }
    } catch (err) {
      console.warn("[useMediaDevices] Error enumerating devices:", err);
    }
  }, [selectedAudioId, selectedVideoId, selectedOutputId]);

  useEffect(() => {
    enumerateDevices();

    const handleDeviceChange = () => {
      enumerateDevices();
    };

    navigator.mediaDevices?.addEventListener("devicechange", handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener("devicechange", handleDeviceChange);
    };
  }, [enumerateDevices]);

  return {
    audioInputs,
    videoInputs,
    audioOutputs,
    selectedAudioId,
    selectedVideoId,
    selectedOutputId,
    setSelectedAudioId,
    setSelectedVideoId,
    setSelectedOutputId,
    refreshDevices: enumerateDevices,
  };
}
