// Converts Swagger 2.0 to OpenAPI 3.0
export function convertSwagger2ToOpenAPI3(swagger2: any, serverUrl: string): any {
  const openapi3: any = {
    openapi: '3.0.0',
    info: swagger2.info || {},
    servers: [
      {
        url: serverUrl,
        description: 'SiteMinder API Wrapper'
      }
    ],
    paths: {},
    components: {
      schemas: {}
    }
  };

  // Helper function to convert $ref from Swagger 2.0 to OpenAPI 3.0
  const convertRef = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        return obj.map(item => convertRef(item));
      }

      const newObj: any = {};
      for (const key in obj) {
        if (key === '$ref' && typeof obj[key] === 'string') {
          // Convert #/definitions/X to #/components/schemas/X
          newObj[key] = obj[key].replace('#/definitions/', '#/components/schemas/');
        } else {
          newObj[key] = convertRef(obj[key]);
        }
      }
      return newObj;
    }

    return obj;
  };

  // Convert paths
  if (swagger2.paths) {
    Object.keys(swagger2.paths).forEach(path => {
      openapi3.paths[path] = {};

      Object.keys(swagger2.paths[path]).forEach(method => {
        const operation = swagger2.paths[path][method];

        // Skip if not a valid HTTP method
        if (!['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
          return;
        }

        const newOperation: any = {
          summary: operation.summary || '',
          description: operation.description || '',
          operationId: operation.operationId || `${method}_${path.replace(/\//g, '_')}`,
          parameters: [],
          responses: {}
        };

        // Convert parameters
        if (operation.parameters) {
          operation.parameters.forEach((param: any) => {
            if (param.in === 'body') {
              // Body parameters become requestBody in OpenAPI 3.0
              newOperation.requestBody = {
                required: param.required || false,
                content: {
                  'application/json': {
                    schema: convertRef(param.schema || { type: 'object' })
                  }
                }
              };
            } else {
              // Query, path, header parameters
              newOperation.parameters.push({
                name: param.name,
                in: param.in,
                required: param.required || false,
                description: param.description || '',
                schema: convertRef({
                  type: param.type || 'string',
                  format: param.format,
                  default: param.default
                })
              });
            }
          });
        }

        // Convert responses
        if (operation.responses) {
          Object.keys(operation.responses).forEach(statusCode => {
            const response = operation.responses[statusCode];
            newOperation.responses[statusCode] = {
              description: response.description || 'Response',
              content: {
                'application/json': {
                  schema: convertRef(response.schema || { type: 'object' })
                }
              }
            };
          });
        }

        // Add default response if none exist
        if (Object.keys(newOperation.responses).length === 0) {
          newOperation.responses['200'] = {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          };
        }

        openapi3.paths[path][method] = newOperation;
      });
    });
  }

  // Copy definitions to components/schemas
  if (swagger2.definitions) {
    openapi3.components.schemas = convertRef(swagger2.definitions);
  }

  return openapi3;
}
