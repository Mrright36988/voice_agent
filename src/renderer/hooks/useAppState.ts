/**
 * App State Hook
 * 管理应用全局状态
 */

import { useEffect, useState, useCallback } from 'react';
import type { AppState, TriggerMode } from '../../shared/types';

export function useAppState() {
  const [state, setState] = useState<AppState>({ status: 'idle' });

  // 监听状态更新
  useEffect(() => {
    const cleanup = window.voiceAgent.onStateUpdate((newState) => {
      setState(newState);
    });

    return cleanup;
  }, []);

  // 更新状态的便捷方法
  const setRecording = useCallback((mode: TriggerMode, duration: number = 0) => {
    setState({ status: 'recording', mode, duration });
  }, []);

  const setTranscribing = useCallback((mode: TriggerMode) => {
    setState({ status: 'transcribing', mode });
  }, []);

  const setThinking = useCallback((text: string) => {
    setState({ status: 'thinking', text });
  }, []);

  const setExecuting = useCallback((tool: string, step: number, total: number) => {
    setState({ status: 'executing', tool, step, total });
  }, []);

  const setDone = useCallback((result: string) => {
    setState({ status: 'done', result });
  }, []);

  const setError = useCallback((message: string) => {
    setState({ status: 'error', message });
  }, []);

  const setIdle = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return {
    state,
    setState,
    setRecording,
    setTranscribing,
    setThinking,
    setExecuting,
    setDone,
    setError,
    setIdle,
  };
}

