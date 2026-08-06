import { createContext } from "react";

export type PeerContextType = {
  peer: RTCPeerConnection;
  createOffer: () => Promise<RTCSessionDescriptionInit>;
  createAnswer: (
    offer: RTCSessionDescriptionInit,
  ) => Promise<RTCSessionDescriptionInit>;
  setRemoteAnswer: (answer: RTCSessionDescriptionInit) => void;
};

export const PeerContext = createContext<PeerContextType | null>(null);
