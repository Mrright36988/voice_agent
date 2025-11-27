/**
 * OpenAI LLM Provider
 * 使用 OpenAI Chat API 实现
 */

import axios from 'axios';
import type { LLMProvider, LLMResponse, Message, ToolDefinition } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export class OpenAIProvider implements LLMProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(apiKey: string, model: string = 'gpt-4-turbo', maxTokens: number = 4096) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required for OpenAI provider');
    }
    this.apiKey = apiKey;
    this.model = model;
    this.maxTokens = maxTokens;
  }

  async chat(messages: Message[], tools?: ToolDefinition[]): Promise<LLMResponse> {
    const requestBody: Record<string, unknown> = {
      model: this.model,
      max_tokens: this.maxTokens,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
      })),
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }

    try {
      const response = await axios.post(OPENAI_API_URL, requestBody, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = response.data;

      logger.info(
        { model: this.model, promptTokens: data.usage?.prompt_tokens, completionTokens: data.usage?.completion_tokens },
        'OpenAI chat completed'
      );

      return this.parseResponse(data);
    } catch (error) {
      logger.error({ error }, 'OpenAI chat failed');

      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`OpenAI API error: ${message}`);
      }
      throw error;
    }
  }

  private parseResponse(data: Record<string, unknown>): LLMResponse {
    const choices = data.choices as Array<{
      message: {
        content: string | null;
        tool_calls?: Array<{
          id: string;
          function: { name: string; arguments: string };
        }>;
      };
    }>;

    const choice = choices[0];
    const message = choice?.message;

    const toolCalls = message?.tool_calls?.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments) as Record<string, unknown>,
    }));

    const usage = data.usage as { prompt_tokens: number; completion_tokens: number } | undefined;

    return {
      content: message?.content || null,
      tool_calls: toolCalls,
      usage: {
        prompt_tokens: usage?.prompt_tokens || 0,
        completion_tokens: usage?.completion_tokens || 0,
      },
    };
  }
}

