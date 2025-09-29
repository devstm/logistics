import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { errorHandler, notFound } from './middleware/errorHandler';
import userRoutes from './routes/userRoutes';
import gazaRoutes from './routes/gazaRoutes';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use(limiter);

// Logging
if (config.environment !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.environment,
  });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/gaza', gazaRoutes);

// Catch 404 and forward to error handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

export default app;