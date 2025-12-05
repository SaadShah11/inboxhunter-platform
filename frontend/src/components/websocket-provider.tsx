'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRealtimeStore } from '@/lib/realtime-store';
import { initializeWebSocket, disconnectWebSocket, isWebSocketConnected } from '@/lib/websocket';

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuthStore();
  const { connected, setConnected } = useRealtimeStore();
  const initializingRef = useRef(false);

  useEffect(() => {
    // Connect to WebSocket when authenticated
    const connect = async () => {
      if (!isAuthenticated() || !token || initializingRef.current) return;
      
      // Already connected
      if (isWebSocketConnected()) return;

      initializingRef.current = true;
      console.log('[WSProvider] Initializing WebSocket connection...');
      
      try {
        const success = await initializeWebSocket(token);
        console.log('[WSProvider] Connection result:', success);
        setConnected(success);
      } catch (error) {
        console.error('[WSProvider] Connection error:', error);
        setConnected(false);
      } finally {
        initializingRef.current = false;
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      // Don't disconnect on component unmount in development
      // as it causes issues with hot reload
    };
  }, [token, isAuthenticated, setConnected]);

  // Reconnect on visibility change (tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isWebSocketConnected() && token) {
        console.log('[WSProvider] Reconnecting on visibility change...');
        initializeWebSocket(token);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [token]);

  return <>{children}</>;
}

// Hook to access WebSocket connection status
export function useWebSocketStatus() {
  const { connected } = useRealtimeStore();
  return { connected };
}

