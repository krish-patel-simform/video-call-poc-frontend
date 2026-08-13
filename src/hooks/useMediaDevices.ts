import { useState, useEffect, useCallback, useRef } from "react";

export interface MediaDeviceInfoState {
  deviceId: string;
  label: string;
}

/**
 * Manages media device enumeration and selection.
 *
 * @param initialAudioId - Pre-selected audio device ID from the home page form.
 * @param initialVideoId - Pre-selected video device ID from the home page form.
 *
 * KEY DESIGN: Internal refs mirror the selected state so that `enumerateDevices`
 * never reads a stale closure value and never overwrites a user's explicit choice.
 */
export function useMediaDevices(initialAudioId?: string, initialVideoId?: string) {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfoState[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfoState[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfoState[]>([]);

  // Refs mirror state so enumerateDevices (async) always reads the real current value
  const audioIdRef = useRef<string>(initialAudioId ?? "");
  const videoIdRef = useRef<string>(initialVideoId ?? "");
  const outputIdRef = useRef<string>("");

  // State is for UI rendering only (dropdown shows the current selection)
  const [selectedAudioId, _setSelectedAudioId] = useState<string>(initialAudioId ?? "");
  const [selectedVideoId, _setSelectedVideoId] = useState<string>(initialVideoId ?? "");
  const [selectedOutputId, _setSelectedOutputId] = useState<string>("");

  /** Setter that keeps ref and state in sync — always use this, never _setSelectedAudioId directly. */
  const setSelectedAudioId = useCallback((id: string) => {
    audioIdRef.current = id;
    _setSelectedAudioId(id);
  }, []);

  const setSelectedVideoId = useCallback((id: string) => {
    videoIdRef.current = id;
    _setSelectedVideoId(id);
  }, []);

  const setSelectedOutputId = useCallback((id: string) => {
    outputIdRef.current = id;
    _setSelectedOutputId(id);
  }, []);

  /**
   * Queries the browser for all media devices.
   *
   * If the browser has not yet granted media permission, device labels will be empty
   * and device IDs will be generic. We trigger a temporary getUserMedia to force the
   * browser to reveal real hardware names and unique IDs, then immediately stop all
   * tracks so we are not holding any open stream.
   *
   * IMPORTANT: Auto-selection only fires if the user has NOT already chosen a device.
   * We check the ref (not state) so we never read a stale value from a closure.
   */
  const enumerateDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;

      let devices = await navigator.mediaDevices.enumerateDevices();

      // Labels are blank when browser permission hasn't been granted yet
      const hasLabels = devices.some((d) => Boolean(d.label));
      if (!hasLabels && navigator.mediaDevices.getUserMedia) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          tempStream.getTracks().forEach((t) => t.stop());
          devices = await navigator.mediaDevices.enumerateDevices();
        } catch {
          // If permission is denied, continue with whatever list we have
        }
      }

      const mics = devices.filter((d) => d.kind === "audioinput").map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Microphone ${i + 1}`,
      }));
      const cams = devices.filter((d) => d.kind === "videoinput").map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${i + 1}`,
      }));
      const speakers = devices.filter((d) => d.kind === "audiooutput").map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Speaker ${i + 1}`,
      }));

      setAudioInputs(mics);
      setVideoInputs(cams);
      setAudioOutputs(speakers);

      // Only auto-select if no device has been explicitly chosen yet.
      // Read from refs — not state — so we see the up-to-date value even inside this async callback.
      if (mics.length > 0 && !audioIdRef.current) {
        setSelectedAudioId(mics[0].deviceId);
      }
      if (cams.length > 0 && !videoIdRef.current) {
        setSelectedVideoId(cams[0].deviceId);
      }
      if (speakers.length > 0 && !outputIdRef.current) {
        setSelectedOutputId(speakers[0].deviceId);
      }
    } catch (err) {
      console.warn("[useMediaDevices] Error enumerating devices:", err);
    }
  }, [setSelectedAudioId, setSelectedVideoId, setSelectedOutputId]);

  useEffect(() => {
    enumerateDevices();
    navigator.mediaDevices?.addEventListener("devicechange", enumerateDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener("devicechange", enumerateDevices);
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
