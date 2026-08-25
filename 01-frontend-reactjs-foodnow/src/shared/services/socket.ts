import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000/realtime';

let socket: Socket | null = null;

/** One Socket.IO instance app-wide, created by SocketProvider on login. */
export function connectSocket(accessToken: string): Socket {
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    autoConnect: true,
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
