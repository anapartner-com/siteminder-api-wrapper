export interface SiteMinderConfig {
  baseUrl: string;
  username: string;
  password: string;
  tokenRefreshInterval: number;
  tokenRetryAttempts: number;
  tokenRetryDelay: number;
  requestTimeout: number;
}

export interface TokenResponse {
  token: string;
  expiresAt: Date;
}

export interface SiteMinderObject {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

export interface LinksResponse {
  responseType: 'links';
  data: {
    links: Array<{
      rel: string;
      href: string;
      title?: string;
    }>;
  };
}

export interface ObjectResponse {
  responseType: 'object';
  data: SiteMinderObject;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
}

export interface ApiRequestOptions {
  expanded?: boolean;
  classinfo?: boolean;
  editinfo?: boolean;
}

export type SiteMinderResponse = LinksResponse | ObjectResponse;

export enum ResourceType {
  AMRMapping = 'SmAMRMapping',
  AMRType = 'SmAMRType',
  Admin = 'SmAdmin',
  AffiliateDomain = 'SmAffiliateDomain',
  Agent = 'SmAgent',
  Agent4x = 'SmAgent4x',
  AgentConfig = 'SmAgentConfig',
  AgentGroup = 'SmAgentGroup',
  AgentInstance = 'SmAgentInstance',
  AgentType = 'SmAgentType',
  AuthScheme = 'SmAuthScheme',
  AuthMethodGroup = 'SmAuthMethodGroup',
  AuthValidateMap = 'SmAuthValidateMap'
}
