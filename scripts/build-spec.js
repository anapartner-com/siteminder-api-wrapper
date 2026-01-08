#!/usr/bin/env node
/**
 * Build OpenAPI Spec Script
 *
 * Builds openapi-full.json from the individual operation files
 * in the src/spec/ directory structure.
 *
 * Usage: node scripts/build-spec.js [--source <dir>] [--output <file>]
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let sourceDir = path.join(__dirname, '../src/spec');
let outputFile = path.join(__dirname, '../openapi-full.json');

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--source' && args[i + 1]) {
    sourceDir = args[i + 1];
    i++;
  } else if (args[i] === '--output' && args[i + 1]) {
    outputFile = args[i + 1];
    i++;
  }
}

console.log('Build OpenAPI Spec');
console.log('==================');
console.log(`Source: ${sourceDir}`);
console.log(`Output: ${outputFile}`);
console.log('');

const VALID_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

/**
 * Recursively walks a directory and returns all file paths
 */
function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

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
 */
function deriveApiPath(specDir, filePath) {
  const relativePath = path.relative(specDir, filePath);
  const dirPath = path.dirname(relativePath);

  // Convert path separators to forward slashes for URL path
  const apiPath = '/' + dirPath.split(path.sep).join('/');

  return apiPath;
}

/**
 * Extracts the HTTP method from the filename
 */
function extractMethod(filePath) {
  const basename = path.basename(filePath, '.json').toLowerCase();

  if (VALID_METHODS.includes(basename)) {
    return basename;
  }

  return null;
}

// Build the spec
const spec = {
  openapi: '3.0.0',
  info: {
    title: 'SiteMinder API',
    version: '1.0.0',
    description: 'Full SiteMinder Policy Server API - Read and Write operations for agents, domains, realms, policies, and more'
  },
  servers: [{ url: 'http://siteminder-api-wrapper:3001' }],
  paths: {}
};

const stats = {
  paths: 0,
  operations: 0,
  files: []
};

if (!fs.existsSync(sourceDir)) {
  console.error(`Error: Source directory not found: ${sourceDir}`);
  process.exit(1);
}

const files = walkDir(sourceDir);

for (const filePath of files) {
  const method = extractMethod(filePath);

  if (!method) {
    console.log(`Skipping non-method file: ${path.relative(sourceDir, filePath)}`);
    continue;
  }

  const apiPath = deriveApiPath(sourceDir, filePath);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const operation = JSON.parse(content);

    if (!spec.paths[apiPath]) {
      spec.paths[apiPath] = {};
      stats.paths++;
    }

    spec.paths[apiPath][method] = operation;
    stats.operations++;
    stats.files.push(filePath);

    console.log(`  ${method.toUpperCase()} ${apiPath} (${operation.operationId || 'no-id'})`);
  } catch (error) {
    console.error(`Error loading ${filePath}: ${error.message}`);
  }
}

// Sort paths alphabetically
const sortedPaths = {};
const pathKeys = Object.keys(spec.paths).sort();

for (const pathKey of pathKeys) {
  sortedPaths[pathKey] = spec.paths[pathKey];
}

spec.paths = sortedPaths;

// Write the output file
const jsonContent = JSON.stringify(spec, null, 2);
fs.writeFileSync(outputFile, jsonContent, 'utf8');

console.log('');
console.log('Summary');
console.log('-------');
console.log(`Paths: ${stats.paths}`);
console.log(`Operations: ${stats.operations}`);
console.log(`Output written to: ${outputFile}`);
console.log('');
console.log('Done!');
