/**
 * STT API Routes
 * POST /api/stt/transcribe - 语音转文字
 */

import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { createSTTProvider } from '../services/stt/index.js';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB limit

const sttProvider = createSTTProvider({
  provider: config.stt.provider,
  openaiApiKey: config.stt.openaiApiKey,
});

router.post('/transcribe', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No audio file provided' });
      return;
    }

    const mimeType = req.file.mimetype || 'audio/webm';
    logger.info({ size: req.file.size, mimeType }, 'Received audio for transcription');

    const result = await sttProvider.transcribe(req.file.buffer, mimeType);

    res.json({
      text: result.text,
      confidence: result.confidence,
      language: result.language,
      duration: result.duration,
    });
  } catch (error) {
    logger.error({ error }, 'Transcription failed');
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;

