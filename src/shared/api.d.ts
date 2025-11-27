/**
 * Window API 类型声明
 */

import type { VoiceAgentAPI } from '../preload/index';

declare global {
  interface Window {
    voiceAgent: VoiceAgentAPI;
  }
}

export {};

