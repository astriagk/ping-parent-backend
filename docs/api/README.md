# API Documentation Generator

Automatically generate comprehensive API documentation from your route files.

## Overview

This enhanced documentation generator creates three types of documentation:

1. **Postman Collection** - Import-ready API collection with all endpoints
2. **Postman Environment** - Pre-configured environment variables
3. **OpenAPI Spec** - Swagger/OpenAPI 3.0 specification

## Features

✅ **Auto-Discovery** - Scans all `*.routes.ts` files in `src/modules/`
✅ **Smart Versioning** - Semantic versioning with auto-detection
✅ **Request Examples** - Extracts Joi schemas to generate realistic request bodies
✅ **Environment Variables** - Auto-generates Postman environment file
✅ **Smart File Management** - Updates files for patch/minor, creates new files for major versions
✅ **Multi-line Routes** - Handles complex multi-line route definitions
✅ **Authentication Detection** - Automatically detects auth requirements

## Quick Start

### Generate Documentation

```bash
# Auto version bump (detects changes automatically)
npm run docs:generate

# Manual version control
npm run docs:generate -- --bump=patch    # 1.0.0 → 1.0.1 (updates existing files)
npm run docs:generate -- --bump=minor    # 1.0.0 → 1.1.0 (updates existing files)
npm run docs:generate -- --bump=major    # 1.0.0 → 2.0.0 (creates NEW files)

# Specify exact version
npm run docs:generate -- --version=2.5.0
```

### Use Generated Files

1. **Import Postman Collection**
   - Open Postman
   - Click Import → Upload `PP_API_x_x_x.postman_collection.json`

2. **Import Environment**
   - Click Environments → Import → Upload `PP_API_x_x_x.postman_environment.json`
   - Fill in token values (PARENT_TOKEN, DRIVER_TOKEN, etc.)

3. **View OpenAPI Docs**
   - Visit https://editor.swagger.io/
   - Import `PP_API_x_x_x.openapi.yaml`

## Generated Files

```
docs/api/
├── .version.json                           # Version tracking
├── postman/
│   ├── collections/
│   │   ├── PP_API_1_2_0.postman_collection.json  # v1.2.0
│   │   └── PP_API_2_0_1.postman_collection.json  # v2.0.1 (current)
│   └── environments/
│       ├── PP_API_1_2_0.postman_environment.json # v1.2.0
│       └── PP_API_2_0_1.postman_environment.json # v2.0.1 (current)
└── openapi/
    ├── PP_API_1_2_0.openapi.yaml                 # v1.2.0 OpenAPI spec
    └── PP_API_2_0_1.openapi.yaml                 # v2.0.1 (current)
```

### File Versioning Strategy

- **Patch Updates (1.0.0 → 1.0.1)**: Renames `PP_API_1_0_0.*` to `PP_API_1_0_1.*`
- **Minor Updates (1.0.0 → 1.1.0)**: Renames `PP_API_1_0_0.*` to `PP_API_1_1_0.*`
- **Major Updates (1.0.0 → 2.0.0)**: Creates NEW `PP_API_2_0_0.*` files, preserves v1 files

**File Formats:**
- Postman Collection: `.json`
- Postman Environment: `.json`
- OpenAPI Spec: `.yaml` (YAML format)

## Version Tracking

The script maintains version history in `.version.json`:

```json
{
  "current": "1.1.0",
  "history": [
    {
      "version": "1.0.0",
      "timestamp": "2026-01-10T05:00:00.000Z",
      "endpoints": [...],
      "files": {
        "postman": "PP_API_1_0_0.postman_collection.json",
        "environment": "PP_API_1_0_0.postman_environment.json",
        "openapi": "PP_API_1_0_0.openapi.json"
      }
    }
  ]
}
```

## Automatic Version Detection

The script intelligently detects what kind of changes you've made:

- **Major (2.0.0)** - Removed endpoints (breaking changes) → **Creates NEW files**
- **Minor (1.1.0)** - Added new endpoints (new features) → **Renames files**
- **Patch (1.0.1)** - Documentation improvements, no API changes → **Renames files**

### Version Examples

```bash
# Starting with version 1.0.0
npm run docs:generate -- --bump=patch
# → Version: 1.0.1, Files: PP_API_1_0_1.* (renamed from PP_API_1_0_0.*)

npm run docs:generate -- --bump=patch
# → Version: 1.0.2, Files: PP_API_1_0_2.* (renamed from PP_API_1_0_1.*)

npm run docs:generate -- --bump=minor
# → Version: 1.1.0, Files: PP_API_1_1_0.* (renamed from PP_API_1_0_2.*)

npm run docs:generate -- --bump=minor
# → Version: 1.2.0, Files: PP_API_1_2_0.* (renamed from PP_API_1_1_0.*)

npm run docs:generate -- --bump=major
# → Version: 2.0.0, Files: PP_API_2_0_0.* (NEW files, PP_API_1_2_0.* preserved)

npm run docs:generate -- --bump=patch
# → Version: 2.0.1, Files: PP_API_2_0_1.* (renamed from PP_API_2_0_0.*)

npm run docs:generate -- --bump=major
# → Version: 3.0.0, Files: PP_API_3_0_0.* (NEW files, v1 & v2 preserved)
```

