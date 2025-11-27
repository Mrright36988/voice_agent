/**
 * STT Service Factory
 * 工厂模式，支持扩展更多 STT Provider
 */

import type { STTProvider, STTProviderType } from '../../types/index.js';
import { WhisperProvider } from './whisper.js';

interface STTConfig {
  provider: STTProviderType;
  openaiApiKey: string;
}

export function createSTTProvider(config: STTConfig): STTProvider {
  switch (config.provider) {
    case 'whisper':
      return new WhisperProvider(config.openaiApiKey);
    default:
      throw new Error(`Unsupported STT provider: ${config.provider}`);
  }
}

export { WhisperProvider };

