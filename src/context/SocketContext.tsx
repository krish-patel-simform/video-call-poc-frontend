import { createContext } from "react";
import type { Socket } from "socket.io-client";

type SocketContextType = {
  socket: Socket;
};

export const SocketContext = createContext<SocketContextType | null>(null);