## Environment Variables

The generated Postman environment includes:

| Variable | Type | Description |
|----------|------|-------------|
| `BASE_URL` | default | API base URL (http://localhost:3000/api) |
| `PARENT_TOKEN` | secret | Parent authentication JWT |
| `DRIVER_TOKEN` | secret | Driver authentication JWT |
| `ADMIN_TOKEN` | secret | Admin authentication JWT |
| `TOKEN` | secret | General authentication JWT |
| `PARENT_ID` | default | Parent ID for testing |
| `DRIVER_ID` | default | Driver ID for testing |
| `STUDENT_ID` | default | Student ID for testing |
| `TRIP_ID` | default | Trip ID for testing |
| `SCHOOL_ID` | default | School ID for testing |
| `SUBSCRIPTION_ID` | default | Subscription ID for testing |
| `ID` | default | Generic ID parameter |

## How It Works

### 1. Route Discovery
Recursively scans `src/modules/` for all `*.routes.ts` files.

### 2. Route Parsing
Extracts route definitions:
```typescript
router.post(
  "/profile",
  verifyParentToken,
  validate(updateParentProfileSchema),
  updateProfileParent
);
```

Captures:
- HTTP Method: `POST`
- Path: `/profile`
- Auth: `verifyParentToken` → Uses `{{PARENT_TOKEN}}`
- Validation: `updateParentProfileSchema`

### 3. Schema Extraction
Finds and parses Joi validation schemas:
```typescript
export const updateParentProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  photo_url: Joi.string().uri().optional(),
});
```

Generates realistic request body:
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "photo_url": "https://example.com/photo.jpg"
}
```

### 4. Documentation Generation
Creates three synchronized documentation formats with the same version.

## Example Output

### Postman Collection Endpoint
```json
{
  "name": "Update Parent Profile",
  "request": {
    "method": "PUT",
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ],
    "url": {
      "raw": "{{BASE_URL}}/profile",
      "host": ["{{BASE_URL}}"],
      "path": ["profile"]
    },
    "auth": {
      "type": "bearer",
      "bearer": [
        {
          "key": "token",
          "value": "{{PARENT_TOKEN}}",
          "type": "string"
        }
      ]
    },
    "body": {
      "mode": "raw",
      "raw": "{\n  \"name\": \"John Doe\",\n  \"email\": \"user@example.com\",\n  \"photo_url\": \"https://example.com/photo.jpg\"\n}"
    }
  }
}
```

### OpenAPI Spec Endpoint
```yaml
/profile:
  put:
    tags:
      - Users - Parent
    summary: Update Parent Profile
    security:
      - ParentAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              name:
                type: string
                minLength: 2
                maxLength: 100
              email:
                type: string
                format: email
              photo_url:
                type: string
                format: uri
          example:
            name: "John Doe"
            email: "user@example.com"
            photo_url: "https://example.com/photo.jpg"
```

## Troubleshooting

### No endpoints found
- Ensure route files are in `src/modules/` directory
- Check file naming: must end with `.routes.ts`

### Request bodies are empty
- Ensure validation schemas are exported
- Check import path in route file matches validation file
- Validation schema must use `Joi.object()`

### Version not incrementing
- Use `--bump` flag for explicit control
- Check `.version.json` for current version

### Old files being overwritten
- This shouldn't happen - each version creates new files
- Check `.version.json` to see version history

## Best Practices

1. **Run before committing** - Keep docs in sync with code
2. **Use semantic versioning** - Be intentional about version bumps
3. **Fill environment values** - Set real tokens for testing
4. **Document route comments** - Add `// 01. Endpoint Name` comments
5. **Review generated docs** - Verify request/response examples

## Configuration

Edit `scripts/generate-api-docs.js` to customize:

```javascript
const CONFIG = {
  MODULES_DIR: path.join(__dirname, '../src/modules'),
  OUTPUT_DIR: path.join(__dirname, '../docs/api'),
  BASE_NAME: 'PP_API' // Change prefix
};
```

## Support

For issues or questions:
1. Check this README
2. Review generated `.version.json`
3. Check console output for errors
4. Verify route file syntax

---

**Generated by**: Enhanced API Documentation Generator v2.0
**Last Updated**: 2026-01-10
