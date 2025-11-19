# SiteMinder OpenAPI Integration - Fixed for Open WebUI

## ✅ Issue Resolved
**Problem:** Open WebUI was throwing `KeyError: 'name'` when parsing parameters
**Root Cause:** Parameters were in Swagger 2.0 format (`type` at root level) instead of OpenAPI 3.0 format (`type` inside `schema` object)

## Fixed OpenAPI Specification

### File Details
- **File:** `openapi.json`
- **Size:** 466KB
- **Format:** OpenAPI 3.0.0
- **Total Endpoints:** 139
- **Total Schemas:** 72

### Parameter Structure (Now Fixed)

**Before (Swagger 2.0 - WRONG):**
```json
{
  "name": "id",
  "in": "path",
  "required": true,
  "type": "string"
}
```

**After (OpenAPI 3.0 - CORRECT):**
```json
{
  "name": "id",
  "in": "path",
  "required": true,
  "description": "ID of object",
  "schema": {
    "type": "string"
  }
}
```

## How to Use with Open WebUI

### Option 1: Direct URL (Recommended)
Point Open WebUI to: `http://localhost:3001/openapi.json`

The endpoint will:
- Load the static `openapi.json` file with all 139 operations
- Dynamically set the server URL based on the request hostname
- Serve the spec compatible with Open WebUI's parser

### Option 2: Static File
Use the file directly: `/home/madhu_telugu/siteminder-api-wrapper/openapi.json`

## Docker Container

### Current Setup
```bash
# Container is running with:
- Port mapping: 3001:3000
- Volume mount: ./openapi.json:/app/openapi.json
- Host mapping: casso.cx.anapartner.net:host-gateway
```

### Restart Container (if needed)
```bash
sudo docker restart siteminder-wrapper
```

## API Coverage

The OpenAPI spec includes all SiteMinder REST API operations:

**Object Management:**
- Generic object operations (CRUD)
- SmAgents, SmDomains, SmRealms
- SmUserDirectories
- SmAuthSchemes, SmPolicies, SmRules

**Advanced Objects:**
- Federation (SmAffiliateDomain, SmExternalOIDCProviderConfig)
- Access Gateway (EpmApplication, EpmRole)
- Identity Mapping (SmIdentityMapping, SmAzIdentityMappingEntry)
- Session Management (SmSessionAssurance)
- And 50+ more object types

## Files in Repository

1. **openapi.json** - Final OpenAPI 3.0 spec (USE THIS)
2. **siteminder-swagger-original.json** - Original Swagger 2.0 from SiteMinder
3. **siteminder-openapi3.json** - Intermediate conversion
4. **public-openapi.json** - Old working version (reference)
5. **convert-swagger.js** - Conversion script
6. **finalize-openapi.js** - Finalization script

## Verification

Test the endpoint:
```bash
curl http://localhost:3001/openapi.json | jq '.info.title, (.paths | keys | length)'
```

Expected output:
```
"SiteMinder REST Services"
139
```
