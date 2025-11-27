/**
 * Status Bar Component
 * 状态栏，显示当前状态和模式
 */

import React from 'react';
import type { TriggerMode } from '../../../shared/types';

interface StatusBarProps {
  mode: TriggerMode | null;
  duration: number;
  status: string;
}

const modeLabels: Record<TriggerMode, string> = {
  dictation: '听写模式',
  command: '指令模式',
  agent: 'Agent 模式',
};

const statusLabels: Record<string, string> = {
  idle: '就绪',
  recording: '录音中',
  transcribing: '识别中',
  thinking: '思考中',
  executing: '执行中',
  done: '完成',
  error: '错误',
};

export const StatusBar: React.FC<StatusBarProps> = ({ mode, duration, status }) => {
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 text-sm">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            status === 'recording'
              ? 'bg-red-500 animate-pulse'
              : status === 'error'
                ? 'bg-red-500'
                : status === 'done'
                  ? 'bg-green-500'
                  : 'bg-primary'
          }`}
        />
        <span className="text-gray-300">{statusLabels[status] || status}</span>
      </div>

      <div className="flex items-center gap-4">
        {mode && <span className="text-gray-400">{modeLabels[mode]}</span>}
        {status === 'recording' && <span className="text-gray-400 font-mono">{formatDuration(duration)}</span>}
      </div>
    </div>
  );
};

