/**
 * Configuration Management
 * 使用 Zod 进行运行时类型验证
 */

import { z } from 'zod';
import type { AppConfig } from '../types/index.js';

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  corsOrigin: z.string().default('*'),
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  stt: z.object({
    provider: z.literal('whisper').default('whisper'),
    openaiApiKey: z.string().min(1, 'OPENAI_API_KEY is required'),
  }),
  llm: z.object({
    provider: z.enum(['claude', 'openai']).default('claude'),
    model: z.string().default('claude-3-sonnet-20240229'),
    openaiApiKey: z.string().default(''),
    anthropicApiKey: z.string().default(''),
  }),
});

function loadConfig(): AppConfig {
  const rawConfig = {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    corsOrigin: process.env.CORS_ORIGIN,
    logLevel: process.env.LOG_LEVEL,
    stt: {
      provider: process.env.STT_PROVIDER || 'whisper',
      openaiApiKey: process.env.OPENAI_API_KEY || '',
    },
    llm: {
      provider: process.env.LLM_PROVIDER,
      model: process.env.LLM_MODEL,
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    },
  };

  const result = configSchema.safeParse(rawConfig);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }

  return result.data;
}

export const config = loadConfig();

