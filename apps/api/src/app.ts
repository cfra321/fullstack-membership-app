/**
 * Express Application Configuration
 *
 * Sets up the Express app with all middleware and routes.
 */

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';

import { type ApiResponse } from '@astronacci/shared';

import { authRouter, articlesRouter, videosRouter, userRouter } from './routes';
import { errorHandler, notFoundHandler } from './middleware';

/**
 * CORS configuration options.
 * Allows credentials (cookies) and restricts origin to frontend URL.
 */
const corsOptions: cors.CorsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

/**
 * Creates and configures the Express application.
 */
export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(cors(corsOptions));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parsing middleware
  app.use(cookieParser());

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    const response: ApiResponse<{ status: string; timestamp: string }> = {
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(200).json(response);
  });

  // API routes
  app.use('/api/auth', authRouter);
  app.use('/api/articles', articlesRouter);
  app.use('/api/videos', videosRouter);
  app.use('/api/user', userRouter);

  // 404 handler for unknown routes
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}

export default createApp;
