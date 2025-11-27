/**
 * Claude LLM Provider
 * 使用 Anthropic API 实现
 */

import axios from 'axios';
import type { LLMProvider, LLMResponse, Message, ToolDefinition } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export class ClaudeProvider implements LLMProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(apiKey: string, model: string = 'claude-3-sonnet-20240229', maxTokens: number = 4096) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required for Claude provider');
    }
    this.apiKey = apiKey;
    this.model = model;
    this.maxTokens = maxTokens;
  }

  async chat(messages: Message[], tools?: ToolDefinition[]): Promise<LLMResponse> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const otherMessages = messages.filter((m) => m.role !== 'system');

    const requestBody: Record<string, unknown> = {
      model: this.model,
      max_tokens: this.maxTokens,
      messages: otherMessages.map((m) => ({
        role: m.role === 'tool' ? 'user' : m.role,
        content: m.role === 'tool' ? `Tool result (${m.tool_call_id}): ${m.content}` : m.content,
      })),
    };

    if (systemMessage) {
      requestBody.system = systemMessage.content;
    }

    if (tools && tools.length > 0) {
      requestBody.tools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }

    try {
      const response = await axios.post(CLAUDE_API_URL, requestBody, {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      });

      const data = response.data;

      logger.info(
        { model: this.model, inputTokens: data.usage?.input_tokens, outputTokens: data.usage?.output_tokens },
        'Claude chat completed'
      );

      return this.parseResponse(data);
    } catch (error) {
      logger.error({ error }, 'Claude chat failed');

      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`Claude API error: ${message}`);
      }
      throw error;
    }
  }

  private parseResponse(data: Record<string, unknown>): LLMResponse {
    const content = data.content as Array<{ type: string; text?: string; name?: string; id?: string; input?: unknown }>;
    let textContent: string | null = null;
    const toolCalls: { id: string; name: string; arguments: Record<string, unknown> }[] = [];

    for (const block of content) {
      if (block.type === 'text') {
        textContent = block.text || null;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id || '',
          name: block.name || '',
          arguments: (block.input as Record<string, unknown>) || {},
        });
      }
    }

    const usage = data.usage as { input_tokens: number; output_tokens: number } | undefined;

    return {
      content: textContent,
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        prompt_tokens: usage?.input_tokens || 0,
        completion_tokens: usage?.output_tokens || 0,
      },
    };
  }
}

