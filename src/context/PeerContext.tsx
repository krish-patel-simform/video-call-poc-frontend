import { createContext } from "react";

export type PeerContextType = {
  peer: RTCPeerConnection;
  createOffer: () => Promise<RTCSessionDescriptionInit>;
  createAnswer: (
    offer: RTCSessionDescriptionInit,
  ) => Promise<RTCSessionDescriptionInit>;
  setRemoteAnswer: (answer: RTCSessionDescriptionInit) => void;
  sendStream: (stream: MediaStream) => void;
  /**
   * Replaces the active track on the RTCPeerConnection sender of the same kind.
   * Must be called BEFORE stopping the old track.
   */
  replaceTrack: (newTrack: MediaStreamTrack) => Promise<void>;
  remoteStream: MediaStream | null;
  /** Register a listener for locally generated ICE candidates. Returns a cleanup fn. */
  onIceCandidate: (handler: (candidate: RTCIceCandidate) => void) => () => void;
  /** Feed a received remote ICE candidate into the peer connection. */
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
};

export const PeerContext = createContext<PeerContextType | null>(null);
