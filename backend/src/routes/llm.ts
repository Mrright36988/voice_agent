/**
 * LLM API Routes
 * POST /api/llm/chat - LLM 对话
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { createLLMProvider } from '../services/llm/index.js';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import type { LLMProvider, LLMProviderType } from '../types/index.js';

const router = Router();

// 请求体验证
const chatRequestSchema = z.object({
    messages: z.array(
        z.object({
            role: z.enum(['system', 'user', 'assistant', 'tool']),
            content: z.string(),
            tool_call_id: z.string().optional(),
        })
    ),
    tools: z
        .array(
            z.object({
                name: z.string(),
                description: z.string(),
                parameters: z.record(z.unknown()),
            })
        )
        .optional(),
    provider: z.enum(['claude', 'openai']).optional(),
});

// Provider 缓存
const providers = new Map<LLMProviderType, LLMProvider>();

function getLLMProvider(providerType?: LLMProviderType): LLMProvider {
    const type = providerType || config.llm.provider;

    if (!providers.has(type)) {
        providers.set(
            type,
            createLLMProvider({
                provider: type,
                model: config.llm.model,
                openaiApiKey: config.llm.openaiApiKey,
                anthropicApiKey: config.llm.anthropicApiKey,
            })
        );
    }

    return providers.get(type)!;
}

router.post('/chat', async (req: Request, res: Response): Promise<void> => {
    try {
        const parseResult = chatRequestSchema.safeParse(req.body);

        if (!parseResult.success) {
            res.status(400).json({ error: 'Invalid request', details: parseResult.error.issues });
            return;
        }

        const { messages, tools, provider: requestedProvider } = parseResult.data;

        logger.info({ messageCount: messages.length, hasTools: !!tools, provider: requestedProvider }, 'LLM chat request');

        const llmProvider = getLLMProvider(requestedProvider);
        const result = await llmProvider.chat(messages, tools);

        res.json({
            content: result.content,
            tool_calls: result.tool_calls,
        });
    } catch (error) {
        logger.error({ error }, 'LLM chat failed');
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});

export default router;

