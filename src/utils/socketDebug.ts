import { getChatSocket } from '@services/chatSocket';

/**
 * Debug utility to test socket connection and events.
 * Run this in browser console to verify socket is working:
 * 
 * import { testSocketConnection } from '@utils/socketDebug'
 * testSocketConnection()
 */

export function testSocketConnection() {
  const socket = getChatSocket();
  
  console.log('🔍 Socket Connection Test');
  console.log('='.repeat(50));
  console.log('Socket ID:', socket.id);
  console.log('Connected:', socket.connected);
  console.log('Active:', socket.active);
  console.log('Rooms:', Array.from((socket as any).rooms || []));
  console.log('='.repeat(50));
  
  // Test emit
  console.log('📤 Testing emit...');
  socket.emit('ping', { timestamp: Date.now() });
  
  // Listen for pong (if backend implements it)
  socket.once('pong', (data: any) => {
    console.log('✅ Received pong:', data);
  });
  
  // Listen for any newMessage event
  const testListener = (data: any) => {
    console.log('📨 TEST LISTENER - Received newMessage:', data);
  };
  socket.on('newMessage', testListener);
  
  console.log('✅ Test listener attached. Send a message to see if it triggers.');
  console.log('To remove listener, run: socket.off("newMessage", testListener)');
  
  return socket;
}

/**
 * Check what rooms the socket is currently in
 */
export function checkSocketRooms() {
  const socket = getChatSocket();
  const rooms = Array.from((socket as any).rooms || []);
  
  console.log('🏠 Current Socket Rooms:', rooms);
  return rooms;
}

/**
 * Force socket reconnect
 */
export function reconnectSocket() {
  const socket = getChatSocket();
  console.log('🔄 Forcing socket reconnect...');
  
  socket.disconnect();
  setTimeout(() => {
    socket.connect();
    console.log('✅ Socket reconnected, new ID:', socket.id);
  }, 1000);
}

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).socketDebug = {
    test: testSocketConnection,
    rooms: checkSocketRooms,
    reconnect: reconnectSocket,
  };
  
  console.log('🔧 Socket Debug Tools loaded!');
  console.log('Usage:');
  console.log('  window.socketDebug.test()      - Test socket connection');
  console.log('  window.socketDebug.rooms()     - Check current rooms');
  console.log('  window.socketDebug.reconnect() - Force reconnect');
}
