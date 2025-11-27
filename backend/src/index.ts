/**
 * Voice Agent API Server
 * 主入口文件
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import sttRoutes from './routes/stt.js';
import llmRoutes from './routes/llm.js';
import intentRoutes from './routes/intent.js';

// 加载环境变量
dotenv.config();

// 延迟加载配置（确保环境变量已加载）
const { config } = await import('./utils/config.js');

const app = express();

// 中间件
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
      },
      'Request completed'
    );
  });
  next();
});

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api/stt', sttRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/intent', intentRoutes);

// 404 处理
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 错误处理
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ error: err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

// 启动服务器
const port = config.port;
app.listen(port, () => {
  logger.info({ port, env: config.nodeEnv }, '🚀 Voice Agent API server started');
});

