/**
 * Audio Recorder Hook
 * 使用 Web Audio API 录制麦克风音频
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioRecorderState {
  isRecording: boolean;
  audioLevel: number;
  duration: number;
  error: string | null;
}

interface AudioRecorderResult extends AudioRecorderState {
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
}

export function useAudioRecorder(): AudioRecorderResult {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    audioLevel: 0,
    duration: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 更新音频电平
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // 计算平均音量
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const level = Math.min(average / 128, 1);

    setState((prev) => ({ ...prev, audioLevel: level }));

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  // 开始录音
  const start = useCallback(async () => {
    try {
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // 创建 AudioContext 用于分析音量
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // 创建 MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start(100); // 每 100ms 收集数据
      startTimeRef.current = Date.now();

      // 更新录音时长
      durationIntervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: Date.now() - startTimeRef.current,
        }));
      }, 100);

      setState({
        isRecording: true,
        audioLevel: 0,
        duration: 0,
        error: null,
      });

      // 开始音量监测
      updateAudioLevel();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start recording';
      setState((prev) => ({ ...prev, error: message }));
      throw error;
    }
  }, [updateAudioLevel]);

  // 停止录音
  const stop = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

        // 清理资源
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }

        // 停止所有轨道
        mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());

        setState((prev) => ({
          ...prev,
          isRecording: false,
          audioLevel: 0,
        }));

        resolve(blob);
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    start,
    stop,
  };
}

