import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

interface OpenAPIOperation {
  operationId: string;
  summary?: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  responses: Record<string, any>;
  tags?: string[];
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string; description?: string }>;
  paths: Record<string, Record<string, OpenAPIOperation>>;
}

interface BuildStats {
  paths: number;
  operations: number;
  files: string[];
}

const VALID_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

/**
 * Recursively walks a directory and returns all file paths
 */
function walkDir(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else if (file.endsWith('.json')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Derives the API path from a file path relative to the spec directory
 * Example: src/spec/ca/api/sso/services/policy/v1/SmAgents/{name}/get.json
 *       -> /ca/api/sso/services/policy/v1/SmAgents/{name}
 */
function deriveApiPath(specDir: string, filePath: string): string {
  const relativePath = path.relative(specDir, filePath);
  const dirPath = path.dirname(relativePath);

  // Convert path separators to forward slashes for URL path
  const apiPath = '/' + dirPath.split(path.sep).join('/');

  return apiPath;
}

/**
 * Extracts the HTTP method from the filename
 * Example: get.json -> get, post.json -> post
 */
function extractMethod(filePath: string): string | null {
  const basename = path.basename(filePath, '.json').toLowerCase();

  if (VALID_METHODS.includes(basename)) {
    return basename;
  }

  return null;
}

/**
 * Builds an OpenAPI spec from the modular directory structure
 */
export function buildSpec(specDir: string): { spec: OpenAPISpec; stats: BuildStats } {
  const spec: OpenAPISpec = {
    openapi: '3.0.0',
    info: {
      title: 'SiteMinder API',
      version: '1.0.0',
      description: 'Full SiteMinder Policy Server API - Read and Write operations for agents, domains, realms, policies, and more'
    },
    servers: [],
    paths: {}
  };

  const stats: BuildStats = {
    paths: 0,
    operations: 0,
    files: []
  };

  if (!fs.existsSync(specDir)) {
    logger.warn(`Spec directory does not exist: ${specDir}`);
    return { spec, stats };
  }

  const files = walkDir(specDir);

  for (const filePath of files) {
    const method = extractMethod(filePath);

    if (!method) {
      logger.debug(`Skipping non-method file: ${filePath}`);
      continue;
    }

    const apiPath = deriveApiPath(specDir, filePath);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const operation: OpenAPIOperation = JSON.parse(content);

      if (!spec.paths[apiPath]) {
        spec.paths[apiPath] = {};
        stats.paths++;
      }

      spec.paths[apiPath][method] = operation;
      stats.operations++;
      stats.files.push(filePath);

      logger.debug(`Loaded operation: ${method.toUpperCase()} ${apiPath} (${operation.operationId})`);
    } catch (error: any) {
      logger.error(`Failed to load operation from ${filePath}: ${error.message}`);
    }
  }

  // Sort paths alphabetically for consistent output
  const sortedPaths: Record<string, Record<string, OpenAPIOperation>> = {};
  const pathKeys = Object.keys(spec.paths).sort();

  for (const pathKey of pathKeys) {
    sortedPaths[pathKey] = spec.paths[pathKey];
  }

  spec.paths = sortedPaths;

  logger.info(`Built OpenAPI spec: ${stats.paths} paths, ${stats.operations} operations`);

  return { spec, stats };
}

/**
 * Builds the spec and writes it to a file
 */
export function buildAndWriteSpec(specDir: string, outputFile: string): BuildStats {
  const { spec, stats } = buildSpec(specDir);

  const jsonContent = JSON.stringify(spec, null, 2);
  fs.writeFileSync(outputFile, jsonContent, 'utf8');

  logger.info(`Wrote OpenAPI spec to: ${outputFile}`);

  return stats;
}

/**
 * Gets the default spec directory path
 */
export function getDefaultSpecDir(): string {
  return path.join(__dirname, '../spec');
}

/**
 * Gets the default output file path for openapi-full.json
 */
export function getDefaultOutputFile(): string {
  return path.join(__dirname, '../../openapi-full.json');
}
