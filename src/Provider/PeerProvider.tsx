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

  // Create RTCPeerConnection with STUN servers for cross-network connectivity.
  // Memoized with [] so it is created exactly once and never changes.
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

  /**
   * All functions below are wrapped in useCallback with [peer] as the only dep.
   * Because `peer` is memoized with [] it never changes — so all these callbacks
   * are created once and are permanently stable references.
   *
   * WHY THIS MATTERS:
   *   RoomPage's handleNewUserJoined / handleIncommingCall / handleCallAccepted
   *   include these functions in their own useCallback deps. If these functions
   *   had new references on every render (plain async functions), the socket
   *   useEffect would re-run on every re-render, briefly un-registering and
   *   re-registering socket.io listeners. If a socket event arrived during that
   *   window, or if the event handler ran concurrently with a re-registration,
   *   createAnswer could be called a second time on a peer connection that has
   *   already advanced past have-remote-offer state → InvalidStateError.
   */

  const createOffer = useCallback(async () => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  }, [peer]);

  const createAnswer = useCallback(
    async (offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> => {
      // Guard: setRemoteDescription is only valid from 'stable' state.
      // If called in a duplicate event scenario, throw so the caller can handle it.
      if (peer.signalingState !== "stable") {
        const err = new Error(
          `[PeerProvider] createAnswer called in wrong signalingState: ${peer.signalingState}`,
        );
        console.warn(err.message);
        throw err;
      }
      await peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      return answer;
    },
    [peer],
  );

  const setRemoteAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      await peer.setRemoteDescription(answer);
    },
    [peer],
  );

  const sendStream = useCallback(
    async (stream: MediaStream) => {
      const senders = peer.getSenders();
      for (const track of stream.getTracks()) {
        // Avoid adding duplicate tracks if already added
        const alreadyAdded = senders.some((s) => s.track === track);
        if (!alreadyAdded) {
          peer.addTrack(track, stream);
        }
      }
    },
    [peer],
  );

  /**
   * Replaces an existing track on the active RTCPeerConnection.
   *
   * Sender is resolved strictly by track kind ('audio' or 'video').
   * Must be called BEFORE stopping the old track — once a track is stopped,
   * sender.track becomes null and the sender can no longer be matched.
   */
  const replaceTrack = useCallback(
    async (newTrack: MediaStreamTrack) => {
      const senders = peer.getSenders();
      const sender = senders.find(
        (s) => s.track !== null && s.track.kind === newTrack.kind,
      );
      if (sender) {
        console.log(`[PeerProvider] Replacing ${newTrack.kind} track`);
        await sender.replaceTrack(newTrack);
      } else {
        console.warn(
          `[PeerProvider] No active sender found for ${newTrack.kind} track`,
        );
      }
    },
    [peer],
  );

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

  const addIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("[PeerProvider] Failed to add ICE candidate", e);
      }
    },
    [peer],
  );

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

  // remoteStream must be in deps so context consumers re-render when it changes.
  // All functions are stable (useCallback with [peer]) so this useMemo only ever
  // recomputes when the remote stream arrives — not on every render.
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
    [
      peer,
      createOffer,
      createAnswer,
      setRemoteAnswer,
      sendStream,
      replaceTrack,
      remoteStream,
      onIceCandidate,
      addIceCandidate,
    ],
  );

  return <PeerContext.Provider value={value}>{children}</PeerContext.Provider>;
}
