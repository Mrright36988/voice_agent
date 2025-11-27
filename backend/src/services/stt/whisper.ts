/**
 * OpenAI Whisper STT Provider
 * 实现语音转文字功能
 */

import axios from 'axios';
import FormData from 'form-data';
import type { STTProvider, STTResult } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

export class WhisperProvider implements STTProvider {
  private readonly apiKey: string;
  private readonly model: string = 'whisper-1';
  private readonly defaultLanguage: string = 'zh';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required for Whisper provider');
    }
    this.apiKey = apiKey;
  }

  async transcribe(audioBuffer: Buffer, mimeType: string): Promise<STTResult> {
    const startTime = Date.now();

    const formData = new FormData();
    const extension = this.getExtensionFromMimeType(mimeType);
    formData.append('file', audioBuffer, {
      filename: `audio.${extension}`,
      contentType: mimeType,
    });
    formData.append('model', this.model);
    formData.append('language', this.defaultLanguage);
    formData.append('response_format', 'verbose_json');

    try {
      const response = await axios.post(WHISPER_API_URL, formData, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
      });

      const duration = Date.now() - startTime;
      const data = response.data as { text?: string; language?: string };

      logger.info({ duration, textLength: data.text?.length }, 'STT transcription completed');

      return {
        text: data.text || '',
        confidence: 1,
        language: data.language || this.defaultLanguage,
        duration,
      };
    } catch (error) {
      logger.error({ error }, 'Whisper transcription failed');

      if (axios.isAxiosError(error)) {
        const axiosError = error as { response?: { data?: { error?: { message?: string } } }; message: string };
        const message = axiosError.response?.data?.error?.message || axiosError.message;
        throw new Error(`Whisper API error: ${message}`);
      }
      throw error;
    }
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/wav': 'wav',
      'audio/mp3': 'mp3',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'audio/flac': 'flac',
      'audio/m4a': 'm4a',
    };
    return mimeToExt[mimeType] || 'webm';
  }
}
