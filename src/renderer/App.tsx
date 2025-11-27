/**
 * Main App Component
 * 应用主入口组件
 */

import React, { useEffect, useCallback } from 'react';
import { Overlay } from './components/Overlay';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useAppStore } from './store/appStore';
import type { TriggerMode, AppState } from '../shared/types';

const SYSTEM_PROMPT = `你是一个桌面语音助手，可以帮助用户执行各种任务。

你可以使用以下工具：
- type_text: 在当前光标位置输入文字
- paste_text: 粘贴文字到剪贴板并模拟粘贴
- read_clipboard: 读取剪贴板内容
- open_app: 打开应用程序
- open_url: 在浏览器中打开 URL
- run_shell: 执行命令行命令
- read_file / write_file: 读写文件
- list_dir: 列出目录内容

规则：
1. 优先使用最简单的工具完成任务
2. 危险操作需要用户确认
3. 如果不确定用户意图，先询问澄清`;

export default function App() {
  const { state, setState, setRecording, setAudioLevel, setRecordingDuration } = useAppStore();
  const audioRecorder = useAudioRecorder();

  // 处理热键触发
  const handleHotkeyTrigger = useCallback(
    async (mode: TriggerMode) => {
      try {
        // 开始录音
        await audioRecorder.start();
        setRecording(true, mode);
        setState({ status: 'recording', mode, duration: 0 });
      } catch (error) {
        console.error('Failed to start recording:', error);
        setState({ status: 'error', message: '无法启动录音，请检查麦克风权限' });
      }
    },
    [audioRecorder, setRecording, setState]
  );

  // 处理热键释放
  const handleHotkeyRelease = useCallback(async () => {
    if (!audioRecorder.isRecording) return;

    const currentMode = useAppStore.getState().recordingMode;

    try {
      // 停止录音
      const audioBlob = await audioRecorder.stop();
      setRecording(false);

      if (!audioBlob) {
        setState({ status: 'idle' });
        return;
      }

      // 转录
      setState({ status: 'transcribing', mode: currentMode || 'command' });

      const arrayBuffer = await audioBlob.arrayBuffer();
      const result = await window.voiceAgent.transcribe(arrayBuffer);

      if (!result.text) {
        setState({ status: 'error', message: '未能识别到任何内容' });
        setTimeout(() => setState({ status: 'idle' }), 2000);
        return;
      }

      // 根据模式处理
      if (currentMode === 'dictation') {
        // 听写模式：直接输入文字
        await window.voiceAgent.executeTool('type_text', { text: result.text });
        setState({ status: 'done', result: '已输入文字' });
      } else {
        // 指令/Agent 模式：调用 LLM
        setState({ status: 'thinking', text: result.text });

        const chatResult = await window.voiceAgent.chat(
          [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: result.text },
          ],
          [
            // 这里可以传入工具定义，让 LLM 决定调用哪个工具
          ]
        );

        if (chatResult.tool_calls && chatResult.tool_calls.length > 0) {
          // 执行工具调用
          for (let i = 0; i < chatResult.tool_calls.length; i++) {
            const toolCall = chatResult.tool_calls[i];
            setState({
              status: 'executing',
              tool: toolCall.name,
              step: i + 1,
              total: chatResult.tool_calls.length,
            });

            await window.voiceAgent.executeTool(toolCall.name, toolCall.arguments);
          }
          setState({ status: 'done', result: '执行完成' });
        } else if (chatResult.content) {
          // 有文本回复
          setState({ status: 'done', result: chatResult.content });
        } else {
          setState({ status: 'done', result: '已完成' });
        }
      }

      // 自动隐藏
      setTimeout(() => setState({ status: 'idle' }), 2000);
    } catch (error) {
      console.error('Processing failed:', error);
      const message = error instanceof Error ? error.message : '处理失败';
      setState({ status: 'error', message });
      setTimeout(() => setState({ status: 'idle' }), 3000);
    }
  }, [audioRecorder, setRecording, setState]);

  // 监听热键事件
  useEffect(() => {
    const cleanupTrigger = window.voiceAgent.onHotkeyTrigger(handleHotkeyTrigger);
    const cleanupRelease = window.voiceAgent.onHotkeyRelease(handleHotkeyRelease);

    return () => {
      cleanupTrigger();
      cleanupRelease();
    };
  }, [handleHotkeyTrigger, handleHotkeyRelease]);

  // 更新录音状态
  useEffect(() => {
    if (audioRecorder.isRecording) {
      setAudioLevel(audioRecorder.audioLevel);
      setRecordingDuration(audioRecorder.duration);

      // 更新状态中的 duration
      if (state.status === 'recording') {
        setState({ ...state, duration: audioRecorder.duration });
      }
    }
  }, [audioRecorder.audioLevel, audioRecorder.duration, audioRecorder.isRecording, setAudioLevel, setRecordingDuration, setState, state]);

  return (
    <div className="w-full h-full">
      <Overlay state={state as AppState} audioLevel={audioRecorder.audioLevel} />
    </div>
  );
}

