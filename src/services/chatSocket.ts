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

  if (socket && socket.connected) {
    console.log('✅ Reusing existing socket connection');
    return socket;
  }

  // Recreate if token changed or socket was torn down.
  if (socket) {
    console.log('🔄 Disconnecting old socket');
    socket.disconnect();
    socket = null;
  }

  console.log('🔌 Creating new socket connection to:', `${SOCKET_ORIGIN}/chat`);

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

  // Debug connection events
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('🔥 Socket connection error:', error);
  });

  return socket;
}

/** Emit a message over the socket. The server persists + broadcasts it. */
export function emitSendMessage(conversationId: string, text: string): void {
  const socket = getChatSocket();
  console.log('📤 Emitting sendMessage:', { 
    conversationId, 
    text: text.substring(0, 50), 
    connected: socket.connected,
    socketId: socket.id 
  });
  
  if (!socket.connected) {
    console.warn('⚠️ Socket not connected, attempting to connect...');
    socket.connect();
    // Wait for connection before emitting
    socket.once('connect', () => {
      console.log('✅ Connected, now emitting...');
      socket.emit('sendMessage', { conversationId, text });
    });
  } else {
    socket.emit('sendMessage', { conversationId, text });
  }
  
  // Add timeout to detect if we never receive the echo back
  const timeoutId = setTimeout(() => {
    console.warn('⏰ No echo received after 3 seconds - possible issue');
  }, 3000);
  
  // Clear timeout when we receive any newMessage (assuming it's our echo)
  socket.once('newMessage', () => {
    clearTimeout(timeoutId);
  });
}

/** Subscribe to inbound messages. Returns an unsubscribe function. */
export function onNewMessage(handler: (msg: NewMessageEvent) => void): () => void {
  const s = getChatSocket();
  
  // Wrap handler to ensure it's always attached
  const wrappedHandler = (msg: NewMessageEvent) => {
    console.log('🎯 newMessage event received by socket:', msg);
    // Execute handler immediately in try-catch to prevent cleanup from killing it
    try {
      handler(msg);
    } catch (err) {
      console.error('❌ Error in newMessage handler:', err);
    }
  };
  
  s.on('newMessage', wrappedHandler);
  console.log('📡 newMessage listener attached to socket:', s.id);
  
  // Re-attach on reconnect
  const reconnectHandler = () => {
    console.log('♻️ Socket reconnected, re-attaching newMessage listener');
    s.off('newMessage', wrappedHandler);
    s.on('newMessage', wrappedHandler);
  };
  
  s.on('connect', reconnectHandler);
  
  return () => {
    console.log('🧹 Cleaning up newMessage listener from socket:', s.id);
    s.off('newMessage', wrappedHandler);
    s.off('connect', reconnectHandler);
  };
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
