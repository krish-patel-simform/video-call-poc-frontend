import {
  useMemo,
  type PropsWithChildren,
  useEffect,
  useState,
  useCallback,
} from "react";
import { PeerContext } from "../context/PeerContext";

export default function PeerProvider({ children }: PropsWithChildren) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [iceCandidateHandlers, setIceCandidateHandlers] = useState<
    ((candidate: RTCIceCandidate) => void)[]
  >([]);

  // Create RTCPeerConnection with STUN servers for cross-network connectivity
  const peer = useMemo(
    () =>
      new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      }),
    [],
  );

  async function createOffer() {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  }

  async function createAnswer(offer: RTCSessionDescriptionInit) {
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  }

  async function setRemoteAnswer(answer: RTCSessionDescriptionInit) {
    await peer.setRemoteDescription(answer);
  }

  async function sendStream(stream: MediaStream) {
    const senders = peer.getSenders();
    for (const track of stream.getTracks()) {
      // Avoid adding duplicate tracks if already added
      const alreadyAdded = senders.some((s) => s.track === track);
      if (!alreadyAdded) {
        peer.addTrack(track, stream);
      }
    }
  }

  /**
   * Replaces an existing track on the active RTCPeerConnection.
   *
   * Sender is resolved strictly by track kind ('audio' or 'video').
   * This must be called BEFORE stopping the old track — once a track is stopped,
   * `sender.track` becomes null and the sender can no longer be matched by reference.
   */
  async function replaceTrack(newTrack: MediaStreamTrack) {
    const senders = peer.getSenders();
    const sender = senders.find(
      (s) => s.track !== null && s.track.kind === newTrack.kind,
    );
    if (sender) {
      console.log(`[PeerProvider] Replacing ${newTrack.kind} track`);
      await sender.replaceTrack(newTrack);
    } else {
      console.warn(`[PeerProvider] No active sender found for ${newTrack.kind} track`);
    }
  }

  /**
   * Register a callback that fires whenever a local ICE candidate is generated.
   * RoomPage uses this to forward candidates to the remote peer via socket.
   */
  const onIceCandidate = useCallback(
    (handler: (candidate: RTCIceCandidate) => void) => {
      setIceCandidateHandlers((prev) => [...prev, handler]);
      return () => {
        setIceCandidateHandlers((prev) => prev.filter((h) => h !== handler));
      };
    },
    [],
  );

  // Forward incoming remote ICE candidates to the peer connection
  async function addIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn("[PeerProvider] Failed to add ICE candidate", e);
    }
  }

  // Listen for remote stream tracks
  useEffect(() => {
    function handleTrack(event: RTCTrackEvent) {
      console.log("[PeerProvider] Received remote track");
      setRemoteStream(event.streams[0]);
    }
    peer.addEventListener("track", handleTrack);

    return () => {
      peer.removeEventListener("track", handleTrack);
    };
  }, [peer]);

  // Emit local ICE candidates to registered handlers
  useEffect(() => {
    function handleIceCandidate(event: RTCPeerConnectionIceEvent) {
      if (event.candidate) {
        console.log("[PeerProvider] Generated local ICE candidate");
        iceCandidateHandlers.forEach((h) => h(event.candidate!));
      }
    }
    peer.addEventListener("icecandidate", handleIceCandidate);

    return () => peer.removeEventListener("icecandidate", handleIceCandidate);
  }, [peer, iceCandidateHandlers]);

  const value = useMemo(
    () => ({
      peer,
      createOffer,
      createAnswer,
      setRemoteAnswer,
      sendStream,
      replaceTrack,
      remoteStream,
      onIceCandidate,
      addIceCandidate,
    }),
    // remoteStream must be in deps so context consumers re-render when it changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [peer, remoteStream, onIceCandidate],
  );

  return <PeerContext.Provider value={value}>{children}</PeerContext.Provider>;
}
