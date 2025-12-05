import { io, Socket } from 'socket.io-client';
import { useRealtimeStore } from './realtime-store';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export interface TaskLog {
  taskId: string;
  level: string;
  message: string;
  timestamp: Date;
  metadata?: any;
}

export interface TaskProgress {
  taskId: string;
  agentId: string;
  progress: number;
  status: string;
  currentStep?: string;
}

export interface TaskStarted {
  taskId: string;
  agentId: string;
  type: 'scrape' | 'signup';
  url?: string;
  keywords?: string[];
}

export interface TaskCompleted {
  taskId: string;
  agentId: string;
  success: boolean;
  result?: any;
  error?: string;
}

export interface AgentStatus {
  agentId: string;
  status: string;
  currentTask?: string;
}

type EventCallback = (data: any) => void;
const eventListeners: Map<string, Set<EventCallback>> = new Map();

/**
 * Initialize WebSocket connection to dashboard namespace
 */
export function initializeWebSocket(token: string): Promise<boolean> {
  return new Promise((resolve) => {
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 
      process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 
      'http://localhost:3001';

    // Clean up existing socket
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    socket = io(`${baseUrl}/ws/dashboard`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('[WS] Connected to dashboard');
      reconnectAttempts = 0;
      useRealtimeStore.getState().setConnected(true);
      resolve(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
      useRealtimeStore.getState().setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[WS] Connection error:', error.message);
      reconnectAttempts++;
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        resolve(false);
      }
    });

    socket.on('error', (data) => {
      console.error('[WS] Error:', data);
    });

    // Task events
    socket.on('task:log', (data: TaskLog) => {
      const store = useRealtimeStore.getState();
      store.addLog({
        level: data.level as any,
        message: data.message,
      });
      emitToListeners('task:log', data);
    });

    socket.on('task:started', (data: TaskStarted) => {
      const store = useRealtimeStore.getState();
      store.addTask({
        id: data.taskId,
        type: data.type,
        status: 'running',
        url: data.url,
        startedAt: new Date(),
      });
      store.addLog({
        level: 'info',
        message: `Task started: ${data.type}${data.url ? ` - ${data.url}` : ''}`,
      });
      emitToListeners('task:started', data);
    });

    socket.on('task:progress', (data: TaskProgress) => {
      const store = useRealtimeStore.getState();
      store.updateTask(data.taskId, {
        progress: data.progress,
        status: data.status as any,
      });
      if (data.currentStep) {
        store.addLog({
          level: 'info',
          message: data.currentStep,
        });
      }
      emitToListeners('task:progress', data);
    });

    socket.on('task:completed', (data: TaskCompleted) => {
      const store = useRealtimeStore.getState();
      
      // Determine status: stopped/cancelled, success, or failed
      const wasStopped = data.error?.includes('Stopped by user') || (data.result as any)?.stopped;
      let status: 'completed' | 'failed' | 'cancelled' = 'failed';
      let logLevel: 'success' | 'error' | 'warning' = 'error';
      let logMessage = `Task failed: ${data.error || 'Unknown error'}`;
      
      if (wasStopped) {
        status = 'cancelled';
        logLevel = 'warning';
        logMessage = 'Task stopped by user';
      } else if (data.success) {
        status = 'completed';
        logLevel = 'success';
        logMessage = 'Task completed successfully';
      }
      
      store.updateTask(data.taskId, {
        status,
        completedAt: new Date(),
        result: data.result,
        error: data.error,
      });
      
      store.addLog({
        level: logLevel,
        message: logMessage,
      });
      
      emitToListeners('task:completed', data);
      
      // Auto-remove completed task from store after 30 seconds if modal is closed
      setTimeout(() => {
        const currentStore = useRealtimeStore.getState();
        const task = currentStore.activeTasks.find(t => t.id === data.taskId);
        // Only remove if task is still in completed/failed state and modal is not showing it
        if (task && task.status !== 'running' && currentStore.currentTaskId !== data.taskId) {
          currentStore.removeTask(data.taskId);
        }
      }, 30000);
    });

    socket.on('agent:status', (data: AgentStatus) => {
      const store = useRealtimeStore.getState();
      store.updateAgent({
        id: data.agentId,
        name: data.agentId, // Will be updated with proper name
        status: data.status as any,
        lastSeen: new Date(),
        currentTask: data.currentTask ? {
          id: data.currentTask,
          type: 'signup',
          status: 'running',
          startedAt: new Date(),
        } : undefined,
      });
      emitToListeners('agent:status', data);
    });

    socket.on('scrape:complete', (data) => {
      const store = useRealtimeStore.getState();
      store.addLog({
        level: 'success',
        message: `Scrape complete: ${data.created} new links saved (${data.duplicates} duplicates)`,
      });
      emitToListeners('scrape:complete', data);
    });

    // Set timeout for initial connection
    setTimeout(() => {
      if (!socket?.connected) {
        resolve(false);
      }
    }, 10000);
  });
}

/**
 * Disconnect WebSocket
 */
export function disconnectWebSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    useRealtimeStore.getState().setConnected(false);
  }
}

/**
 * Check if WebSocket is connected
 */
export function isWebSocketConnected(): boolean {
  return socket?.connected || false;
}

/**
 * Send stop task command
 */
export function sendStopTask(taskId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      console.warn('[WS] Cannot send stop command - not connected');
      resolve(false);
      return;
    }
    
    console.log('[WS] Sending stop command for task:', taskId);
    
    // Set timeout in case server doesn't respond
    const timeout = setTimeout(() => {
      console.warn('[WS] Stop command timed out');
      resolve(false);
    }, 5000);
    
    socket.emit('task:stop', { taskId }, (response: any) => {
      clearTimeout(timeout);
      console.log('[WS] Stop command response:', response);
      resolve(response?.success || false);
    });
  });
}

/**
 * Send cancel task command
 */
export function sendCancelTask(taskId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      console.warn('[WS] Cannot send cancel command - not connected');
      resolve(false);
      return;
    }
    
    console.log('[WS] Sending cancel command for task:', taskId);
    
    // Set timeout in case server doesn't respond
    const timeout = setTimeout(() => {
      console.warn('[WS] Cancel command timed out');
      resolve(false);
    }, 5000);
    
    socket.emit('task:cancel', { taskId }, (response: any) => {
      clearTimeout(timeout);
      console.log('[WS] Cancel command response:', response);
      resolve(response?.success || false);
    });
  });
}

/**
 * Add event listener
 */
export function addWebSocketListener(event: string, callback: EventCallback) {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event)!.add(callback);
}

/**
 * Remove event listener
 */
export function removeWebSocketListener(event: string, callback: EventCallback) {
  eventListeners.get(event)?.delete(callback);
}

/**
 * Emit to registered listeners
 */
function emitToListeners(event: string, data: any) {
  eventListeners.get(event)?.forEach((callback) => {
    try {
      callback(data);
    } catch (e) {
      console.error(`[WS] Error in listener for ${event}:`, e);
    }
  });
}

/**
 * Get socket instance (for debugging)
 */
export function getSocket(): Socket | null {
  return socket;
}

