import { Router, Request, Response } from 'express';
import axios from 'axios';
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

// OpenAPI 3.0 spec - simplified for OpenWebUI
router.get('/openapi.json', (req: Request, res: Response) => {
  const serverUrl = `http://${req.hostname}:${config.port}`;

  const openapi3Spec = {
    openapi: '3.0.0',
    info: {
      title: 'SiteMinder REST API Wrapper',
      version: '1.0.0',
      description: 'Simplified SiteMinder API wrapper with automatic token management'
    },
    servers: [
      {
        url: serverUrl,
        description: 'SiteMinder API Wrapper'
      }
    ],
    paths: {
      '/ca/api/sso/services/policy/v1/SmAgents': {
        get: {
          summary: 'List all SiteMinder Agents',
          description: 'Returns a list of all configured SiteMinder agents',
          operationId: 'listAgents',
          parameters: [],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      responseType: { type: 'string' },
                      data: { type: 'array', items: { type: 'object' } }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/ca/api/sso/services/policy/v1/SmAgents/{name}': {
        get: {
          summary: 'Get Agent by name',
          description: 'Returns details for a specific SiteMinder agent. First call the listAgents operation to get the list of available agents, then extract the agent name from the "path" field (e.g., "/SmAgents/test_agent" -> use "test_agent")',
          operationId: 'getAgentByName',
          parameters: [
            {
              name: 'name',
              in: 'path',
              required: true,
              description: 'Agent name from the path field (without /SmAgents/ prefix). Example: test_agent, sps_agent',
              schema: {
                type: 'string',
                example: 'test_agent'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: { type: 'object' }
                }
              }
            }
          }
        }
      },
      '/ca/api/sso/services/policy/v1/SmUserDirectories': {
        get: {
          summary: 'List all User Directories',
          description: 'Returns a list of all configured user directories',
          operationId: 'listUserDirectories',
          parameters: [],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      responseType: { type: 'string' },
                      data: { type: 'array', items: { type: 'object' } }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/ca/api/sso/services/policy/v1/SmUserDirectories/{name}': {
        get: {
          summary: 'Get User Directory by name',
          description: 'Returns details for a specific user directory. First call listUserDirectories to get available directories, then extract the name from the "path" field (e.g., "/SmUserDirectories/defaultUserDir" -> use "defaultUserDir")',
          operationId: 'getUserDirectoryByName',
          parameters: [
            {
              name: 'name',
              in: 'path',
              required: true,
              description: 'User directory name from the path field (without /SmUserDirectories/ prefix). Example: defaultUserDir',
              schema: {
                type: 'string',
                example: 'defaultUserDir'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: { type: 'object' }
                }
              }
            }
          }
        }
      },
      '/ca/api/sso/services/policy/v1/SmRealms': {
        get: {
          summary: 'List all Realms',
          description: 'Returns a list of all configured realms',
          operationId: 'listRealms',
          parameters: [],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      responseType: { type: 'string' },
                      data: { type: 'array', items: { type: 'object' } }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/ca/api/sso/services/policy/v1/SmRealms/{name}': {
        get: {
          summary: 'Get Realm by name',
          description: 'Returns details for a specific realm. First call listRealms to get available realms, then extract the name from the "path" field (e.g., "/SmRealms/MyRealm" -> use "MyRealm")',
          operationId: 'getRealmByName',
          parameters: [
            {
              name: 'name',
              in: 'path',
              required: true,
              description: 'Realm name from the path field (without /SmRealms/ prefix)',
              schema: {
                type: 'string',
                example: 'MyRealm'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: { type: 'object' }
                }
              }
            }
          }
        }
      },
      '/ca/api/sso/services/policy/v1/SmDomains': {
        get: {
          summary: 'List all Domains',
          description: 'Returns a list of all configured domains',
          operationId: 'listDomains',
          parameters: [],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      responseType: { type: 'string' },
                      data: { type: 'array', items: { type: 'object' } }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/ca/api/sso/services/policy/v1/SmDomains/{name}': {
        get: {
          summary: 'Get Domain by name',
          description: 'Returns details for a specific domain. First call listDomains to get available domains, then extract the name from the "path" field (e.g., "/SmDomains/MyDomain" -> use "MyDomain")',
          operationId: 'getDomainByName',
          parameters: [
            {
              name: 'name',
              in: 'path',
              required: true,
              description: 'Domain name from the path field (without /SmDomains/ prefix)',
              schema: {
                type: 'string',
                example: 'MyDomain'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: { type: 'object' }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {}
    }
  };

  res.json(openapi3Spec);
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
