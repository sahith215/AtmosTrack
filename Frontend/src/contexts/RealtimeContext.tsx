import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { LiveReading } from '../types/LiveReading';
import { io, Socket } from 'socket.io-client';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

type RealtimeContextValue = {
  latestReading: LiveReading | null;
  status: ConnectionStatus;
};

const RealtimeContext = createContext<RealtimeContextValue | undefined>(
  undefined,
);

// Socket.IO backend URL
const IO_URL = 'http://localhost:5000';
const MAX_RETRIES = 5;

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [latestReading, setLatestReading] = useState<LiveReading | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const socketRef = useRef<Socket | null>(null);
  const retryCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const connect = () => {
    setStatus('connecting');

    const socket = io(IO_URL, {
      transports: ['websocket', 'polling'],
      reconnection: false, // we’ll do our own backoff
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('connected');
      retryCountRef.current = 0;
      clearReconnectTimeout();
    });

    socket.on('sensorUpdate', (data: any) => {
  console.log('RAW sensorUpdate payload', data);
  if (data && typeof data.deviceId === 'string' && data.timestamp) {
    setLatestReading(data as LiveReading);
  }
});


    socket.on('connect_error', () => {
      setStatus('error');
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
      socketRef.current = null;

      if (retryCountRef.current < MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, retryCountRef.current);
        retryCountRef.current += 1;

        clearReconnectTimeout();
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, delay);
      }
    });
  };

  useEffect(() => {
    connect();

    return () => {
      clearReconnectTimeout();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <RealtimeContext.Provider value={{ latestReading, status }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return ctx;
};
