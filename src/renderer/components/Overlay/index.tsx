/**
 * Overlay Component
 * 主悬浮窗组件
 */

import React from 'react';
import type { AppState } from '../../../shared/types';
import { RecordingIndicator } from './RecordingIndicator';
import { StatusBar } from './StatusBar';
import { TranscriptDisplay } from './TranscriptDisplay';

interface OverlayProps {
  state: AppState;
  audioLevel: number;
}

export const Overlay: React.FC<OverlayProps> = ({ state, audioLevel }) => {
  const getStatusString = (): string => {
    return state.status;
  };

  const getMode = () => {
    if (state.status === 'recording' || state.status === 'transcribing') {
      return state.mode;
    }
    return null;
  };

  const getDuration = (): number => {
    if (state.status === 'recording') {
      return state.duration;
    }
    return 0;
  };

  const getText = (): string => {
    switch (state.status) {
      case 'thinking':
        return state.text;
      case 'done':
        return state.result;
      case 'error':
        return state.message;
      case 'executing':
        return `正在执行 ${state.tool}...`;
      case 'recording':
        return '正在听...';
      case 'transcribing':
        return '正在识别...';
      default:
        return '';
    }
  };

  // idle 状态不显示
  if (state.status === 'idle') {
    return null;
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div
        className="w-80 rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
        style={{
          background: 'var(--color-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* 状态栏 */}
        <StatusBar mode={getMode()} duration={getDuration()} status={getStatusString()} />

        {/* 录音指示器 */}
        {state.status === 'recording' && (
          <div className="py-4">
            <RecordingIndicator audioLevel={audioLevel} isRecording={true} />
          </div>
        )}

        {/* 文本显示 */}
        {(state.status === 'thinking' ||
          state.status === 'executing' ||
          state.status === 'done' ||
          state.status === 'error') && (
          <TranscriptDisplay
            text={getText()}
            status={state.status}
            toolName={state.status === 'executing' ? state.tool : undefined}
            step={state.status === 'executing' ? state.step : undefined}
            total={state.status === 'executing' ? state.total : undefined}
          />
        )}

        {/* 转录中 */}
        {state.status === 'transcribing' && (
          <div className="py-6 flex flex-col items-center gap-3">
            <svg className="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-gray-400">识别中...</span>
          </div>
        )}

        {/* 底部提示 */}
        <div className="px-4 py-2 text-center text-xs text-gray-500 border-t border-white/5">
          {state.status === 'recording' ? '松开结束录音' : 'Voice Agent'}
        </div>
      </div>
    </div>
  );
};

