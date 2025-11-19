const fs = require('fs');

// Read the Swagger 2.0 spec
const swagger2 = JSON.parse(fs.readFileSync('./siteminder-swagger-original.json', 'utf8'));

// Convert Swagger 2.0 to OpenAPI 3.0
const openapi3 = {
  openapi: '3.0.0',
  info: {
    ...swagger2.info,
    description: `# SiteMinder API Wrapper

This API wrapper provides **automatic token management** for SiteMinder REST APIs.
You don't need to handle authentication - the wrapper manages JWT tokens automatically.

## Features
- ✅ Automatic JWT token refresh
- ✅ No authentication headers required
- ✅ Direct pass-through to SiteMinder APIs
- ✅ Full SiteMinder Policy Data API support

## Original SiteMinder API
This wrapper exposes all SiteMinder Policy Data API operations including:
- Policy objects (Agents, Domains, Realms, etc.)
- User Directories
- Authentication schemes
- And more...

**Note:** All authentication is handled by the wrapper. You can call these endpoints directly without providing any Bearer tokens.
`
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'SiteMinder API Wrapper (Local)'
    }
  ],
  paths: {},
  components: {
    schemas: swagger2.definitions || {},
    securitySchemes: {}
  }
};

// Helper function to resolve parameter references
function resolveParameter(param, swagger2) {
  // If it's a $ref, resolve it from swagger2.parameters
  if (param.$ref) {
    const refName = param.$ref.split('/').pop();
    const resolved = swagger2.parameters[refName];
    if (resolved) {
      return resolved;
    }
  }
  return param;
}

// Helper function to convert Swagger 2.0 parameter to OpenAPI 3.0
function convertParameter(param) {
  // Skip parameters without a name (these are invalid)
  if (!param.name) {
    return null;
  }

  const newParam = {
    name: param.name,
    in: param.in,
    required: param.required || false
  };

  if (param.description) {
    newParam.description = param.description;
  }

  // Move type/format/etc into schema object for OpenAPI 3.0
  if (param.type || param.format || param.items || param.enum) {
    newParam.schema = {};
    if (param.type) newParam.schema.type = param.type;
    if (param.format) newParam.schema.format = param.format;
    if (param.items) newParam.schema.items = param.items;
    if (param.enum) newParam.schema.enum = param.enum;
    if (param.default !== undefined) newParam.schema.default = param.default;
    if (param.example !== undefined) newParam.schema.example = param.example;
  }

  return newParam;
}

// Convert paths from Swagger 2.0 to OpenAPI 3.0
for (const [path, pathItem] of Object.entries(swagger2.paths)) {
  const newPath = {};

  for (const [method, operation] of Object.entries(pathItem)) {
    if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
      const newOperation = {
        ...operation,
        responses: {}
      };

      // Remove security since wrapper handles it
      delete newOperation.security;

      // Convert responses
      if (operation.responses) {
        for (const [statusCode, response] of Object.entries(operation.responses)) {
          const newResponse = {
            description: response.description || 'Response'
          };

          // Convert schema to content
          if (response.schema) {
            newResponse.content = {
              'application/json': {
                schema: response.schema
              }
            };
          }

          newOperation.responses[statusCode] = newResponse;
        }
      }

      // Convert parameters
      if (operation.parameters) {
        const bodyParams = operation.parameters.filter(p => {
          const resolved = resolveParameter(p, swagger2);
          return resolved.in === 'body';
        });

        const otherParams = operation.parameters
          .filter(p => {
            const resolved = resolveParameter(p, swagger2);
            return resolved.in !== 'body' && resolved.in !== 'formData';
          })
          .map(p => resolveParameter(p, swagger2)) // Resolve $ref
          .map(p => convertParameter(p)) // Convert to OpenAPI 3.0
          .filter(p => p !== null); // Remove invalid parameters

        newOperation.parameters = otherParams;

        // Convert body parameters to requestBody
        if (bodyParams.length > 0) {
          const bodyParam = resolveParameter(bodyParams[0], swagger2);
          newOperation.requestBody = {
            description: bodyParam.description || 'Request body',
            required: bodyParam.required || false,
            content: {
              'application/json': {
                schema: bodyParam.schema
              }
            }
          };
        }
      }

      newPath[method] = newOperation;
    }
  }

  openapi3.paths[path] = newPath;
}

// Write the final OpenAPI 3.0 spec
fs.writeFileSync('./openapi.json', JSON.stringify(openapi3, null, 2));

// Calculate statistics
let totalParams = 0;
let validParams = 0;
const tags = new Set();

for (const path in openapi3.paths) {
  for (const method in openapi3.paths[path]) {
    const operation = openapi3.paths[path][method];

    if (operation.parameters) {
      const params = operation.parameters;
      totalParams += params.length;
      validParams += params.filter(p => p && p.name).length;
    }

    if (operation.tags) {
      operation.tags.forEach(tag => tags.add(tag));
    }
  }
}

console.log('✅ Conversion complete! Generated openapi.json\n');
console.log('📊 Statistics:');
console.log(`   • Total API endpoints: ${Object.keys(openapi3.paths).length}`);
console.log(`   • Total schemas: ${Object.keys(openapi3.components.schemas).length}`);
console.log(`   • Valid parameters: ${validParams} (filtered ${totalParams - validParams} invalid)`);
console.log(`   • Tags: ${tags.size}`);
console.log('\n✨ Ready for Open WebUI at: http://localhost:3001/openapi.json');
