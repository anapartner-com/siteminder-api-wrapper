import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import { logger } from './utils/logger';
import { tokenManager } from './services/tokenManager';
import { proxyMiddleware } from './middleware/proxy';
import routes from './routes';

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for Swagger UI
}));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });
  next();
});

// Mount routes for wrapper-specific endpoints
app.use('/', routes);

// Proxy all SiteMinder API requests
app.use('/ca/api/sso/services/*', proxyMiddleware);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack
  });

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize token manager
    logger.info('Initializing token manager...');
    await tokenManager.initialize();

    // Start HTTP server
    app.listen(config.port, config.host, () => {
      logger.info(`SiteMinder API Wrapper running on http://${config.host}:${config.port}`);
      logger.info(`OpenAPI spec available at: http://${config.host}:${config.port}/openapi.json`);
      logger.info(`Swagger UI available at: http://${config.host}:${config.port}/api-docs`);
      logger.info(`Health check at: http://${config.host}:${config.port}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  tokenManager.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  tokenManager.stop();
  process.exit(0);
});

startServer();
