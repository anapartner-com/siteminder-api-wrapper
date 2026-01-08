# Modular OpenAPI Specification Architecture

## Overview

The OpenAPI specification for `openapi-full.json` is built dynamically from individual operation files stored in a directory structure that mirrors the API path. This allows for:

- Easy editing of individual operations without touching the full spec
- LLM-friendly structure for automated updates
- Clear ownership and organization of each endpoint
- Git-friendly changes (small, focused diffs)

## Directory Structure

```
src/spec/
└── ca/
    └── api/
        └── sso/
            └── services/
                └── policy/
                    └── v1/
                        ├── SmAgents/
                        │   ├── get.json          # GET /ca/api/sso/services/policy/v1/SmAgents
                        │   ├── post.json         # POST /ca/api/sso/services/policy/v1/SmAgents
                        │   └── {name}/
                        │       ├── get.json      # GET /ca/api/sso/services/policy/v1/SmAgents/{name}
                        │       ├── put.json      # PUT /ca/api/sso/services/policy/v1/SmAgents/{name}
                        │       └── delete.json   # DELETE /ca/api/sso/services/policy/v1/SmAgents/{name}
                        ├── SmDomains/
                        │   ├── get.json
                        │   ├── post.json
                        │   └── {name}/
                        │       ├── get.json
                        │       ├── put.json
                        │       └── delete.json
                        └── ... (other resources)
```

## Operation File Format

Each operation file contains only the OpenAPI operation object (without the path or method wrapper):

```json
{
  "operationId": "listAgents",
  "summary": "List all SiteMinder web agents",
  "description": "Optional detailed description",
  "parameters": [],
  "requestBody": {},
  "responses": {
    "200": {
      "description": "List of agents"
    }
  }
}
```

## API Endpoints

### GET /openapi-full.json

Returns the complete OpenAPI 3.0 specification built dynamically from the modular directory structure.

**Response:** Full OpenAPI spec JSON with all operations aggregated.

### POST /openapi-full/regenerate

Regenerates the `openapi-full.json` static file from the modular directory structure. Useful after making changes to individual operation files.

**Response:**
```json
{
  "success": true,
  "message": "OpenAPI spec regenerated successfully",
  "stats": {
    "paths": 30,
    "operations": 43
  },
  "outputFile": "/path/to/openapi-full.json"
}
```

## Scripts

### Split Existing Spec

```bash
node scripts/split-spec.js
```

Reads `openapi-full.json` and generates individual operation files in `src/spec/`.

### Regenerate Full Spec

```bash
node scripts/build-spec.js
```

Builds `openapi-full.json` from the modular directory structure.

## How It Works

1. **Spec Builder** (`src/utils/specBuilder.ts`):
   - Recursively walks the `src/spec/` directory
   - For each `{method}.json` file, derives the API path from the directory structure
   - Aggregates all operations into a complete OpenAPI 3.0 specification

2. **Path Derivation**:
   ```
   File: src/spec/ca/api/sso/services/policy/v1/SmAgents/{name}/get.json
   ↓
   API Path: /ca/api/sso/services/policy/v1/SmAgents/{name}
   HTTP Method: GET
   ```

3. **Dynamic Building**:
   - When `/openapi-full.json` is requested, the spec is built on-the-fly
   - Server URL is injected based on the request host
   - Result is cached for performance (cache invalidated on file changes)

## Adding a New Operation

1. Create the directory structure if it doesn't exist:
   ```bash
   mkdir -p src/spec/ca/api/sso/services/policy/v1/NewResource/{name}
   ```

2. Create the operation file (e.g., `get.json`):
   ```json
   {
     "operationId": "getNewResource",
     "summary": "Get a new resource by name",
     "parameters": [
       {
         "name": "name",
         "in": "path",
         "required": true,
         "schema": { "type": "string" }
       }
     ],
     "responses": {
       "200": { "description": "Resource details" }
     }
   }
   ```

3. The new operation will automatically appear in `/openapi-full.json`

4. Optionally regenerate the static file:
   ```bash
   curl -X POST http://localhost:3001/openapi-full/regenerate
   ```

## Supported HTTP Methods

- `get.json` → GET
- `post.json` → POST
- `put.json` → PUT
- `delete.json` → DELETE
- `patch.json` → PATCH

## Notes

- Only `openapi-full.json` uses this modular approach
- Other variants (openapi-minimal, openapi-lite, etc.) remain as static files
- The base OpenAPI info (title, version, description) is defined in the spec builder
