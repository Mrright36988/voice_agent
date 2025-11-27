/**
 * App Store
 * 使用 Zustand 管理全局状态
 */

import { create } from 'zustand';
import type { AppState, TriggerMode, AppConfig } from '../../shared/types';

interface AppStore {
  // 应用状态
  state: AppState;
  setState: (state: AppState) => void;

  // 录音相关
  isRecording: boolean;
  recordingMode: TriggerMode | null;
  recordingDuration: number;
  audioLevel: number;
  setRecording: (isRecording: boolean, mode?: TriggerMode) => void;
  setRecordingDuration: (duration: number) => void;
  setAudioLevel: (level: number) => void;

  // 转录文本
  transcribedText: string;
  setTranscribedText: (text: string) => void;

  // 配置
  config: AppConfig | null;
  setConfig: (config: AppConfig) => void;

  // 重置
  reset: () => void;
}

const initialState = {
  state: { status: 'idle' } as AppState,
  isRecording: false,
  recordingMode: null,
  recordingDuration: 0,
  audioLevel: 0,
  transcribedText: '',
  config: null,
};

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,

  setState: (state) => set({ state }),

  setRecording: (isRecording, mode) =>
    set({
      isRecording,
      recordingMode: isRecording ? mode || null : null,
      recordingDuration: isRecording ? 0 : 0,
      audioLevel: 0,
    }),

  setRecordingDuration: (duration) => set({ recordingDuration: duration }),

  setAudioLevel: (level) => set({ audioLevel: level }),

  setTranscribedText: (text) => set({ transcribedText: text }),

  setConfig: (config) => set({ config }),

  reset: () => set(initialState),
}));

