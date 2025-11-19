# OpenAPI Converter - Single Script Solution

## Overview
This converter transforms SiteMinder's Swagger 2.0 specification into a fully compatible OpenAPI 3.0 format for Open WebUI integration.

## Single Command Usage

```bash
node convert-swagger.js
```

This single script:
1. ✅ Reads `siteminder-swagger-original.json` (Swagger 2.0)
2. ✅ Resolves all `$ref` parameter references
3. ✅ Converts to proper OpenAPI 3.0 format
4. ✅ Filters invalid parameters (without `name` field)
5. ✅ Adds custom description for the wrapper
6. ✅ Removes security definitions (handled by wrapper)
7. ✅ Outputs `openapi.json` ready for Open WebUI

## What It Fixes

### Problem: Missing Parameter Names
Swagger 2.0 uses `$ref` for global parameters:
```json
{
  "$ref": "#/parameters/expanded"
}
```

### Solution: Resolve and Convert
The converter resolves these to full parameter objects:
```json
{
  "name": "expanded",
  "in": "query",
  "required": false,
  "description": "return the object while expanding all objects...",
  "schema": {
    "type": "boolean"
  }
}
```

## Output

**File:** `openapi.json` (510KB)

**Includes:**
- 139 API endpoints (all SiteMinder operations)
- 72 schema definitions
- 415 valid parameters (100% have `name` field)
- 62 tags for organization
- Custom wrapper description
- No authentication required

## Integration

The generated `openapi.json` is:
1. **Served by wrapper** at: `http://localhost:3001/openapi.json`
2. **Compatible with Open WebUI** - no `KeyError: 'name'` errors
3. **Auto-updated** - Just re-run the script to regenerate

## Files

- **convert-swagger.js** - Single converter script (5.8KB)
- **siteminder-swagger-original.json** - Source Swagger 2.0 (483KB)
- **openapi.json** - Output OpenAPI 3.0 (510KB)

