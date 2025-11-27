/**
 * IPC Handler
 * 处理主进程与渲染进程之间的通信
 */

import { ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS, type AppState, type TriggerMode, type Message, type ToolDefinition } from '../shared/types';
import { apiClient } from './services/api';
import { toolRegistry } from './services/tools';

let mainWindow: BrowserWindow | null = null;

export function setupIPC(window: BrowserWindow): void {
  mainWindow = window;

  // 音频转文字
  ipcMain.handle(IPC_CHANNELS.AUDIO_TRANSCRIBE, async (_event, { audio }) => {
    const buffer = Buffer.from(audio);
    return await apiClient.transcribe(buffer);
  });

  // LLM 对话
  ipcMain.handle(
    IPC_CHANNELS.LLM_CHAT,
    async (_event, { messages, tools }: { messages: Message[]; tools?: ToolDefinition[] }) => {
      return await apiClient.chat(messages, tools);
    }
  );

  // 工具执行
  ipcMain.handle(
    IPC_CHANNELS.TOOL_EXECUTE,
    async (_event, { name, params }: { name: string; params: Record<string, unknown> }) => {
      return await toolRegistry.execute(name, params);
    }
  );

  // 获取配置
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, async () => {
    // TODO: 从 electron-store 读取配置
    return {
      hotkey: {
        shortcut: 'CommandOrControl+Space',
        longPressThreshold: 300,
        doublePressThreshold: 300,
      },
      api: {
        baseUrl: 'http://localhost:3000',
        timeout: 30000,
      },
      ui: {
        theme: 'system',
        overlayPosition: 'center',
      },
      permissions: {
        basic: true,
        system: true,
        dangerous: false,
      },
    };
  });

  // 设置配置
  ipcMain.handle(IPC_CHANNELS.CONFIG_SET, async (_event, { key, value }) => {
    // TODO: 保存到 electron-store
    console.log(`Config set: ${key} = ${JSON.stringify(value)}`);
  });
}

export function sendToRenderer(channel: string, data?: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

export function sendHotkeyTrigger(mode: TriggerMode): void {
  sendToRenderer(IPC_CHANNELS.HOTKEY_TRIGGER, mode);
}

export function sendHotkeyRelease(): void {
  sendToRenderer(IPC_CHANNELS.HOTKEY_RELEASE);
}

export function sendStateUpdate(state: AppState): void {
  sendToRenderer(IPC_CHANNELS.STATE_UPDATE, state);
}

