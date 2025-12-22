'use client';

import { ScheduledTask, TaskStatus } from '@/types/command-center';
import { Clock, CheckCircle, XCircle, AlertTriangle, Play, Pause, HelpCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ScheduledTasksProps {
  tasks: ScheduledTask[];
  onTaskClick?: (task: ScheduledTask) => void;
  onToggleTask?: (taskId: string, enabled: boolean) => void;
}

const statusConfig: Record<TaskStatus, { icon: React.ReactNode; color: string }> = {
  success: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-500' },
  failed: { icon: <XCircle className="w-4 h-4" />, color: 'text-red-500' },
  partial: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-yellow-500' },
  running: { icon: <Play className="w-4 h-4" />, color: 'text-blue-500' },
  pending: { icon: <Clock className="w-4 h-4" />, color: 'text-gray-400' },
  unknown: { icon: <HelpCircle className="w-4 h-4" />, color: 'text-orange-400' }, // HONEST: no live status API
};

export function ScheduledTasks({ tasks, onTaskClick, onToggleTask }: ScheduledTasksProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Scheduled Tasks</h2>
        <span className="text-sm text-gray-500">
          {tasks.filter((t) => t.enabled).length}/{tasks.length} active
        </span>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const nextRunTime = new Date(task.nextRun);
          const timeUntilNext = formatDistanceToNow(nextRunTime);
          const lastStatus = task.lastStatus ? statusConfig[task.lastStatus] : null;

          return (
            <div
              key={task.id}
              onClick={() => onTaskClick?.(task)}
              className={`
                flex items-center gap-4 p-3 rounded-lg border cursor-pointer
                transition-all hover:shadow-sm
                ${task.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}
              `}
            >
              {/* Clock Icon */}
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-gray-600" />
              </div>

              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{task.name}</h4>
                  {!task.enabled && (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-600">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{task.schedule}</p>
              </div>

              {/* Next Run */}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {task.enabled ? `Next: ${timeUntilNext}` : 'Paused'}
                </p>
                {task.lastRun && task.lastStatus && lastStatus && (
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <span className={lastStatus.color}>{lastStatus.icon}</span>
                    <span className="text-xs text-gray-500">
                      {task.lastStatus === 'success' ? 'Success' :
                       task.lastStatus === 'failed' ? 'Failed' :
                       task.lastStatus === 'partial' ? 'Partial' :
                       task.lastStatus === 'unknown' ? 'No data' : task.lastStatus}
                    </span>
                  </div>
                )}
              </div>

              {/* Toggle Button */}
              {onToggleTask && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTask(task.id, !task.enabled);
                  }}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    transition-colors
                    ${task.enabled
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}
                  `}
                >
                  {task.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
