import { createContext, useContext, useEffect, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '@/shared/stores/auth.store';
import { connectSocket, disconnectSocket } from '@/shared/services/socket';

const SocketContext = createContext<Socket | null>(null);

/**
 * One Socket.IO instance app-wide, mounted under the auth store since the
 * handshake requires an access token. Feature hooks read it via useSocket().
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) {
      disconnectSocket();
      return;
    }
    const socket = connectSocket(accessToken);
    return () => {
      socket.disconnect();
    };
  }, [accessToken]);

  const socket = accessToken ? connectSocket(accessToken) : null;

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- provider + its accessor hook are co-located by design (ARCHITECTURE-FRONTEND.md)
export function useSocket(): Socket | null {
  return useContext(SocketContext);
}
