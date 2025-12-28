# Swagger UI Setup Guide

This guide explains how to set up and use Swagger UI for the Ping Parent Backend API.

## Overview

The project uses OpenAPI 3.0 specification documented in `docs/swagger.yaml`. Swagger UI provides an interactive interface to explore and test the API.

## Option 1: Using Swagger Editor (Recommended for Development)

1. **Visit Swagger Editor Online**:
   - Go to [https://editor.swagger.io/](https://editor.swagger.io/)

2. **Load the Swagger File**:
   - Click **File** → **Import file**
   - Select `docs/swagger.yaml` from your project
   - OR copy the entire contents of `swagger.yaml` and paste it

3. **Explore the API**:
   - The right panel shows the rendered documentation
   - You can test endpoints directly from the UI
   - Select the appropriate server (local/staging/production)

## Option 2: Integrating Swagger UI into the Express App

### Installation

Install the required dependencies:

```bash
npm install swagger-ui-express yamljs --save
npm install @types/swagger-ui-express @types/yamljs --save-dev
```

### Configuration

**1. Create Swagger configuration file** (`src/config/swagger.ts`):

```typescript
import path from "path";
import YAML from "yamljs";

// Load swagger.yaml file
const swaggerDocument = YAML.load(
  path.join(__dirname, "../../docs/swagger.yaml"),
);

export const swaggerOptions = {
  swaggerOptions: {
    persistAuthorization: true,
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 50px 0; }
    .swagger-ui .info .title { font-size: 36px; }
  `,
  customSiteTitle: "Ping Parent API Documentation",
};

export default swaggerDocument;
```

**2. Update `src/app.ts` or `src/server.ts`**:

```typescript
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerDocument, { swaggerOptions } from "./config/swagger";

const app = express();

// ... other middleware

// Swagger UI route
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, swaggerOptions),
);

// ... other routes

export default app;
```

### Access Swagger UI

After starting the server:

```bash
npm run dev
```

Visit: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Option 3: Using VS Code Extension

1. **Install Extension**:
   - Install "Swagger Viewer" extension in VS Code
   - Extension ID: `Arjun.swagger-viewer`

2. **View Documentation**:
   - Open `docs/swagger.yaml`
   - Press `Shift + Alt + P` (Windows/Linux) or `Shift + Option + P` (Mac)
   - Or right-click and select "Preview Swagger"

## Testing API Endpoints

### Using Swagger UI

1. **Authenticate**:
   - Click the **Authorize** button at the top
   - Enter your Bearer token: `Bearer <your_token>`
   - Click **Authorize** → **Close**

2. **Test an Endpoint**:
   - Expand the endpoint (e.g., `POST /auth/login`)
   - Click **Try it out**
   - Fill in the request body
   - Click **Execute**
   - View the response

### Getting a Test Token

Use the login endpoint to get a token:

```bash
# Register or login to get a token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Copy the `accessToken` from the response and use it in Swagger UI.

## Environment-Specific Testing

The Swagger file includes server configurations for different environments:

- **Development**: `http://localhost:3000/api`
- **Staging**: `https://staging-api.pingparent.com/api`
- **Production**: `https://api.pingparent.com/api`

To switch environments:
1. Click the **Servers** dropdown in Swagger UI
2. Select the desired environment

## Updating Swagger Documentation

When you add new endpoints:

1. **Update swagger.yaml**:
   - Add schema definitions in `components.schemas`
   - Add endpoint paths in `paths`

2. **Validate YAML**:
   ```bash
   # Use online validator
   https://www.yamllint.com/
   ```

3. **Test in Swagger Editor**:
   - Paste updated content in [https://editor.swagger.io/](https://editor.swagger.io/)
   - Verify no errors appear

4. **Reload in browser** (if using integrated Swagger UI):
   - Restart the development server
   - Refresh the `/api-docs` page

## Troubleshooting

### Swagger UI not loading

**Issue**: Blank page or error on `/api-docs`

**Solution**:
- Verify `swagger.yaml` has no syntax errors
- Check that the YAML file path in `swagger.ts` is correct
- Ensure `swagger-ui-express` and `yamljs` are installed

### Schema reference errors

**Issue**: `Could not resolve reference: #/components/schemas/Something`

**Solution**:
- Verify the schema is defined in `components.schemas`
- Check for typos in schema names
- Ensure proper YAML indentation

### Authentication not working

**Issue**: 401 Unauthorized errors when testing

**Solution**:
- Ensure you clicked **Authorize** and entered the Bearer token
- Verify the token is valid and not expired
- Include "Bearer " prefix before the token

### CORS errors when testing

**Issue**: CORS errors in browser console

**Solution**:
- Ensure CORS is enabled in your Express app
- Add appropriate headers for Swagger UI origin
- For local testing, allow `http://localhost:3000`

## Best Practices

1. **Keep Swagger in sync**: Update `swagger.yaml` whenever you modify API endpoints
2. **Test before committing**: Validate YAML and test endpoints in Swagger UI
3. **Use examples**: Provide realistic example values for better developer experience
4. **Document errors**: Include all possible error responses (400, 401, 404, 409, 500)
5. **Version control**: Always commit `swagger.yaml` changes with related code changes

## Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/)
- [Swagger UI Express](https://github.com/scottie1984/swagger-ui-express)
- [YAML Syntax Guide](https://yaml.org/spec/1.2.2/)
