# Quick Start Guide

Get the SiteMinder API Wrapper running in under 2 minutes!

## Prerequisites

- Docker and docker-compose installed
- Access to SiteMinder instance

## 1. Start the Service

```bash
./start.sh
```

Or manually:
```bash
docker-compose up -d
```

## 2. Verify It's Running

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "tokenStatus": "active",
  "timestamp": "2025-11-13T06:00:00.000Z"
}
```

## 3. Get OpenAPI Spec

```bash
curl http://localhost:3000/openapi.json
```

This is the URL to provide to OpenWebUI!

## 4. Test an API Call

```bash
# List all agents (no auth needed!)
curl http://localhost:3000/ca/api/sso/services/policy/v1/SmAgents
```

## 5. Use in OpenWebUI

In OpenWebUI, add the tool using:
```
http://localhost:3000/openapi.json
```

Or if wrapper is on different host:
```
http://<your-host-ip>:3000/openapi.json
```

## What's Happening?

✅ Wrapper authenticates with SiteMinder using Basic Auth
✅ Gets JWT Bearer token
✅ Automatically refreshes token every 14 minutes
✅ Proxies all your requests with token injection
✅ Exposes OpenAPI spec for tool consumption

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Check status
curl http://localhost:3000/status

# Stop service
docker-compose down

# Restart service
docker-compose restart

# Rebuild after changes
docker-compose up -d --build
```

## Project Structure

```
siteminder-api-wrapper/
├── src/
│   ├── config/           # Configuration management
│   ├── middleware/       # Proxy with token injection
│   ├── routes/           # Health, status, OpenAPI endpoints
│   ├── services/         # Token manager (auto-refresh)
│   └── utils/            # Logger and utilities
├── Dockerfile            # Production Docker image
├── docker-compose.yml    # Docker orchestration
├── .env                  # Configuration (credentials)
└── README.md            # Full documentation
```

## Troubleshooting

### Service won't start
```bash
docker-compose logs
```

### Token issues
```bash
curl http://localhost:3000/status | jq
```

### Can't connect from OpenWebUI
- Check network connectivity
- If using Docker networks, use container name
- Verify port 3000 is accessible

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [OPENWEBUI_INTEGRATION.md](OPENWEBUI_INTEGRATION.md) for integration details
- Customize `.env` for your environment

That's it! Your SiteMinder API is now accessible without worrying about token expiration. 🎉
