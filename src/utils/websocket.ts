import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeWebSocket = () => {
  if (!socket) {
    socket = io(window.location.origin, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Connected to market data stream');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from market data stream');
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeWebSocket();
  }
  return socket;
};
