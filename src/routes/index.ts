import { Router, Request, Response } from 'express';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';
import { tokenManager } from '../services/tokenManager';
import { logger } from '../utils/logger';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  try {
    const token = tokenManager.getToken();
    res.json({
      status: 'healthy',
      tokenStatus: token ? 'active' : 'inactive',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      tokenStatus: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

// Status endpoint with more details
router.get('/status', (_req: Request, res: Response) => {
  try {
    const token = tokenManager.getToken();
    res.json({
      service: 'siteminder-api-wrapper',
      version: '1.0.0',
      status: 'running',
      siteminder: {
        baseUrl: config.siteminder.baseUrl,
        tokenStatus: token ? 'active' : 'inactive',
        tokenRefreshInterval: `${config.siteminder.tokenRefreshInterval}ms`
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({
      service: 'siteminder-api-wrapper',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// OpenAPI 3.0 spec - full SiteMinder API from static file
router.get('/openapi.json', (req: Request, res: Response) => {
  try {
    const serverUrl = `http://${req.hostname}:${config.port}`;
    const openapiPath = path.join(__dirname, '../../openapi.json');

    // Read the static OpenAPI spec
    const openapiContent = fs.readFileSync(openapiPath, 'utf8');
    const openapiSpec = JSON.parse(openapiContent);

    // Update the server URL dynamically based on the request
    openapiSpec.servers = [
      {
        url: serverUrl,
        description: 'SiteMinder API Wrapper'
      }
    ];

    res.json(openapiSpec);
  } catch (error: any) {
    logger.error('Failed to load OpenAPI spec:', error.message);
    res.status(500).json({
      error: 'Failed to load OpenAPI specification',
      message: error.message
    });
  }
});

// Swagger 2.0 spec - original from SiteMinder
router.get('/swagger.json', async (req: Request, res: Response) => {
  try {
    logger.info('Fetching Swagger 2.0 spec from SiteMinder...');

    const response = await axios.get(
      `${config.siteminder.baseUrl}/ca/api/sso/services/v1/api-doc/CA.SM.json`,
      {
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      }
    );

    // Modify the spec to point to this wrapper
    const spec = response.data;

    // Update the host and base path to point to this wrapper
    spec.host = `${req.hostname}:${config.port}`;
    spec.basePath = '/ca/api/sso/services';
    spec.schemes = ['http'];

    // Remove or modify security definitions since we handle auth
    if (spec.securityDefinitions) {
      delete spec.securityDefinitions;
    }
    if (spec.security) {
      delete spec.security;
    }

    res.json(spec);
  } catch (error: any) {
    logger.error('Failed to fetch Swagger spec:', error.message);
    res.status(502).json({
      error: 'Failed to fetch Swagger specification',
      message: error.message
    });
  }
});

// Alternative endpoint for Swagger UI page
router.get('/api-docs', async (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SiteMinder API Wrapper - Swagger UI</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-bundle.js"></script>
      <script>
        window.onload = () => {
          SwaggerUIBundle({
            url: '/openapi.json',
            dom_id: '#swagger-ui',
          });
        };
      </script>
    </body>
    </html>
  `);
});

export default router;
