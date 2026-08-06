import { useContext } from "react";
import { PeerContext } from "../context/PeerContext";

export function usePeer() {
  const context = useContext(PeerContext);

  if (!context) throw new Error("No Peer Context is found");

  return context;
}
