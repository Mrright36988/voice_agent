/**
 * Voice Agent - Shared Types
 * 客户端与主进程共享的类型定义
 */

// ============ Trigger Mode ============

export type TriggerMode = 'dictation' | 'command' | 'agent';

// ============ App State ============

export type AppState =
  | { status: 'idle' }
  | { status: 'recording'; mode: TriggerMode; duration: number }
  | { status: 'transcribing'; mode: TriggerMode }
  | { status: 'thinking'; text: string }
  | { status: 'executing'; tool: string; step: number; total: number }
  | { status: 'done'; result: string }
  | { status: 'error'; message: string };

// ============ Audio Types ============

export interface AudioBlob {
  blob: Blob;
  duration: number;
  format: 'webm' | 'wav';
}

// ============ STT Types ============

export interface STTResult {
  text: string;
  confidence: number;
  language: string;
  duration: number;
}

// ============ LLM Types ============

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface Message {
  role: MessageRole;
  content: string;
  tool_call_id?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

// ============ Intent Types ============

export type IntentType = 'dictation' | 'command';

export interface Intent {
  type: IntentType;
  confidence: number;
}

// ============ Tool Types ============

export type ToolPermission = 'basic' | 'system' | 'dangerous';

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ============ Config Types ============

export interface HotkeyConfig {
  shortcut: string;
  longPressThreshold: number;
  doublePressThreshold: number;
}

export interface APIConfig {
  baseUrl: string;
  timeout: number;
}

export interface UIConfig {
  theme: 'light' | 'dark' | 'system';
  overlayPosition: 'center' | 'top-right' | 'bottom-right';
}

export interface PermissionConfig {
  basic: boolean;
  system: boolean;
  dangerous: boolean;
}

export interface AppConfig {
  hotkey: HotkeyConfig;
  api: APIConfig;
  ui: UIConfig;
  permissions: PermissionConfig;
}

// ============ IPC Channels ============

export const IPC_CHANNELS = {
  // Main -> Renderer
  HOTKEY_TRIGGER: 'hotkey:trigger',
  HOTKEY_RELEASE: 'hotkey:release',
  STATE_UPDATE: 'state:update',

  // Renderer -> Main
  AUDIO_TRANSCRIBE: 'audio:transcribe',
  LLM_CHAT: 'llm:chat',
  TOOL_EXECUTE: 'tool:execute',
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
} as const;

