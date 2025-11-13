# OpenWebUI Integration Guide

This guide shows how to integrate the SiteMinder API Wrapper with OpenWebUI.

## Overview

The wrapper solves OpenWebUI's limitation with SiteMinder's 15-minute token expiration by:
1. Automatically refreshing tokens every 14 minutes
2. Injecting Bearer tokens into all proxied requests
3. Exposing the same OpenAPI spec that OpenWebUI can consume

## Integration Steps

### Step 1: Start the Wrapper

```bash
./start.sh
# OR
docker-compose up -d
```

Verify it's running:
```bash
curl http://localhost:3000/health
```

### Step 2: Configure OpenWebUI

#### Option A: Using OpenAPI Spec URL

1. Open OpenWebUI admin interface
2. Navigate to **Tools** or **Functions** section
3. Add a new tool/function
4. Use the OpenAPI specification URL:
   ```
   http://<wrapper-host>:3000/openapi.json
   ```
5. OpenWebUI will parse the spec and create callable functions

#### Option B: Manual Tool Configuration

If OpenWebUI requires manual configuration:

1. Get the OpenAPI spec:
   ```bash
   curl http://localhost:3000/openapi.json > siteminder-spec.json
   ```

2. Import the spec into OpenWebUI's tool configuration

### Step 3: Test the Integration

Once configured, you can use SiteMinder APIs through OpenWebUI:

**Example prompts:**
- "List all SiteMinder agents"
- "Get agent configuration for MyAgent"
- "Show me all authentication schemes"

OpenWebUI will translate these to API calls like:
```
http://localhost:3000/ca/api/sso/services/policy/v1/SmAgents
```

## Architecture Flow

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────┐
│  OpenWebUI  │────────▶│  Wrapper Proxy   │────────▶│  SiteMinder  │
│   (LLM)     │         │  (Port 3000)     │         │   REST API   │
└─────────────┘         └──────────────────┘         └──────────────┘
                               │
                               │ Auto-refresh
                               │ Token every 14min
                               │
                        ┌──────────────┐
                        │ Token Manager│
                        └──────────────┘
```

## Available Endpoints Through Wrapper

All these endpoints are available without authentication (wrapper handles it):

### Generic Object Operations
- `GET /ca/api/sso/services/policy/v1/objects/{id}` - Get object by ID
- `PUT /ca/api/sso/services/policy/v1/objects/{id}` - Update object
- `DELETE /ca/api/sso/services/policy/v1/objects/{id}` - Delete object

### Resource Management
Pattern: `/ca/api/sso/services/policy/v1/{ResourceType}s`

Available resources:
- SmAgents - SiteMinder agents
- SmAuthSchemes - Authentication schemes
- SmAdmins - Administrators
- SmAgentGroups - Agent groups
- SmAgentConfigs - Agent configurations
- And many more...

**Operations:**
- `GET /{ResourceType}s` - List all resources
- `POST /{ResourceType}s` - Create resource
- `GET /{ResourceType}s/{name}` - Get specific resource
- `PUT /{ResourceType}s/{name}` - Update resource
- `DELETE /{ResourceType}s/{name}` - Delete resource

### Example API Calls

```bash
# List all agents
curl http://localhost:3000/ca/api/sso/services/policy/v1/SmAgents

# Get specific agent
curl http://localhost:3000/ca/api/sso/services/policy/v1/SmAgents/WebAgent

# Get agent with expanded details
curl "http://localhost:3000/ca/api/sso/services/policy/v1/SmAgents/WebAgent?expanded=true"

# Create new auth scheme
curl -X POST http://localhost:3000/ca/api/sso/services/policy/v1/SmAuthSchemes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MyAuthScheme",
    "description": "Custom authentication scheme"
  }'
```

## Query Parameters

Some endpoints support optional parameters:
- `expanded=true` - Include expanded details
- `classinfo=true` - Include class information
- `editinfo=true` - Include edit metadata

Example:
```
/ca/api/sso/services/policy/v1/SmAgents/WebAgent?expanded=true&classinfo=true
```

## Monitoring

### Check Wrapper Health
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "tokenStatus": "active",
  "timestamp": "2025-11-13T06:00:00.000Z"
}
```

### Check Detailed Status
```bash
curl http://localhost:3000/status
```

Response:
```json
{
  "service": "siteminder-api-wrapper",
  "version": "1.0.0",
  "status": "running",
  "siteminder": {
    "baseUrl": "https://casso.cx.anapartner.net",
    "tokenStatus": "active",
    "tokenRefreshInterval": "840000ms"
  },
  "timestamp": "2025-11-13T06:00:00.000Z"
}
```

### View Logs
```bash
docker-compose logs -f
```

## Troubleshooting

### OpenWebUI Can't Connect

1. Check if wrapper is running:
   ```bash
   curl http://localhost:3000/health
   ```

2. Check if OpenWebUI can reach the wrapper:
   - If running in Docker, ensure they're on the same network
   - Use container name instead of `localhost` if needed

3. Check logs:
   ```bash
   docker-compose logs -f
   ```

### Token Issues

Check token status:
```bash
curl http://localhost:3000/status | jq '.siteminder.tokenStatus'
```

If token is inactive, check logs for authentication errors.

### API Calls Failing

1. Test the wrapper directly:
   ```bash
   curl http://localhost:3000/ca/api/sso/services/policy/v1/SmAgents
   ```

2. Check if SiteMinder is accessible:
   ```bash
   curl -k https://casso.cx.anapartner.net/ca/api/sso/services/v1/api-doc/CA.SM.json
   ```

## Network Configuration

### Running Wrapper and OpenWebUI in Docker

If both services are in Docker, create a shared network:

```yaml
# docker-compose.yml for combined setup
version: '3.8'

networks:
  shared_network:
    external: true

services:
  siteminder-wrapper:
    # ... wrapper config
    networks:
      - shared_network

  openwebui:
    # ... OpenWebUI config
    networks:
      - shared_network
```

Then reference the wrapper as:
```
http://siteminder-wrapper:3000/openapi.json
```

### Running Wrapper on Different Host

Update the OpenAPI spec URL:
```
http://<wrapper-host-ip>:3000/openapi.json
```

Ensure firewall allows connections to port 3000.

## Security Considerations

1. **Network Access**: The wrapper should only be accessible from OpenWebUI
2. **Environment Variables**: Keep credentials secure in `.env` file
3. **HTTPS**: Consider adding HTTPS/TLS in production
4. **Rate Limiting**: Built-in rate limiting protects the wrapper

## Advanced Configuration

### Custom Token Refresh Interval

Default is 14 minutes (840000ms). Adjust in `.env`:
```bash
TOKEN_REFRESH_INTERVAL=600000  # 10 minutes
```

### Custom Port

Change in `.env`:
```bash
PORT=8080
```

Update OpenWebUI configuration accordingly:
```
http://localhost:8080/openapi.json
```

### Enable Debug Logging

```bash
LOG_LEVEL=debug
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify health: `curl http://localhost:3000/health`
3. Test manually: `curl http://localhost:3000/ca/api/sso/services/policy/v1/SmAgents`
