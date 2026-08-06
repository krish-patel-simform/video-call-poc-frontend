import { useMemo, type PropsWithChildren } from "react";
import { PeerContext } from "../context/PeerContext";

export default function PeerProvider({ children }: PropsWithChildren) {
  const peer = useMemo(() => new RTCPeerConnection(), []);

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

  const value = useMemo(() => {
    return {
      peer,
      createOffer,
      createAnswer,
      setRemoteAnswer,
    };
  }, [peer]);

  return <PeerContext.Provider value={value}>{children}</PeerContext.Provider>;
}
