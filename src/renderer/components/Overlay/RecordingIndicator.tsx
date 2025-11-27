/**
 * Recording Indicator Component
 * 录音状态指示器，显示动态音波
 */

import React from 'react';

interface RecordingIndicatorProps {
  audioLevel: number;
  isRecording: boolean;
}

export const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({ audioLevel, isRecording }) => {
  const bars = 5;

  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {Array.from({ length: bars }).map((_, index) => {
        const delay = index * 0.1;
        const baseHeight = 0.3 + (index === Math.floor(bars / 2) ? 0.2 : 0);
        const dynamicHeight = isRecording ? baseHeight + audioLevel * 0.7 : 0.3;

        return (
          <div
            key={index}
            className="w-1.5 bg-gradient-to-t from-primary to-primary-dark rounded-full transition-all duration-75"
            style={{
              height: `${Math.min(dynamicHeight, 1) * 100}%`,
              animationDelay: `${delay}s`,
              opacity: isRecording ? 1 : 0.5,
            }}
          />
        );
      })}
    </div>
  );
};

