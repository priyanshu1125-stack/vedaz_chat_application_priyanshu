import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

export function useSocket(identity) {
  const socketRef = useRef(null);
  const identityRef = useRef(identity);
  const handlersRef = useRef(new Map());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  identityRef.current = identity;

  const attachHandlers = useCallback((socket) => {
    handlersRef.current.forEach((handlers, event) => {
      handlers.forEach((handler) => socket.on(event, handler));
    });
  }, []);

  useEffect(() => {
    if (!identity) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;
    attachHandlers(socket);

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
      const current = identityRef.current;
      if (current) {
        socket.emit('user:join', {
          senderId: current.senderId,
          senderName: current.senderName,
        });
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      setError(err.message || 'Connection failed');
    });

    socket.on('error', ({ message }) => {
      setError(message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [identity?.senderId, attachHandlers]);

  const emit = useCallback((event, payload) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, payload);
      return true;
    }
    return false;
  }, []);

  const on = useCallback((event, handler) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event).add(handler);

    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }

    return () => {
      handlersRef.current.get(event)?.delete(handler);
      socketRef.current?.off(event, handler);
    };
  }, []);

  return { connected, error, emit, on };
}
