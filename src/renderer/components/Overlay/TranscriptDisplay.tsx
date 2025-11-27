/**
 * Transcript Display Component
 * 显示转录文本和执行结果
 */

import React from 'react';

interface TranscriptDisplayProps {
  text: string;
  status: 'thinking' | 'executing' | 'done' | 'error';
  toolName?: string;
  step?: number;
  total?: number;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ text, status, toolName, step, total }) => {
  return (
    <div className="px-4 py-3 animate-fade-in">
      {/* 文本显示 */}
      <div className="text-center text-white text-lg leading-relaxed">{text}</div>

      {/* 执行进度 */}
      {status === 'executing' && toolName && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-400">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>
            执行 {toolName} ({step}/{total})
          </span>
        </div>
      )}

      {/* 思考中 */}
      {status === 'thinking' && (
        <div className="mt-3 flex items-center justify-center gap-1">
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}

      {/* 完成 */}
      {status === 'done' && (
        <div className="mt-3 flex items-center justify-center text-green-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* 错误 */}
      {status === 'error' && (
        <div className="mt-3 flex items-center justify-center text-red-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}
    </div>
  );
};

