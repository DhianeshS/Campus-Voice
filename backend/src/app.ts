import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { globalLimiter } from './middleware/rateLimiter';

const app: Application = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration supporting single or comma-separated origins (with trailing slash normalization)
const allowedOrigins = config.CLIENT_URL.split(',').map((origin) => origin.trim().replace(/\/+$/, ''));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, health checks, or curl) or in development
      const normalizedOrigin = origin ? origin.replace(/\/+$/, '') : '';
      if (!origin || allowedOrigins.includes(normalizedOrigin) || config.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request logging
if (config.NODE_ENV !== 'test') {
  app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Root welcome & API identity route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    service: 'CampusVoice API',
    description: 'Student Complaint and Feedback Management System API',
    version: '0.1.0',
    documentation: '/api/health',
    status: 'online',
  });
});

// Mount primary API router under /api with global rate limiting
app.use('/api', globalLimiter, apiRouter);

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
