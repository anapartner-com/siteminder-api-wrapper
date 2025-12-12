import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config';
import { tokenManager } from '../services/tokenManager';
import { logger } from '../utils/logger';

const makeProxyRequest = async (
  req: Request,
  token: string,
  targetUrl: string
) => {
  // Prepare headers
  const headers: any = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': req.headers['content-type'] || 'application/json',
  };

  // Copy relevant headers from original request
  if (req.headers['accept']) {
    headers['Accept'] = req.headers['accept'];
  }

  // Make the request to SiteMinder
  return await axios({
    method: req.method,
    url: targetUrl,
    headers,
    params: req.query,
    data: req.body,
    httpsAgent: new (require('https').Agent)({
      rejectUnauthorized: false
    }),
    validateStatus: () => true // Accept all status codes
  });
};

export const proxyMiddleware = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    let token = tokenManager.getToken();

    // Build the target URL - use originalUrl to get full path
    const fullPath = req.originalUrl || req.url;
    const targetUrl = `${config.siteminder.baseUrl}${fullPath}`;

    logger.info(`Proxying ${req.method} ${fullPath} -> ${targetUrl}`);
    logger.info(`Token (first 20 chars): ${token.substring(0, 20)}...`);

    // Make the request to SiteMinder
    let response = await makeProxyRequest(req, token, targetUrl);

    // Log response
    logger.info(`Response status: ${response.status}`);
    logger.info(`Response data (first 100 chars): ${JSON.stringify(response.data).substring(0, 100)}`);

    // Check if authentication failed (401 Unauthorized)
    if (response.status === 401) {
      logger.warn('Authentication failed, refreshing token and retrying...');

      // Refresh the token
      await tokenManager.refreshToken();
      token = tokenManager.getToken();

      logger.info('Retrying request with new token...');
      logger.info(`New token (first 20 chars): ${token.substring(0, 20)}...`);

      // Retry the request with the new token
      response = await makeProxyRequest(req, token, targetUrl);

      logger.info(`Retry response status: ${response.status}`);
      logger.info(`Retry response data (first 100 chars): ${JSON.stringify(response.data).substring(0, 100)}`);
    }

    // Forward the response
    res.status(response.status);

    // Copy response headers
    Object.keys(response.headers).forEach(key => {
      if (key.toLowerCase() !== 'transfer-encoding') {
        res.setHeader(key, response.headers[key]);
      }
    });

    res.send(response.data);
  } catch (error: any) {
    logger.error('Proxy error:', {
      message: error.message,
      path: req.path
    });

    res.status(502).json({
      error: 'Bad Gateway',
      message: 'Failed to proxy request to SiteMinder',
      details: error.message
    });
  }
};
