/**
 * Backend API Client
 * 与后端 API 服务通信
 */

import axios, { type AxiosInstance } from 'axios';
import type { Message, ToolDefinition, STTResult, Intent } from '../../shared/types';

interface ChatResponse {
  content: string | null;
  tool_calls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
}

interface IntentResponse {
  intent: Intent;
}

export class APIClient {
  private client: AxiosInstance;

  constructor(baseUrl: string = 'http://localhost:3000', timeout: number = 30000) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
    });
  }

  async transcribe(audioBuffer: Buffer, mimeType: string = 'audio/webm'): Promise<STTResult> {
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType });
    formData.append('file', blob, 'audio.webm');

    const response = await this.client.post<STTResult>('/api/stt/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  }

  async chat(
    messages: Message[],
    tools?: ToolDefinition[],
    provider?: 'claude' | 'openai'
  ): Promise<ChatResponse> {
    const response = await this.client.post<ChatResponse>('/api/llm/chat', {
      messages,
      tools,
      provider,
    });

    return response.data;
  }

  async resolveIntent(text: string, mode?: 'dictation' | 'command' | 'agent'): Promise<Intent> {
    const response = await this.client.post<IntentResponse>('/api/intent/resolve', {
      text,
      mode,
    });

    return response.data.intent;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data?.status === 'ok';
    } catch {
      return false;
    }
  }
}

// 默认客户端实例
export const apiClient = new APIClient();

