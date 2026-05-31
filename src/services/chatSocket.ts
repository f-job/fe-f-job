import { io, type Socket } from 'socket.io-client';
import type { ChatMessage } from '@/types/api';
import { SOCKET_ORIGIN } from '@/config/env';

/**
 * Socket.io client for the backend `/chat` namespace.
 *
 * The gateway authenticates the connection from `handshake.auth.token`
 * (falling back to the Authorization header). It listens for the
 * `sendMessage` event and broadcasts `newMessage` to the recipient's and
 * sender's personal rooms. Auth/transport failures arrive as `exception`.
 *
 * Wire format of the `newMessage` event (see ChatGateway.handleSendMessage):
 *   { conversationId: string; message: <persisted message document> }
 */

export interface NewMessageEvent {
  conversationId: string;
  message: ChatMessage;
}

export interface SocketException {
  errorCode: string;
  message: string;
}

let socket: Socket | null = null;

/** Lazily create (or reuse) the singleton chat socket using the stored JWT. */
export function getChatSocket(): Socket {
  const token = localStorage.getItem('accessToken') ?? '';

  if (socket && socket.connected) return socket;

  // Recreate if token changed or socket was torn down.
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  // When SOCKET_ORIGIN is empty (local dev) this resolves to the namespace
  // `/chat` on the current origin (handled by the Vite proxy). In production
  // it becomes `https://<backend>/chat`.
  socket = io(`${SOCKET_ORIGIN}/chat`, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token },
    autoConnect: true,
    reconnection: true,
  });

  return socket;
}

/** Emit a message over the socket. The server persists + broadcasts it. */
export function emitSendMessage(conversationId: string, text: string): void {
  getChatSocket().emit('sendMessage', { conversationId, text });
}

/** Subscribe to inbound messages. Returns an unsubscribe function. */
export function onNewMessage(handler: (msg: NewMessageEvent) => void): () => void {
  const s = getChatSocket();
  s.on('newMessage', handler);
  return () => s.off('newMessage', handler);
}

/** Subscribe to gateway exceptions. Returns an unsubscribe function. */
export function onSocketException(handler: (err: SocketException) => void): () => void {
  const s = getChatSocket();
  s.on('exception', handler);
  return () => s.off('exception', handler);
}

/** Tear down the socket (e.g. on logout). */
export function disconnectChatSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
