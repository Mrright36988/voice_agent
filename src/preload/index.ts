/**
 * Preload Script
 * 暴露安全的 API 给渲染进程
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { TriggerMode, Message, ToolDefinition, AppConfig, AppState } from '../shared/types';
import { IPC_CHANNELS } from '../shared/types';

// 定义暴露给渲染进程的 API
const voiceAgentAPI = {
  // 事件监听
  onHotkeyTrigger: (callback: (mode: TriggerMode) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, mode: TriggerMode) => callback(mode);
    ipcRenderer.on(IPC_CHANNELS.HOTKEY_TRIGGER, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.HOTKEY_TRIGGER, handler);
  },

  onHotkeyRelease: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on(IPC_CHANNELS.HOTKEY_RELEASE, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.HOTKEY_RELEASE, handler);
  },

  onStateUpdate: (callback: (state: AppState) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: AppState) => callback(state);
    ipcRenderer.on(IPC_CHANNELS.STATE_UPDATE, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.STATE_UPDATE, handler);
  },

  // 主动调用
  transcribe: (audio: ArrayBuffer): Promise<{ text: string; confidence: number }> =>
    ipcRenderer.invoke(IPC_CHANNELS.AUDIO_TRANSCRIBE, { audio }),

  chat: (
    messages: Message[],
    tools?: ToolDefinition[]
  ): Promise<{ content: string | null; tool_calls?: Array<{ id: string; name: string; arguments: Record<string, unknown> }> }> =>
    ipcRenderer.invoke(IPC_CHANNELS.LLM_CHAT, { messages, tools }),

  executeTool: (name: string, params: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.TOOL_EXECUTE, { name, params }),

  // 配置
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),

  setConfig: (key: string, value: unknown): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET, { key, value }),
};

// 暴露 API 到渲染进程的 window 对象
contextBridge.exposeInMainWorld('voiceAgent', voiceAgentAPI);

// 类型声明
export type VoiceAgentAPI = typeof voiceAgentAPI;

