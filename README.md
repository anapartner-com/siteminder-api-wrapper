# SiteMinder API Wrapper

A production-grade proxy wrapper for SiteMinder REST APIs that handles automatic token refresh and exposes OpenAPI specs for consumption by tools like OpenWebUI.

## Features

- **Automatic Token Management**: Handles SiteMinder's 15-minute token expiration with automatic refresh every 14 minutes
- **Transparent Proxy**: Pass-through proxy for all SiteMinder API requests with automatic Bearer token injection
- **OpenAPI Spec Exposure**: Exposes SiteMinder's OpenAPI specification at `/openapi.json` for tool consumption
- **Health Checks**: Built-in health check and status endpoints
- **Docker Ready**: Production-ready Docker container with health checks
- **Clean Architecture**: Config-driven, production-grade implementation

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
cd siteminder-api-wrapper
```

2. Create `.env` file (or use defaults):
```bash
cp .env.example .env
# Edit .env with your credentials if needed
```

3. Start the service:
```bash
docker-compose up -d
```

4. Verify it's running:
```bash
curl http://localhost:3000/health
```

### Using Docker

```bash
docker build -t siteminder-api-wrapper .

docker run -d \
  -p 3000:3000 \
  -e SITEMINDER_BASE_URL=https://casso.cx.anapartner.net \
  -e SITEMINDER_USERNAME=siteminder \
  -e SITEMINDER_PASSWORD=anaPassword01 \
  --name siteminder-wrapper \
  siteminder-api-wrapper
```

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```

## Usage

### Endpoints

#### Wrapper-Specific Endpoints

- **Health Check**: `GET /health`
  - Returns service health and token status

- **Status**: `GET /status`
  - Returns detailed service information

- **OpenAPI Spec**: `GET /openapi.json`
  - Returns SiteMinder's OpenAPI specification (modified to point to this wrapper)
  - Use this URL in OpenWebUI or other tools

- **Swagger UI**: `GET /api-docs`
  - Interactive API documentation

#### Proxied SiteMinder Endpoints

All SiteMinder API endpoints are proxied through this wrapper:

```
http://localhost:3000/ca/api/sso/services/policy/v1/*
```

Examples:

```bash
# List all agents
curl http://localhost:3000/ca/api/sso/services/policy/v1/SmAgents

# Get specific agent
curl http://localhost:3000/ca/api/sso/services/policy/v1/SmAgents/MyAgent

# Get object by ID
curl http://localhost:3000/ca/api/sso/services/policy/v1/objects/{id}

# Create a new resource
curl -X POST http://localhost:3000/ca/api/sso/services/policy/v1/SmAgents \
  -H "Content-Type: application/json" \
  -d '{"name": "NewAgent", ...}'
```

**Note**: You don't need to provide authentication headers - the wrapper handles that automatically!

### Integrating with OpenWebUI

1. Start the wrapper service
2. In OpenWebUI, add a new tool/function
3. Use the OpenAPI spec URL: `http://<your-host>:3000/openapi.json`
4. OpenWebUI will automatically consume the API and handle requests through the wrapper

The wrapper transparently:
- Manages token refresh every 14 minutes
- Injects Bearer token into all requests
- Proxies requests to SiteMinder
- Returns responses as-is

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `SITEMINDER_BASE_URL` | `https://casso.cx.anapartner.net` | SiteMinder base URL |
| `SITEMINDER_USERNAME` | `siteminder` | SiteMinder admin username |
| `SITEMINDER_PASSWORD` | `anaPassword01` | SiteMinder admin password |
| `TOKEN_REFRESH_INTERVAL` | `840000` | Token refresh interval in ms (14 min) |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |

## Architecture

```
┌──────────────┐         ┌─────────────────┐         ┌─────────────┐
│              │         │                 │         │             │
│   OpenWebUI  │────────▶│  API Wrapper    │────────▶│ SiteMinder  │
│              │         │  (This Service) │         │             │
└──────────────┘         └─────────────────┘         └─────────────┘
                                │
                                │ Auto-refresh
                                │ every 14 min
                                ▼
                         ┌──────────────┐
                         │ Token Manager│
                         └──────────────┘
```

### Components

1. **Token Manager**: Handles authentication and automatic token refresh
2. **Proxy Middleware**: Injects Bearer token and forwards requests to SiteMinder
3. **Routes**: Exposes health, status, and OpenAPI spec endpoints
4. **Config**: Centralized configuration management

## Development

### Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

### Project Structure

```
siteminder-api-wrapper/
├── src/
│   ├── config/           # Configuration management
│   ├── middleware/       # Express middleware (proxy)
│   ├── routes/           # API routes (health, status, openapi)
│   ├── services/         # Business logic (token manager)
│   ├── utils/            # Utilities (logger)
│   └── index.ts          # Application entry point
├── Dockerfile            # Docker image definition
├── docker-compose.yml    # Docker Compose configuration
├── package.json          # NPM dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Security Considerations

- Uses HTTPS for communication with SiteMinder
- Credentials stored in environment variables (never in code)
- Non-root user in Docker container
- Helmet.js for security headers
- CORS enabled (configure as needed)

## Troubleshooting

### Token Issues

Check token status:
```bash
curl http://localhost:3000/status
```

View logs:
```bash
docker-compose logs -f
```

### Connection Issues

Verify SiteMinder is accessible:
```bash
curl -k https://casso.cx.anapartner.net/ca/api/sso/services/v1/api-doc/CA.SM.json
```

### Container Issues

Check container health:
```bash
docker ps
docker inspect siteminder-api-wrapper
```

## License

MIT
