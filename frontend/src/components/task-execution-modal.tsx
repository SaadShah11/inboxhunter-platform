'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import {
  X,
  Loader2,
  StopCircle,
  XCircle,
  CheckCircle2,
  Clock,
  Terminal,
  Trash2,
  Maximize2,
  Minimize2,
  Download,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealtimeStore, logLevelColors, logLevelBg, TaskLog } from '@/lib/realtime-store';
import { sendStopTask, sendCancelTask } from '@/lib/websocket';
import { Button } from './ui/button';

export function TaskExecutionModal() {
  const {
    taskModalOpen,
    closeTaskModal,
    currentTaskId,
    activeTasks,
    taskLogs,
    clearLogs,
    removeTask,
    addLog,
    updateTask,
  } = useRealtimeStore();

  const [stopping, setStopping] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const currentTask = activeTasks.find((t) => t.id === currentTaskId);
  const isRunning = currentTask?.status === 'running';

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [taskLogs, autoScroll]);

  // Handle manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!logsContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  // Reset stopping/cancelling state when task changes status
  useEffect(() => {
    if (!isRunning) {
      setStopping(false);
      setCancelling(false);
    }
  }, [isRunning]);

  const handleStop = async () => {
    if (!currentTaskId || stopping) return;
    setStopping(true);
    addLog({ level: 'warning', message: 'Sending stop command to agent...' });
    
    // Immediately update task status to cancelled (optimistic update)
    console.log('[TaskModal] Updating task status to cancelled:', currentTaskId);
    updateTask(currentTaskId, { status: 'cancelled', completedAt: new Date() });
    
    // Also remove the task from active tasks to ensure indicator hides
    setTimeout(() => {
      console.log('[TaskModal] Removing task from active tasks:', currentTaskId);
      removeTask(currentTaskId);
    }, 100);
    
    const result = await sendStopTask(currentTaskId);
    if (result) {
      addLog({ level: 'info', message: 'Stop command sent - agent stopping' });
    } else {
      addLog({ level: 'warning', message: 'Stop command sent (no confirmation received)' });
    }
    setStopping(false);
  };

  const handleCancel = async () => {
    if (!currentTaskId || cancelling) return;
    setCancelling(true);
    addLog({ level: 'warning', message: 'Sending cancel command to agent...' });
    
    // Immediately update task status to cancelled (optimistic update)
    console.log('[TaskModal] Updating task status to cancelled:', currentTaskId);
    updateTask(currentTaskId, { status: 'cancelled', completedAt: new Date() });
    
    // Also remove the task from active tasks to ensure indicator hides
    setTimeout(() => {
      console.log('[TaskModal] Removing task from active tasks:', currentTaskId);
      removeTask(currentTaskId);
    }, 100);
    
    const result = await sendCancelTask(currentTaskId);
    if (result) {
      addLog({ level: 'info', message: 'Cancel command sent - stopping immediately' });
    } else {
      addLog({ level: 'warning', message: 'Cancel command sent (no confirmation received)' });
    }
    setCancelling(false);
  };

  const handleDownloadLogs = () => {
    const logText = taskLogs
      .slice()
      .reverse()
      .map((log) => `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-logs-${currentTaskId || 'all'}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLogs = () => {
    const logText = taskLogs
      .slice()
      .reverse()
      .map((log) => `[${log.level.toUpperCase()}] ${log.message}`)
      .join('\n');
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    closeTaskModal();
    // Clean up task from store if it exists and is not running
    if (currentTask && currentTask.status !== 'running') {
      setTimeout(() => {
        // Check if task still exists before removing
        const store = useRealtimeStore.getState();
        const taskExists = store.activeTasks.find(t => t.id === currentTask.id);
        if (taskExists) {
          removeTask(currentTask.id);
        }
      }, 500);
    }
  };

  const getElapsedTime = () => {
    if (!currentTask?.startedAt) return '0s';
    const start = new Date(currentTask.startedAt).getTime();
    const end = currentTask?.completedAt ? new Date(currentTask.completedAt).getTime() : Date.now();
    const diff = end - start;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusConfig = () => {
    if (!currentTask)
      return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', label: 'Unknown' };

    switch (currentTask.status) {
      case 'running':
        return {
          icon: Loader2,
          color: 'text-indigo-500',
          bg: 'bg-indigo-100 dark:bg-indigo-900/30',
          label: 'Running',
          spin: true,
        };
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-500',
          bg: 'bg-emerald-100 dark:bg-emerald-900/30',
          label: 'Completed',
        };
      case 'failed':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Failed' };
      case 'cancelled':
        return {
          icon: StopCircle,
          color: 'text-amber-500',
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          label: 'Cancelled',
        };
      default:
        return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', label: 'Unknown' };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  if (!taskModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative z-10 w-[95vw] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800',
          'flex flex-col animate-in fade-in zoom-in-95 duration-200',
          expanded ? 'max-w-5xl max-h-[85vh]' : 'max-w-3xl max-h-[75vh]'
        )}
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl', statusConfig.bg)}>
              <StatusIcon className={cn('w-5 h-5', statusConfig.color, statusConfig.spin && 'animate-spin')} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {currentTask?.type === 'scrape' ? 'Scraping Meta Ads' : 'Running Signup'}
              </h2>
              <p className="text-sm text-gray-500">
                {statusConfig.label} • {getElapsedTime()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? (
                <Minimize2 className="w-4 h-4 text-gray-400" />
              ) : (
                <Maximize2 className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Task Info - Fixed */}
        {currentTask && (currentTask.url || (currentTask.keywords && currentTask.keywords.length > 0)) && (
          <div className="flex-shrink-0 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {currentTask.url && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a
                    href={currentTask.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-md"
                    title={currentTask.url}
                  >
                    {currentTask.url}
                  </a>
                </div>
              )}
              {currentTask.keywords && currentTask.keywords.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Keywords:</span>
                  <span className="text-gray-700 dark:text-gray-300">{currentTask.keywords.join(', ')}</span>
                </div>
              )}
              {currentTask.currentStep && (
                <div className="text-gray-500 ml-auto">Step: {currentTask.currentStep}</div>
              )}
            </div>
          </div>
        )}

        {/* Logs Section - Scrollable */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Logs Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-gray-950 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-gray-300">Console Output</span>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                {taskLogs.length} logs
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                  autoScroll
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-gray-800 text-gray-500 hover:bg-gray-700 border border-gray-700'
                )}
              >
                {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
              </button>
              <button
                onClick={handleCopyLogs}
                className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-gray-300"
                title="Copy logs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleDownloadLogs}
                className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-gray-300"
                title="Download logs"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={clearLogs}
                className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-gray-300"
                title="Clear logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Logs Content */}
          <div
            ref={logsContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overflow-x-auto bg-gray-950 font-mono text-[13px] leading-relaxed p-4"
          >
            {taskLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 min-h-[200px]">
                <Terminal className="w-8 h-8 text-gray-600" />
                <p>Waiting for logs...</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {taskLogs
                  .slice()
                  .reverse()
                  .map((log) => (
                    <LogEntry key={log.id} log={log} />
                  ))}
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-2xl">
          <div className="text-sm text-gray-500">
            {isRunning ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Agent is processing...
              </span>
            ) : currentTask?.status === 'completed' ? (
              <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Task completed successfully
              </span>
            ) : currentTask?.status === 'failed' ? (
              <span className="flex items-center gap-2 text-red-500">
                <XCircle className="w-4 h-4" />
                {currentTask.error || 'Task failed'}
              </span>
            ) : currentTask?.status === 'cancelled' ? (
              <span className="flex items-center gap-2 text-amber-500">
                <StopCircle className="w-4 h-4" />
                Task cancelled
              </span>
            ) : (
              'Task finished'
            )}
          </div>
          <div className="flex items-center gap-3">
            {isRunning && (
              <>
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  loading={cancelling}
                  disabled={stopping}
                  icon={<XCircle className="w-4 h-4" />}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleStop}
                  loading={stopping}
                  disabled={cancelling}
                  icon={<StopCircle className="w-4 h-4" />}
                >
                  Stop Now
                </Button>
              </>
            )}
            {!isRunning && <Button onClick={handleClose}>Close</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function LogEntry({ log }: { log: TaskLog }) {
  const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });

  return (
    <div className="flex items-start gap-3 hover:bg-gray-900/50 px-2 py-1 rounded group">
      <span className="text-gray-600 flex-shrink-0 text-xs font-mono">{time}</span>
      <span
        className={cn(
          'px-1.5 py-0.5 rounded text-xs font-semibold uppercase flex-shrink-0 min-w-[44px] text-center',
          logLevelBg[log.level],
          logLevelColors[log.level]
        )}
      >
        {log.level}
      </span>
      <span className="text-gray-200 whitespace-pre-wrap break-words flex-1">{log.message}</span>
    </div>
  );
}

// Compact status indicator for pages - only shows when task is running
export function TaskStatusIndicator() {
  // Subscribe to relevant store state - force re-render when activeTasks changes
  const activeTasks = useRealtimeStore((state) => state.activeTasks);
  const taskModalOpen = useRealtimeStore((state) => state.taskModalOpen);
  const openTaskModal = useRealtimeStore((state) => state.openTaskModal);

  // Compute running tasks
  const runningTask = useMemo(() => {
    const running = activeTasks.filter((t) => t.status === 'running');
    return running.length > 0 ? running[0] : null;
  }, [activeTasks]);

  // Don't render anything if no running tasks or modal is open
  if (!runningTask || taskModalOpen) {
    return null;
  }

  return (
    <button
      onClick={() => openTaskModal(runningTask.id)}
      className={cn(
        'fixed bottom-6 right-6 z-40 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all',
        'bg-white dark:bg-gray-900 border-indigo-200 dark:border-indigo-800',
        'hover:shadow-xl hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-300'
      )}
    >
      <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
      <div className="text-left">
        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{runningTask.type} in progress</p>
        <p className="text-xs text-gray-500">Processing...</p>
      </div>
    </button>
  );
}
