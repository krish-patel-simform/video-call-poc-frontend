import { useMemo, type PropsWithChildren } from "react";
import { SocketContext } from "../context/SocketContext";
import { io } from "socket.io-client";

export default function Socketprovider({ children }: PropsWithChildren) {
  const socket = useMemo(() => {
    return io(import.meta.env.VITE_SOCKET_URL);
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}
