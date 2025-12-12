import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

class TokenManager {
  private token: string | null = null;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    await this.refreshToken();
  }

  async refreshToken(): Promise<void> {
    // If already refreshing, wait for that to complete
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._doRefresh();

    try {
      await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async _doRefresh(): Promise<void> {
    try {
      logger.info('Refreshing SiteMinder token...');

      const auth = Buffer.from(
        `${config.siteminder.username}:${config.siteminder.password}`
      ).toString('base64');

      const response = await axios.post(
        `${config.siteminder.baseUrl}/ca/api/sso/services/login/v1/token`,
        {},
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false // For self-signed certs
          })
        }
      );

      // Extract token - SiteMinder returns it as sessionkey
      const tokenData = response.data;
      if (typeof tokenData === 'string') {
        this.token = tokenData;
      } else if (tokenData.sessionkey) {
        this.token = tokenData.sessionkey;
      } else if (tokenData.token) {
        this.token = tokenData.token;
      } else {
        // Log the actual response to debug
        logger.error('Unexpected token response format:', { data: tokenData });
        throw new Error('Unable to extract token from response');
      }

      logger.info('Token refreshed successfully');
      logger.info(`Token length: ${this.token?.length} chars`);
    } catch (error: any) {
      logger.error('Failed to refresh token:', {
        message: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  getToken(): string {
    if (!this.token) {
      throw new Error('Token not initialized');
    }
    return this.token;
  }
}

export const tokenManager = new TokenManager();
