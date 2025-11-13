import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

class TokenManager {
  private token: string | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    await this.refreshToken();
    this.startAutoRefresh();
  }

  private async refreshToken(): Promise<void> {
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

  private startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(async () => {
      try {
        await this.refreshToken();
      } catch (error) {
        logger.error('Auto-refresh failed, will retry on next interval');
      }
    }, config.siteminder.tokenRefreshInterval);

    logger.info(`Token auto-refresh started (interval: ${config.siteminder.tokenRefreshInterval}ms)`);
  }

  getToken(): string {
    if (!this.token) {
      throw new Error('Token not initialized');
    }
    return this.token;
  }

  stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

export const tokenManager = new TokenManager();
