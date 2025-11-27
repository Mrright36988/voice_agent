/**
 * Voice Agent - Shared Type Definitions
 * 遵循单一职责原则，类型定义集中管理
 */

// ============ STT Types ============

export interface STTResult {
  text: string;
  confidence: number;
  language: string;
  duration: number;
}

export interface STTProvider {
  transcribe(audioBuffer: Buffer, mimeType: string): Promise<STTResult>;
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

export interface LLMResponse {
  content: string | null;
  tool_calls?: ToolCall[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export interface LLMProvider {
  chat(messages: Message[], tools?: ToolDefinition[]): Promise<LLMResponse>;
}

// ============ Intent Types ============

export type IntentType = 'dictation' | 'command';

export interface Intent {
  type: IntentType;
  confidence: number;
  extractedParams?: Record<string, unknown>;
}

// ============ API Request/Response Types ============

export interface TranscribeResponse {
  text: string;
  confidence: number;
  language: string;
  duration: number;
}

export interface ChatRequest {
  messages: Message[];
  tools?: ToolDefinition[];
  provider?: 'claude' | 'openai';
}

export interface ChatResponse {
  content: string | null;
  tool_calls?: ToolCall[];
}

export interface IntentRequest {
  text: string;
  mode?: 'dictation' | 'command' | 'agent';
}

export interface IntentResponse {
  intent: Intent;
}

// ============ Config Types ============

export type LLMProviderType = 'claude' | 'openai';
export type STTProviderType = 'whisper';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  logLevel: string;
  stt: {
    provider: STTProviderType;
    openaiApiKey: string;
  };
  llm: {
    provider: LLMProviderType;
    model: string;
    openaiApiKey: string;
    anthropicApiKey: string;
  };
}

