import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',

  siteminder: {
    baseUrl: process.env.SITEMINDER_BASE_URL || 'https://casso.cx.anapartner.net',
    username: process.env.SITEMINDER_USERNAME || 'siteminder',
    password: process.env.SITEMINDER_PASSWORD || 'anaPassword01',
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};
