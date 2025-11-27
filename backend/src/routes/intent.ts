/**
 * Intent API Routes
 * POST /api/intent/resolve - 意图识别
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { IntentResolver } from '../services/intent/index.js';
import { createLLMProvider } from '../services/llm/index.js';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

const router = Router();

// 请求体验证
const intentRequestSchema = z.object({
  text: z.string().min(1),
  mode: z.enum(['dictation', 'command', 'agent']).optional(),
});

// 初始化 Intent Resolver (带 LLM 兜底)
const llmProvider = createLLMProvider({
  provider: config.llm.provider,
  model: config.llm.model,
  openaiApiKey: config.llm.openaiApiKey,
  anthropicApiKey: config.llm.anthropicApiKey,
});

const intentResolver = new IntentResolver(llmProvider);

router.post('/resolve', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = intentRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid request', details: parseResult.error.issues });
      return;
    }

    const { text, mode } = parseResult.data;

    logger.info({ textLength: text.length, mode }, 'Intent resolve request');

    const intent = await intentResolver.resolve(text, mode);

    res.json({ intent });
  } catch (error) {
    logger.error({ error }, 'Intent resolve failed');
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;

