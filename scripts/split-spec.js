#!/usr/bin/env node
/**
 * Split OpenAPI Spec Script
 *
 * Reads openapi-full.json and generates individual operation files
 * in the src/spec/ directory structure.
 *
 * Usage: node scripts/split-spec.js [--source <file>] [--target <dir>]
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let sourceFile = path.join(__dirname, '../openapi-full.json');
let targetDir = path.join(__dirname, '../src/spec');

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--source' && args[i + 1]) {
    sourceFile = args[i + 1];
    i++;
  } else if (args[i] === '--target' && args[i + 1]) {
    targetDir = args[i + 1];
    i++;
  }
}

console.log('Split OpenAPI Spec');
console.log('==================');
console.log(`Source: ${sourceFile}`);
console.log(`Target: ${targetDir}`);
console.log('');

// Read the source OpenAPI spec
if (!fs.existsSync(sourceFile)) {
  console.error(`Error: Source file not found: ${sourceFile}`);
  process.exit(1);
}

const specContent = fs.readFileSync(sourceFile, 'utf8');
const spec = JSON.parse(specContent);

if (!spec.paths) {
  console.error('Error: No paths found in the OpenAPI spec');
  process.exit(1);
}

const stats = {
  paths: 0,
  operations: 0,
  files: []
};

// Process each path and method
for (const [apiPath, methods] of Object.entries(spec.paths)) {
  stats.paths++;

  for (const [method, operation] of Object.entries(methods)) {
    // Skip non-operation properties (like parameters at path level)
    if (!['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method.toLowerCase())) {
      continue;
    }

    stats.operations++;

    // Convert API path to directory structure
    // /ca/api/sso/services/policy/v1/SmAgents/{name} -> ca/api/sso/services/policy/v1/SmAgents/{name}
    const pathWithoutLeadingSlash = apiPath.startsWith('/') ? apiPath.slice(1) : apiPath;
    const dirPath = path.join(targetDir, pathWithoutLeadingSlash);
    const filePath = path.join(dirPath, `${method.toLowerCase()}.json`);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }

    // Write the operation file
    const operationJson = JSON.stringify(operation, null, 2);
    fs.writeFileSync(filePath, operationJson, 'utf8');

    stats.files.push(filePath);
    console.log(`  ${method.toUpperCase()} ${apiPath} -> ${path.relative(targetDir, filePath)}`);
  }
}

console.log('');
console.log('Summary');
console.log('-------');
console.log(`Paths processed: ${stats.paths}`);
console.log(`Operations created: ${stats.operations}`);
console.log(`Files written: ${stats.files.length}`);
console.log('');
console.log('Done! Individual operation files have been created.');
