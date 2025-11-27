/**
 * LLM Service Factory
 * 工厂模式，支持 Claude 和 OpenAI 切换
 */

import type { LLMProvider, LLMProviderType } from '../../types/index.js';
import { ClaudeProvider } from './claude.js';
import { OpenAIProvider } from './openai.js';

interface LLMConfig {
  provider: LLMProviderType;
  model: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  maxTokens?: number;
}

export function createLLMProvider(config: LLMConfig): LLMProvider {
  switch (config.provider) {
    case 'claude':
      return new ClaudeProvider(config.anthropicApiKey, config.model, config.maxTokens);
    case 'openai':
      return new OpenAIProvider(config.openaiApiKey, config.model, config.maxTokens);
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}

export { ClaudeProvider, OpenAIProvider };

