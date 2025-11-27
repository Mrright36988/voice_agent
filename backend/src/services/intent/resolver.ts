/**
 * Intent Resolver
 * 双轨设计：规则引擎优先，LLM 兜底
 */

import type { Intent, LLMProvider, Message } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

// 指令模式匹配规则
const COMMAND_PATTERNS: RegExp[] = [
  /^(打开|启动|运行|关闭)\s*.+/,
  /^(帮我|请|麻烦).*(写|发|创建|删除|搜索|查找|复制|粘贴)/,
  /^(总结|翻译|润色|改写|修改|编辑)/,
  /^(发送|发给).*(slack|邮件|微信|消息)/i,
  /^(搜索|查询|查找|找一下)/,
  /^(执行|运行).*(命令|脚本)/,
  /^(读取|写入|保存|删除).*(文件|文档)/,
  /^(设置|配置|调整)/,
];

// 听写模式匹配规则（优先级更高）
const DICTATION_PATTERNS: RegExp[] = [
  /^["""].*["""]$/, // 引号包裹的内容
  /^输入[:：]?\s*/, // 明确的输入前缀
];

const INTENT_CLASSIFICATION_PROMPT = `你是一个意图分类器。判断用户输入是"听写"还是"指令"。

- dictation: 用户只是想把语音转成文字，直接输入到当前位置
- command: 用户想让系统执行某个操作

只返回 JSON: {"intent": "dictation" | "command", "confidence": 0-1}

用户输入: {text}`;

export class IntentResolver {
  private llmProvider?: LLMProvider;

  constructor(llmProvider?: LLMProvider) {
    this.llmProvider = llmProvider;
  }

  async resolve(text: string, mode?: 'dictation' | 'command' | 'agent'): Promise<Intent> {
    // 如果触发模式已明确，直接返回
    if (mode === 'dictation') {
      return { type: 'dictation', confidence: 1 };
    }
    if (mode === 'agent') {
      return { type: 'command', confidence: 1 };
    }

    // 规则引擎优先
    const ruleResult = this.matchRules(text);
    if (ruleResult) {
      logger.debug({ text, intent: ruleResult }, 'Intent resolved by rules');
      return ruleResult;
    }

    // LLM 兜底
    if (this.llmProvider) {
      try {
        return await this.classifyWithLLM(text);
      } catch (error) {
        logger.warn({ error }, 'LLM intent classification failed, falling back to dictation');
      }
    }

    // 默认按听写处理
    return { type: 'dictation', confidence: 0.5 };
  }

  private matchRules(text: string): Intent | null {
    const trimmedText = text.trim();

    // 检查听写模式规则
    for (const pattern of DICTATION_PATTERNS) {
      if (pattern.test(trimmedText)) {
        return { type: 'dictation', confidence: 0.9 };
      }
    }

    // 检查指令模式规则
    for (const pattern of COMMAND_PATTERNS) {
      if (pattern.test(trimmedText)) {
        return { type: 'command', confidence: 0.9 };
      }
    }

    return null;
  }

  private async classifyWithLLM(text: string): Promise<Intent> {
    if (!this.llmProvider) {
      throw new Error('LLM provider not configured');
    }

    const prompt = INTENT_CLASSIFICATION_PROMPT.replace('{text}', text);
    const messages: Message[] = [{ role: 'user', content: prompt }];

    const response = await this.llmProvider.chat(messages);

    if (!response.content) {
      throw new Error('Empty response from LLM');
    }

    try {
      const result = JSON.parse(response.content) as { intent: string; confidence: number };
      const intentType = result.intent === 'command' ? 'command' : 'dictation';

      logger.debug({ text, intent: intentType, confidence: result.confidence }, 'Intent resolved by LLM');

      return {
        type: intentType,
        confidence: result.confidence,
      };
    } catch {
      logger.warn({ content: response.content }, 'Failed to parse LLM intent response');
      return { type: 'dictation', confidence: 0.5 };
    }
  }
}

