'use client';

/**
 * useSocket — connects to the Socket.IO server and joins the user's personal
 * room so that real-time events (KYC updates, credit changes, notifications)
 * are received only for the authenticated user.
 *
 * Usage:
 *   const { connected, lastEvent } = useSocket();
 */

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';

export interface SocketEvent {
  type: 'kyc-update' | 'credit-update' | 'payment-due' | 'notification';
  data: Record<string, unknown>;
  receivedAt: number;
}

interface UseSocketReturn {
  connected: boolean;
  lastEvent: SocketEvent | null;
}

export function useSocket(userId: string | number | null | undefined): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SocketEvent | null>(null);

  useEffect(() => {
    // Only connect when we have a userId
    if (!userId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Join personal room so the server can target this user
      socket.emit('join-user', String(userId));
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    const handleEvent = (type: SocketEvent['type']) => (data: Record<string, unknown>) => {
      setLastEvent({ type, data, receivedAt: Date.now() });
    };

    socket.on('kyc-update',    handleEvent('kyc-update'));
    socket.on('credit-update', handleEvent('credit-update'));
    socket.on('payment-due',   handleEvent('payment-due'));
    socket.on('notification',  handleEvent('notification'));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [userId]);

  return { connected, lastEvent };
}
