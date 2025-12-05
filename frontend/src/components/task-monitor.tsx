'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react';
import {
  Activity,
  XCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Terminal,
  Trash2,
  StopCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealtimeStore, logLevelColors, logLevelBg, TaskLog, ActiveTask } from '@/lib/realtime-store';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface TaskMonitorProps {
  onStopTask?: (taskId: string) => void;
  className?: string;
}

export function TaskMonitor({ onStopTask, className }: TaskMonitorProps) {
  const { activeTasks, taskLogs, clearLogs } = useRealtimeStore();
  const [expanded, setExpanded] = React.useState(true);
  const [autoScroll, setAutoScroll] = React.useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [taskLogs, autoScroll]);

  const runningTasks = activeTasks.filter((t) => t.status === 'running');
  const hasActivity = runningTasks.length > 0 || taskLogs.length > 0;

  if (!hasActivity) {
    return null;
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="w-5 h-5 text-indigo-500" />
            {runningTasks.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Task Monitor</h3>
            <p className="text-xs text-gray-500">
              {runningTasks.length} active • {taskLogs.length} logs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {taskLogs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearLogs();
              }}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Clear
            </Button>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <>
          {/* Active Tasks */}
          {runningTasks.length > 0 && (
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
              {runningTasks.map((task) => (
                <TaskCard key={task.id} task={task} onStop={onStopTask} />
              ))}
            </div>
          )}

          {/* Logs */}
          <div className="relative">
            <div className="max-h-64 overflow-y-auto p-4 space-y-1 bg-gray-900 font-mono text-sm">
              {taskLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No logs yet...</p>
              ) : (
                taskLogs
                  .slice()
                  .reverse()
                  .map((log) => <LogEntry key={log.id} log={log} />)
              )}
              <div ref={logsEndRef} />
            </div>
            
            {/* Auto-scroll toggle */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={cn(
                'absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-medium transition-colors',
                autoScroll
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              )}
            >
              {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

function TaskCard({ task, onStop }: { task: ActiveTask; onStop?: (id: string) => void }) {
  const elapsed = React.useMemo(() => {
    const diff = Date.now() - new Date(task.startedAt).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }, [task.startedAt]);

  return (
    <div className="flex items-center gap-4 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
      <div className="relative">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white capitalize">
            {task.type}
          </span>
          <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full">
            Running
          </span>
        </div>
        {task.url && (
          <p className="text-sm text-gray-500 truncate flex items-center gap-1">
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            {task.url}
          </p>
        )}
        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {elapsed}
          </span>
          {task.progress !== undefined && (
            <span>{task.progress}% complete</span>
          )}
        </div>
      </div>
      {onStop && (
        <Button
          variant="danger"
          size="sm"
          onClick={() => onStop(task.id)}
          icon={<StopCircle className="w-4 h-4" />}
        >
          Stop
        </Button>
      )}
    </div>
  );
}

function LogEntry({ log }: { log: TaskLog }) {
  const time = new Date(log.timestamp).toLocaleTimeString();
  
  return (
    <div className="flex items-start gap-2 hover:bg-gray-800/50 px-2 py-0.5 rounded">
      <span className="text-gray-500 flex-shrink-0">{time}</span>
      <span
        className={cn(
          'px-1.5 py-0.5 rounded text-xs font-medium uppercase flex-shrink-0',
          logLevelBg[log.level],
          logLevelColors[log.level]
        )}
      >
        {log.level}
      </span>
      <span className="text-gray-300 break-all">{log.message}</span>
    </div>
  );
}

// Mini version for sidebar/header
export function TaskStatusBadge() {
  const { activeTasks } = useRealtimeStore();
  const runningCount = activeTasks.filter((t) => t.status === 'running').length;

  if (runningCount === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
      <Loader2 className="w-4 h-4 animate-spin" />
      {runningCount} task{runningCount > 1 ? 's' : ''} running
    </div>
  );
}

