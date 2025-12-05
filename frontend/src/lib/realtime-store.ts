import { create } from 'zustand';

export interface TaskLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error' | 'debug';
  message: string;
  metadata?: any;
}

export interface ActiveTask {
  id: string;
  type: 'scrape' | 'signup';
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  url?: string;
  keywords?: string[];
  startedAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  currentStep?: string;
}

export interface AgentConnection {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy' | 'error';
  currentTask?: ActiveTask;
  lastSeen: Date;
}

interface RealtimeState {
  // WebSocket connection
  connected: boolean;
  
  // Agent connections
  agents: AgentConnection[];
  
  // Active tasks
  activeTasks: ActiveTask[];
  
  // Task logs
  taskLogs: TaskLog[];
  maxLogs: number;
  
  // Task execution modal state
  taskModalOpen: boolean;
  currentTaskId: string | null;
  
  // Actions
  setConnected: (connected: boolean) => void;
  
  updateAgent: (agent: AgentConnection) => void;
  removeAgent: (agentId: string) => void;
  
  addTask: (task: ActiveTask) => void;
  updateTask: (taskId: string, updates: Partial<ActiveTask>) => void;
  removeTask: (taskId: string) => void;
  
  addLog: (log: Omit<TaskLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  
  // Modal controls
  openTaskModal: (taskId: string) => void;
  closeTaskModal: () => void;
  
  // Get current task
  getCurrentTask: () => ActiveTask | undefined;
  
  // Reset all
  reset: () => void;
}

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  connected: false,
  agents: [],
  activeTasks: [],
  taskLogs: [],
  maxLogs: 1000,
  taskModalOpen: false,
  currentTaskId: null,
  
  setConnected: (connected) => set({ connected }),
  
  updateAgent: (agent) =>
    set((state) => {
      const index = state.agents.findIndex((a) => a.id === agent.id);
      if (index >= 0) {
        const agents = [...state.agents];
        agents[index] = { ...agents[index], ...agent };
        return { agents };
      }
      return { agents: [...state.agents, agent] };
    }),
    
  removeAgent: (agentId) =>
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== agentId),
    })),
    
  addTask: (task) =>
    set((state) => {
      // Check if task already exists
      const exists = state.activeTasks.find((t) => t.id === task.id);
      if (exists) {
        return {
          activeTasks: state.activeTasks.map((t) =>
            t.id === task.id ? { ...t, ...task } : t
          ),
          taskModalOpen: true,
          currentTaskId: task.id,
        };
      }
      return {
        activeTasks: [...state.activeTasks, task],
        taskModalOpen: true,
        currentTaskId: task.id,
      };
    }),
    
  updateTask: (taskId, updates) =>
    set((state) => ({
      activeTasks: state.activeTasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    })),
    
  removeTask: (taskId) =>
    set((state) => ({
      activeTasks: state.activeTasks.filter((t) => t.id !== taskId),
      currentTaskId: state.currentTaskId === taskId ? null : state.currentTaskId,
    })),
    
  addLog: (log) =>
    set((state) => {
      const newLog: TaskLog = {
        ...log,
        id: Math.random().toString(36).slice(2),
        timestamp: new Date(),
      };
      const logs = [newLog, ...state.taskLogs].slice(0, state.maxLogs);
      return { taskLogs: logs };
    }),
    
  clearLogs: () => set({ taskLogs: [] }),
  
  openTaskModal: (taskId) => set({ taskModalOpen: true, currentTaskId: taskId }),
  closeTaskModal: () => set({ taskModalOpen: false }),
  
  getCurrentTask: () => {
    const state = get();
    return state.activeTasks.find((t) => t.id === state.currentTaskId);
  },
  
  reset: () => set({
    connected: false,
    agents: [],
    activeTasks: [],
    taskLogs: [],
    taskModalOpen: false,
    currentTaskId: null,
  }),
}));

// Helper to format log level colors
export const logLevelColors: Record<TaskLog['level'], string> = {
  info: 'text-blue-400',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  error: 'text-red-400',
  debug: 'text-gray-500',
};

export const logLevelBg: Record<TaskLog['level'], string> = {
  info: 'bg-blue-500/10',
  success: 'bg-emerald-500/10',
  warning: 'bg-amber-500/10',
  error: 'bg-red-500/10',
  debug: 'bg-gray-500/10',
};

export const logLevelIcons: Record<TaskLog['level'], string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  debug: '🔍',
};
