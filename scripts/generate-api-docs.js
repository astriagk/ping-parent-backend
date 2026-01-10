/**
 * Enhanced API Documentation Generator v2.0
 * Auto-generates Postman Collection, Environment, and OpenAPI spec from route files
 *
 * Features:
 * - ✅ Scans all module route files (not just src/routes)
 * - ✅ Extracts Joi validation schemas for request bodies
 * - ✅ Generates realistic request/response examples
 * - ✅ Creates Postman environment file
 * - ✅ Semantic versioning support (major.minor.patch)
 * - ✅ Incremental versioning (no file overwrite)
 * - ✅ Enhanced route parsing (multi-line support)
 *
 * Run: npm run docs:generate [-- --version=1.0.0] [-- --bump=patch|minor|major]
 */

const fs = require('fs');
const path = require('path');

// Simple JSON to YAML converter
function jsonToYaml(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  let yaml = '';

  if (Array.isArray(obj)) {
    obj.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        yaml += `${spaces}-\n${jsonToYaml(item, indent + 1)}`;
      } else {
        yaml += `${spaces}- ${formatValue(item)}\n`;
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      if (value === undefined) return;

      if (Array.isArray(value)) {
        if (value.length === 0) {
          yaml += `${spaces}${key}: []\n`;
        } else {
          yaml += `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`;
        }
      } else if (typeof value === 'object' && value !== null) {
        yaml += `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`;
      } else {
        yaml += `${spaces}${key}: ${formatValue(value)}\n`;
      }
    });
  }

  return yaml;
}

function formatValue(value) {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') {
    // Escape special characters and quote if necessary
    if (value.includes('\n') || value.includes(':') || value.includes('#')) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  return value;
}

// Configuration
const CONFIG = {
  MODULES_DIR: path.join(__dirname, '../src/modules'),
  OUTPUT_DIR: path.join(__dirname, '../docs/api'),
  POSTMAN_DIR: path.join(__dirname, '../docs/api/postman/collections'),
  ENV_DIR: path.join(__dirname, '../docs/api/postman/environments'),
  OPENAPI_DIR: path.join(__dirname, '../docs/api/openapi'),
  VERSION_FILE: path.join(__dirname, '../docs/api/.version.json'),
  BASE_NAME: 'PP_API'
};

// Ensure directories exist
[CONFIG.MODULES_DIR, CONFIG.OUTPUT_DIR, CONFIG.POSTMAN_DIR, CONFIG.ENV_DIR, CONFIG.OPENAPI_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Ensure version file directory exists
const versionFileDir = path.dirname(CONFIG.VERSION_FILE);
if (!fs.existsSync(versionFileDir)) {
  fs.mkdirSync(versionFileDir, { recursive: true });
}

// Version Management
function getVersionInfo() {
  if (fs.existsSync(CONFIG.VERSION_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG.VERSION_FILE, 'utf-8'));
  }
  return {
    current: '1.0.0',
    history: []
  };
}

function saveVersionInfo(versionInfo) {
  fs.writeFileSync(CONFIG.VERSION_FILE, JSON.stringify(versionInfo, null, 2));
}

function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

function incrementVersion(currentVersion, bumpType = 'patch') {
  const { major, minor, patch } = parseVersion(currentVersion);

  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

function shouldCreateNewFiles(bumpType) {
  // Only create new files for major version bumps
  return bumpType === 'major';
}

function determineVersionBump(oldEndpoints, newEndpoints) {
  const oldPaths = new Set(oldEndpoints.map(e => `${e.method}:${e.route}`));
  const newPaths = new Set(newEndpoints.map(e => `${e.method}:${e.route}`));

  // Check for breaking changes (removed endpoints)
  const removed = [...oldPaths].filter(p => !newPaths.has(p));
  if (removed.length > 0) return 'major';

  // Check for new endpoints
  const added = [...newPaths].filter(p => !oldPaths.has(p));
  if (added.length > 5) return 'minor'; // Significant additions
  if (added.length > 0) return 'minor';

  // Otherwise, it's a patch (documentation improvements, examples, etc.)
  return 'patch';
}

// Enhanced Route File Discovery
function findAllRouteFiles(dir = CONFIG.MODULES_DIR) {
  let routeFiles = [];

  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);

    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.routes.ts')) {
        routeFiles.push(fullPath);
      }
    });
  }

  traverse(dir);
  return routeFiles;
}

// Enhanced Route Parser with multi-line support
function parseRouteFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath, '.routes.ts');
  const modulePath = path.dirname(filePath);
  const endpoints = [];

  // Extract validation file path
  const validationMatch = content.match(/from\s+['"](\.\/[^'"]*\.validation)['"]/);
  let validationSchemas = {};

  if (validationMatch) {
    const validationPath = path.join(modulePath, validationMatch[1] + '.ts');
    if (fs.existsSync(validationPath)) {
      validationSchemas = parseValidationFile(validationPath);
    }
  }

  // Enhanced regex for multi-line route definitions
  const lines = content.split('\n');
  let currentRoute = null;
  let routeBuffer = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Start of route definition
    if (line.match(/^router\.(get|post|put|patch|delete)\(/)) {
      routeBuffer = line;

      // Check if route definition is complete on one line
      if (!line.endsWith(');')) {
        // Multi-line route, continue reading
        for (let j = i + 1; j < lines.length; j++) {
          routeBuffer += ' ' + lines[j].trim();
          if (lines[j].trim().endsWith(');')) {
            i = j;
            break;
          }
        }
      }

      // Parse the complete route definition
      const endpoint = parseRouteDefinition(routeBuffer, fileName, validationSchemas);
      if (endpoint) {
        endpoints.push(endpoint);
      }
    }
  }

  return endpoints;
}

function parseRouteDefinition(routeStr, fileName, validationSchemas) {
  // Extract method
  const methodMatch = routeStr.match(/router\.(get|post|put|patch|delete)/);
  if (!methodMatch) return null;
  const method = methodMatch[1].toUpperCase();

  // Extract route path (allow optional whitespace after opening paren)
  const pathMatch = routeStr.match(/\(\s*["']([^"']+)["']/);
  if (!pathMatch) return null;
  const route = pathMatch[1];

  // Extract all middleware/handlers (everything between parentheses)
  const argsMatch = routeStr.match(/\((.*)\)/s);
  if (!argsMatch) return null;
  const args = argsMatch[1];

  // Determine authentication
  let auth = null;
  if (args.includes('verifyParentToken')) auth = 'parent';
  else if (args.includes('verifyDriverToken')) auth = 'driver';
  else if (args.includes('verifyAdminToken')) auth = 'admin';
  else if (args.includes('verifyToken_Middleware') || args.includes('verifyAuthToken')) auth = 'general';

  // Extract validation schema
  const validateMatch = args.match(/validate\((\w+)\)/);
  let validationSchema = null;
  let requestBodyExample = null;

  if (validateMatch) {
    const schemaName = validateMatch[1];
    validationSchema = validationSchemas[schemaName];
    if (validationSchema) {
      requestBodyExample = generateExampleFromSchema(validationSchema);
    }
  }

  // Extract comment/description (look for comment above route)
  const description = extractRouteDescription(routeStr);

  return {
    name: description || generateEndpointName(method, route, fileName),
    method,
    route,
    auth,
    hasBody: ['POST', 'PUT', 'PATCH'].includes(method),
    validationSchema,
    requestBodyExample,
    fileName
  };
}

function extractRouteDescription(routeStr) {
  // Try to extract comment before route
  const commentMatch = routeStr.match(/\/\/\s*\d+\.\s*(.+)/);
  if (commentMatch) {
    return commentMatch[1].trim();
  }
  return null;
}

// Parse Joi validation schemas
function parseValidationFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const schemas = {};

  // Extract exported schemas
  const exportRegex = /export\s+const\s+(\w+)\s*=\s*Joi\.object\(\{([^}]+(?:\}[^}]+)*)\}\)/gs;
  let match;

  while ((match = exportRegex.exec(content)) !== null) {
    const schemaName = match[1];
    const schemaBody = match[2];
    schemas[schemaName] = parseJoiSchema(schemaBody);
  }

  return schemas;
}

function parseJoiSchema(schemaBody) {
  const fields = {};

  // Parse each field
  const fieldRegex = /(\w+):\s*Joi\.(\w+)\(\)(.*?)(?=,\s*\w+:|$)/gs;
  let match;

  while ((match = fieldRegex.exec(schemaBody)) !== null) {
    const [, fieldName, type, constraints] = match;

    const field = {
      type: mapJoiTypeToJsonType(type),
      required: !constraints.includes('.optional()'),
    };

    // Extract constraints
    if (constraints.includes('.min(')) {
      const minMatch = constraints.match(/\.min\((\d+)\)/);
      if (minMatch) field.min = parseInt(minMatch[1]);
    }
    if (constraints.includes('.max(')) {
      const maxMatch = constraints.match(/\.max\((\d+)\)/);
      if (maxMatch) field.max = parseInt(maxMatch[1]);
    }
    if (constraints.includes('.email()')) {
      field.format = 'email';
    }
    if (constraints.includes('.uri()')) {
      field.format = 'uri';
    }
    if (constraints.includes('.pattern(')) {
      const patternMatch = constraints.match(/\.pattern\((.*?)\)/);
      if (patternMatch) field.pattern = patternMatch[1];
    }

    fields[fieldName] = field;
  }

  return fields;
}

function mapJoiTypeToJsonType(joiType) {
  const typeMap = {
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'array': 'array',
    'object': 'object',
    'date': 'string'
  };
  return typeMap[joiType] || 'string';
}

function generateExampleFromSchema(schema) {
  const example = {};

  Object.entries(schema).forEach(([fieldName, field]) => {
    if (field.type === 'string') {
      if (field.format === 'email') {
        example[fieldName] = 'user@example.com';
      } else if (field.format === 'uri') {
        example[fieldName] = 'https://example.com/photo.jpg';
      } else if (fieldName.includes('phone')) {
        example[fieldName] = '+919876543210';
      } else if (fieldName.includes('otp')) {
        example[fieldName] = '123456';
      } else if (fieldName.includes('name')) {
        example[fieldName] = 'John Doe';
      } else if (fieldName.includes('address')) {
        example[fieldName] = '123 Main Street';
      } else if (fieldName.includes('city')) {
        example[fieldName] = 'Mumbai';
      } else if (fieldName.includes('state')) {
        example[fieldName] = 'Maharashtra';
      } else if (fieldName.includes('pincode') || fieldName.includes('zip')) {
        example[fieldName] = '400001';
      } else {
        example[fieldName] = field.min ? 'a'.repeat(field.min) : 'string';
      }
    } else if (field.type === 'number') {
      if (fieldName.includes('latitude')) {
        example[fieldName] = 19.0760;
      } else if (fieldName.includes('longitude')) {
        example[fieldName] = 72.8777;
      } else if (fieldName.includes('amount') || fieldName.includes('price')) {
        example[fieldName] = 100.00;
      } else {
        example[fieldName] = field.min || 0;
      }
    } else if (field.type === 'boolean') {
      example[fieldName] = false;
    } else if (field.type === 'array') {
      example[fieldName] = [];
    } else if (field.type === 'object') {
      example[fieldName] = {};
    }
  });

  return example;
}

// Generate human-readable endpoint name
function generateEndpointName(method, route, fileName) {
  const methodNames = {
    'GET': 'Get',
    'POST': 'Create',
    'PUT': 'Update',
    'PATCH': 'Update',
    'DELETE': 'Delete'
  };

  const routeParts = route.split('/').filter(p => p && !p.startsWith(':'));
  const resourceName = routeParts[routeParts.length - 1] || fileName;

  return `${methodNames[method]} ${resourceName.replace(/-|_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
}

// Postman Collection Generation
function generatePostmanCollection(categories, version) {
  return {
    info: {
      name: `Ping Parent API v${version}`,
      description: `Auto-generated API collection from route definitions\n\nVersion: ${version}\nGenerated: ${new Date().toISOString()}`,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      version: version
    },
    auth: {
      type: "bearer",
      bearer: [{ key: "token", value: "{{TOKEN}}", type: "string" }]
    },
    item: Object.entries(categories).map(([category, endpoints]) => ({
      name: category,
      item: endpoints.map(convertToPostmanItem)
    }))
  };
}

function convertToPostmanItem(endpoint) {
  const item = {
    name: endpoint.name,
    request: {
      method: endpoint.method,
      header: [],
      url: {
        raw: `{{BASE_URL}}${endpoint.route}`,
        host: ["{{BASE_URL}}"],
        path: endpoint.route.split('/').filter(p => p)
      }
    },
    response: []
  };

  // Add authentication
  if (endpoint.auth) {
    const tokenMap = {
      'parent': '{{PARENT_TOKEN}}',
      'driver': '{{DRIVER_TOKEN}}',
      'admin': '{{ADMIN_TOKEN}}',
      'general': '{{TOKEN}}'
    };

    item.request.auth = {
      type: "bearer",
      bearer: [{
        key: "token",
        value: tokenMap[endpoint.auth] || '{{TOKEN}}',
        type: "string"
      }]
    };
  }

  // Add body for POST/PUT/PATCH with realistic examples
  if (endpoint.hasBody) {
    item.request.header.push({
      key: "Content-Type",
      value: "application/json"
    });

    item.request.body = {
      mode: "raw",
      raw: JSON.stringify(endpoint.requestBodyExample || {}, null, 2)
    };
  }

  // Extract path variables
  const pathVars = endpoint.route.match(/:([^\\/]+)/g);
  if (pathVars) {
    item.request.url.variable = pathVars.map(v => ({
      key: v.substring(1),
      value: `{{${v.substring(1).toUpperCase()}}}`
    }));
  }

  return item;
}

// Postman Environment Generation
function generatePostmanEnvironment(version) {
  return {
    id: `ping-parent-env-${version.replace(/\./g, '-')}`,
    name: `Ping Parent Environment v${version}`,
    values: [
      {
        key: "BASE_URL",
        value: "http://localhost:3000/api",
        type: "default",
        enabled: true
      },
      {
        key: "PARENT_TOKEN",
        value: "",
        type: "secret",
        enabled: true
      },
      {
        key: "DRIVER_TOKEN",
        value: "",
        type: "secret",
        enabled: true
      },
      {
        key: "ADMIN_TOKEN",
        value: "",
        type: "secret",
        enabled: true
      },
      {
        key: "TOKEN",
        value: "",
        type: "secret",
        enabled: true
      },
      {
        key: "PARENT_ID",
        value: "",
        type: "default",
        enabled: true
      },
      {
        key: "DRIVER_ID",
        value: "",
        type: "default",
        enabled: true
      },
      {
        key: "STUDENT_ID",
        value: "",
        type: "default",
        enabled: true
      },
      {
        key: "TRIP_ID",
        value: "",
        type: "default",
        enabled: true
      },
      {
        key: "SCHOOL_ID",
        value: "",
        type: "default",
        enabled: true
      },
      {
        key: "SUBSCRIPTION_ID",
        value: "",
        type: "default",
        enabled: true
      },
      {
        key: "ID",
        value: "",
        type: "default",
        enabled: true
      }
    ],
    _postman_variable_scope: "environment",
    _postman_exported_at: new Date().toISOString(),
    _postman_exported_using: "Ping Parent API Doc Generator v2.0"
  };
}

// OpenAPI/Swagger Generation
function generateSwagger(categories, version) {
  const swagger = {
    openapi: '3.0.0',
    info: {
      title: 'Ping Parent API',
      version: version,
      description: `Auto-generated API documentation from route definitions\n\nGenerated: ${new Date().toISOString()}`,
      contact: {
        name: 'Ping Parent Team'
      }
    },
    servers: [
      { url: 'http://localhost:3000/api', description: 'Local Development' },
      { url: 'https://api.pingparent.com/api', description: 'Production' }
    ],
    components: {
      securitySchemes: {
        ParentAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Parent authentication token'
        },
        DriverAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Driver authentication token'
        },
        AdminAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Admin authentication token'
        }
      },
      schemas: {}
    },
    paths: {},
    tags: []
  };

  // Generate tags
  Object.keys(categories).forEach(category => {
    swagger.tags.push({
      name: category,
      description: `${category} endpoints`
    });
  });

  // Generate paths
  Object.entries(categories).forEach(([category, endpoints]) => {
    endpoints.forEach(endpoint => {
      const pathKey = endpoint.route;
      if (!swagger.paths[pathKey]) {
        swagger.paths[pathKey] = {};
      }

      // Determine security
      const security = [];
      if (endpoint.auth === 'parent') security.push({ ParentAuth: [] });
      if (endpoint.auth === 'driver') security.push({ DriverAuth: [] });
      if (endpoint.auth === 'admin') security.push({ AdminAuth: [] });

      swagger.paths[pathKey][endpoint.method.toLowerCase()] = {
        tags: [category],
        summary: endpoint.name,
        security: security.length > 0 ? security : undefined,
        parameters: generatePathParameters(endpoint.route),
        requestBody: endpoint.hasBody && endpoint.validationSchema ? {
          required: true,
          content: {
            'application/json': {
              schema: convertJoiToJsonSchema(endpoint.validationSchema),
              example: endpoint.requestBodyExample
            }
          }
        } : undefined,
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '201': { description: 'Created successfully' },
          '400': { description: 'Bad request - Validation error' },
          '401': { description: 'Unauthorized - Invalid or missing token' },
          '404': { description: 'Not found' },
          '500': { description: 'Internal server error' }
        }
      };
    });
  });

  return swagger;
}

function convertJoiToJsonSchema(joiSchema) {
  const properties = {};
  const required = [];

  Object.entries(joiSchema).forEach(([fieldName, field]) => {
    const prop = { type: field.type };

    if (field.format) prop.format = field.format;
    if (field.min !== undefined) prop.minLength = field.min;
    if (field.max !== undefined) prop.maxLength = field.max;
    if (field.pattern) prop.pattern = field.pattern;

    properties[fieldName] = prop;

    if (field.required) {
      required.push(fieldName);
    }
  });

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined
  };
}

function generatePathParameters(route) {
  const params = route.match(/:([^\\/]+)/g);
  if (!params) return undefined;

  return params.map(param => ({
    name: param.substring(1),
    in: 'path',
    required: true,
    schema: {
      type: 'string'
    },
    description: `${param.substring(1)} parameter`
  }));
}

// Main execution
// Generate Changelog
function generateChangelog(versionInfo, newVersion, currentEndpoints, bumpType) {
  const lastVersion = versionInfo.history[versionInfo.history.length - 1];
  const lastEndpoints = lastVersion ? lastVersion.endpoints : [];

  // Calculate changes
  const currentPaths = new Set(currentEndpoints.map(e => `${e.method}:${e.route}`));
  const lastPaths = new Set(lastEndpoints.map(e => `${e.method}:${e.route}`));

  const added = currentEndpoints.filter(e => !lastPaths.has(`${e.method}:${e.route}`));
  const removed = lastEndpoints.filter(e => !currentPaths.has(`${e.method}:${e.route}`));

  // Method counts for current version
  const currentMethodCounts = {
    GET: currentEndpoints.filter(e => e.method === 'GET').length,
    POST: currentEndpoints.filter(e => e.method === 'POST').length,
    PUT: currentEndpoints.filter(e => e.method === 'PUT').length,
    PATCH: currentEndpoints.filter(e => e.method === 'PATCH').length,
    DELETE: currentEndpoints.filter(e => e.method === 'DELETE').length,
  };

  // Method counts for last version
  const lastMethodCounts = {
    GET: lastEndpoints.filter(e => e.method === 'GET').length,
    POST: lastEndpoints.filter(e => e.method === 'POST').length,
    PUT: lastEndpoints.filter(e => e.method === 'PUT').length,
    PATCH: lastEndpoints.filter(e => e.method === 'PATCH').length,
    DELETE: lastEndpoints.filter(e => e.method === 'DELETE').length,
  };

  // Build changelog content
  let changelog = `# API Documentation Changelog\n\n`;
  changelog += `> Auto-generated API endpoint version history\n\n`;
  changelog += `**Current Version:** ${newVersion}\n`;
  changelog += `**Last Updated:** ${new Date().toISOString().split('T')[0]}\n\n`;
  changelog += `---\n\n`;

  // Current version section
  changelog += `## Version ${newVersion} (${bumpType.toUpperCase()})\n\n`;
  changelog += `**Released:** ${new Date().toISOString().split('T')[0]}\n\n`;

  // Summary table
  changelog += `### Summary\n\n`;
  changelog += `| Metric | Previous (${lastVersion ? lastVersion.version : 'N/A'}) | Current (${newVersion}) | Change |\n`;
  changelog += `|--------|----------|---------|--------|\n`;
  changelog += `| **Total Endpoints** | ${lastEndpoints.length} | ${currentEndpoints.length} | ${currentEndpoints.length - lastEndpoints.length >= 0 ? '+' : ''}${currentEndpoints.length - lastEndpoints.length} |\n`;
  changelog += `| GET | ${lastMethodCounts.GET} | ${currentMethodCounts.GET} | ${currentMethodCounts.GET - lastMethodCounts.GET >= 0 ? '+' : ''}${currentMethodCounts.GET - lastMethodCounts.GET} |\n`;
  changelog += `| POST | ${lastMethodCounts.POST} | ${currentMethodCounts.POST} | ${currentMethodCounts.POST - lastMethodCounts.POST >= 0 ? '+' : ''}${currentMethodCounts.POST - lastMethodCounts.POST} |\n`;
  changelog += `| PUT | ${lastMethodCounts.PUT} | ${currentMethodCounts.PUT} | ${currentMethodCounts.PUT - lastMethodCounts.PUT >= 0 ? '+' : ''}${currentMethodCounts.PUT - lastMethodCounts.PUT} |\n`;
  changelog += `| PATCH | ${lastMethodCounts.PATCH} | ${currentMethodCounts.PATCH} | ${currentMethodCounts.PATCH - lastMethodCounts.PATCH >= 0 ? '+' : ''}${currentMethodCounts.PATCH - lastMethodCounts.PATCH} |\n`;
  changelog += `| DELETE | ${lastMethodCounts.DELETE} | ${currentMethodCounts.DELETE} | ${currentMethodCounts.DELETE - lastMethodCounts.DELETE >= 0 ? '+' : ''}${currentMethodCounts.DELETE - lastMethodCounts.DELETE} |\n\n`;

  // Changes section
  if (added.length > 0 || removed.length > 0) {
    changelog += `### Changes\n\n`;

    if (added.length > 0) {
      changelog += `#### ✅ Added Endpoints (${added.length})\n\n`;
      changelog += `| Method | Path |\n`;
      changelog += `|--------|------|\n`;
      added.forEach(e => {
        changelog += `| \`${e.method}\` | \`${e.route}\` |\n`;
      });
      changelog += `\n`;
    }

    if (removed.length > 0) {
      changelog += `#### ❌ Removed Endpoints (${removed.length})\n\n`;
      changelog += `| Method | Path |\n`;
      changelog += `|--------|------|\n`;
      removed.forEach(e => {
        changelog += `| \`${e.method}\` | \`${e.route}\` |\n`;
      });
      changelog += `\n`;
    }
  } else {
    changelog += `### Changes\n\n`;
    changelog += `No endpoint changes. This is a patch update (documentation/examples improved).\n\n`;
  }

  changelog += `---\n\n`;

  // Version history
  changelog += `## Version History\n\n`;
  changelog += `| Version | Date | Type | Total Endpoints | GET | POST | PUT | PATCH | DELETE | Changes |\n`;
  changelog += `|---------|------|------|-----------------|-----|------|-----|-------|--------|----------|\n`;

  // Add current version to history
  const allVersions = [...versionInfo.history, {
    version: newVersion,
    timestamp: new Date().toISOString(),
    endpoints: currentEndpoints.map(e => ({ method: e.method, route: e.route })),
    bumpType: bumpType
  }];

  // Reverse to show newest first
  allVersions.reverse().forEach((ver, idx) => {
    const verEndpoints = ver.endpoints || [];
    const verMethodCounts = {
      GET: verEndpoints.filter(e => e.method === 'GET').length,
      POST: verEndpoints.filter(e => e.method === 'POST').length,
      PUT: verEndpoints.filter(e => e.method === 'PUT').length,
      PATCH: verEndpoints.filter(e => e.method === 'PATCH').length,
      DELETE: verEndpoints.filter(e => e.method === 'DELETE').length,
    };

    const date = new Date(ver.timestamp).toISOString().split('T')[0];
    const badge = ver.bumpType ? ver.bumpType.toUpperCase() : 'INITIAL';
    const total = verEndpoints.length;

    // Calculate change from previous version
    let changeText = '-';
    if (idx < allVersions.length - 1) {
      const prevVersion = allVersions[idx + 1];
      const prevEndpoints = prevVersion.endpoints || [];
      const diff = total - prevEndpoints.length;
      if (diff > 0) changeText = `+${diff}`;
      else if (diff < 0) changeText = `${diff}`;
      else changeText = 'No change';
    }

    changelog += `| **${ver.version}** | ${date} | \`${badge}\` | ${total} | ${verMethodCounts.GET} | ${verMethodCounts.POST} | ${verMethodCounts.PUT} | ${verMethodCounts.PATCH} | ${verMethodCounts.DELETE} | ${changeText} |\n`;
  });

  changelog += `\n---\n\n`;
  changelog += `## Notes\n\n`;
  changelog += `- **MAJOR**: Breaking changes (removed endpoints, changed signatures)\n`;
  changelog += `- **MINOR**: New features (added endpoints, backwards-compatible)\n`;
  changelog += `- **PATCH**: Bug fixes and documentation improvements\n\n`;
  changelog += `---\n\n`;
  changelog += `*Generated by API Documentation Generator v2.0*\n`;

  return changelog;
}

function main() {
  console.log('🚀 Starting Enhanced API Documentation Generation v2.0...\n');

  // Parse CLI arguments
  const args = process.argv.slice(2);
  let manualVersion = null;
  let bumpType = null;

  args.forEach(arg => {
    if (arg.startsWith('--version=')) {
      manualVersion = arg.split('=')[1];
    }
    if (arg.startsWith('--bump=')) {
      bumpType = arg.split('=')[1];
    }
  });

  // Find all route files
  console.log('📁 Discovering route files...');
  const routeFiles = findAllRouteFiles();
  console.log(`   Found ${routeFiles.length} route files in modules\n`);

  // Group endpoints by category
  const categories = {};
  let allEndpoints = [];

  routeFiles.forEach(file => {
    const relativePath = path.relative(CONFIG.MODULES_DIR, file);
    const parts = relativePath.split(path.sep);
    const moduleName = parts[0]; // e.g., 'auth', 'users', 'trips'
    const subModule = parts.length > 2 ? parts[1] : null; // e.g., 'parent', 'driver'

    let categoryName;
    if (subModule && subModule !== moduleName) {
      categoryName = `${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} - ${subModule.charAt(0).toUpperCase() + subModule.slice(1)}`;
    } else {
      categoryName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    }

    console.log(`   Processing: ${relativePath}`);
    const endpoints = parseRouteFile(file);

    allEndpoints = allEndpoints.concat(endpoints);

    if (endpoints.length > 0) {
      if (!categories[categoryName]) {
        categories[categoryName] = [];
      }
      categories[categoryName].push(...endpoints);
    }
  });

  console.log(`\n📊 Parsed ${allEndpoints.length} endpoints across ${Object.keys(categories).length} categories`);

  // Show breakdown by HTTP method
  const methodCounts = {
    GET: allEndpoints.filter(e => e.method === 'GET').length,
    POST: allEndpoints.filter(e => e.method === 'POST').length,
    PUT: allEndpoints.filter(e => e.method === 'PUT').length,
    PATCH: allEndpoints.filter(e => e.method === 'PATCH').length,
    DELETE: allEndpoints.filter(e => e.method === 'DELETE').length,
  };

  console.log(`\n📋 HTTP Method Breakdown:`);
  console.log(`   GET:    ${methodCounts.GET} endpoints`);
  console.log(`   POST:   ${methodCounts.POST} endpoints`);
  console.log(`   PUT:    ${methodCounts.PUT} endpoints`);
  console.log(`   PATCH:  ${methodCounts.PATCH} endpoints`);
  console.log(`   DELETE: ${methodCounts.DELETE} endpoints`);

  // Version management
  const versionInfo = getVersionInfo();
  let newVersion;
  let detectedBumpType = bumpType;

  if (manualVersion) {
    newVersion = manualVersion;
    // Determine bump type from manual version
    const currentParsed = parseVersion(versionInfo.current);
    const newParsed = parseVersion(newVersion);
    if (newParsed.major > currentParsed.major) {
      detectedBumpType = 'major';
    } else if (newParsed.minor > currentParsed.minor) {
      detectedBumpType = 'minor';
    } else {
      detectedBumpType = 'patch';
    }
    console.log(`📌 Using manual version: ${newVersion} (${detectedBumpType} change)`);
  } else if (bumpType) {
    newVersion = incrementVersion(versionInfo.current, bumpType);
    console.log(`📈 Bumping ${bumpType} version: ${versionInfo.current} → ${newVersion}`);
  } else {
    // Auto-determine version bump
    const lastGeneration = versionInfo.history[versionInfo.history.length - 1];
    const lastEndpoints = lastGeneration ? lastGeneration.endpoints : [];
    const autoBump = determineVersionBump(lastEndpoints, allEndpoints);
    detectedBumpType = autoBump;
    newVersion = incrementVersion(versionInfo.current, autoBump);
    console.log(`🤖 Auto-detected ${autoBump} changes: ${versionInfo.current} → ${newVersion}`);
  }

  // Determine file naming strategy
  const createNewFiles = shouldCreateNewFiles(detectedBumpType);
  const filePrefix = `${CONFIG.BASE_NAME}_${newVersion.replace(/\./g, '_')}`;

  const postmanFile = path.join(CONFIG.POSTMAN_DIR, `${filePrefix}.postman_collection.json`);
  const envFile = path.join(CONFIG.ENV_DIR, `${filePrefix}.postman_environment.json`);
  const swaggerFile = path.join(CONFIG.OPENAPI_DIR, `${filePrefix}.openapi.yaml`);

  if (createNewFiles) {
    console.log(`\n🆕 Creating NEW files for major version ${newVersion}`);
    console.log(`   Files: ${filePrefix}.*`);
  } else {
    // Patch/Minor: Rename old files to new version
    const oldVersion = versionInfo.current;
    const oldFilePrefix = `${CONFIG.BASE_NAME}_${oldVersion.replace(/\./g, '_')}`;

    const oldPostmanFile = path.join(CONFIG.POSTMAN_DIR, `${oldFilePrefix}.postman_collection.json`);
    const oldEnvFile = path.join(CONFIG.ENV_DIR, `${oldFilePrefix}.postman_environment.json`);
    const oldSwaggerFile = path.join(CONFIG.OPENAPI_DIR, `${oldFilePrefix}.openapi.yaml`);

    console.log(`\n🔄 Renaming files: ${oldFilePrefix}.* → ${filePrefix}.*`);

    // Rename old files if they exist
    if (fs.existsSync(oldPostmanFile)) {
      fs.renameSync(oldPostmanFile, postmanFile);
    }
    if (fs.existsSync(oldEnvFile)) {
      fs.renameSync(oldEnvFile, envFile);
    }
    if (fs.existsSync(oldSwaggerFile)) {
      fs.renameSync(oldSwaggerFile, swaggerFile);
    }
  }

  // Generate documents
  console.log('\n📝 Generating documentation...');

  const postmanCollection = generatePostmanCollection(categories, newVersion);
  fs.writeFileSync(postmanFile, JSON.stringify(postmanCollection, null, 2));
  console.log(`   ✅ Postman Collection: ${path.basename(postmanFile)}`);

  const postmanEnv = generatePostmanEnvironment(newVersion);
  fs.writeFileSync(envFile, JSON.stringify(postmanEnv, null, 2));
  console.log(`   ✅ Postman Environment: ${path.basename(envFile)}`);

  const swagger = generateSwagger(categories, newVersion);
  const swaggerYaml = jsonToYaml(swagger);
  fs.writeFileSync(swaggerFile, swaggerYaml);
  console.log(`   ✅ OpenAPI Spec: ${path.basename(swaggerFile)}`);

  // Generate changelog
  const changelogFile = path.join(CONFIG.OUTPUT_DIR, 'CHANGELOG.md');
  const changelog = generateChangelog(versionInfo, newVersion, allEndpoints, detectedBumpType);
  fs.writeFileSync(changelogFile, changelog);
  console.log(`   ✅ Changelog: ${path.basename(changelogFile)}`);

  // Update version info
  versionInfo.history.push({
    version: newVersion,
    timestamp: new Date().toISOString(),
    bumpType: detectedBumpType,
    endpoints: allEndpoints.map(e => ({ method: e.method, route: e.route })),
    files: {
      postman: path.basename(postmanFile),
      environment: path.basename(envFile),
      openapi: path.basename(swaggerFile)
    }
  });
  versionInfo.current = newVersion;
  saveVersionInfo(versionInfo);

  console.log('\n' + '='.repeat(70));
  console.log('✨ Documentation Generated Successfully!');
  console.log('='.repeat(70));
  console.log(`\n📦 Version: ${newVersion}`);
  console.log(`📊 Total Endpoints: ${allEndpoints.length}`);
  console.log(`📁 Categories: ${Object.keys(categories).length}`);
  console.log(`\n📂 Output Location: ${CONFIG.OUTPUT_DIR}`);
  console.log(`   📋 Collection: ${path.relative(process.cwd(), postmanFile)}`);
  console.log(`   🌍 Environment: ${path.relative(process.cwd(), envFile)}`);
  console.log(`   📖 OpenAPI: ${path.relative(process.cwd(), swaggerFile)}`);
  console.log(`   📝 Changelog: ${path.relative(process.cwd(), changelogFile)}`);

  if (createNewFiles) {
    console.log(`\n🆕 Strategy: Created NEW files for major version`);
    console.log(`   Previous version files are preserved`);
  } else {
    console.log(`\n🔄 Strategy: Renamed files to new version`);
    console.log(`   Old: ${versionInfo.current} → New: ${newVersion}`);
  }

  console.log('\n💡 Next Steps:');
  console.log('   1. Import Postman collection and environment into Postman');
  console.log('   2. Set token values in Postman environment (PARENT_TOKEN, etc.)');
  console.log('   3. View OpenAPI docs at: https://editor.swagger.io/');
  if (createNewFiles) {
    console.log('   4. Major version - import new files alongside old version');
  } else {
    console.log('   4. Patch/Minor - file renamed automatically (Postman auto-detects)');
  }

  console.log('\n🔧 Usage:');
  console.log('   npm run docs:generate                    # Auto version bump');
  console.log('   npm run docs:generate -- --bump=patch    # Patch: 1.0.0 → 1.0.1 (renames files)');
  console.log('   npm run docs:generate -- --bump=minor    # Minor: 1.0.0 → 1.1.0 (renames files)');
  console.log('   npm run docs:generate -- --bump=major    # Major: 1.0.0 → 2.0.0 (NEW files)');
  console.log('   npm run docs:generate -- --version=2.5.0 # Manual version\n');
}

// Run
try {
  main();
} catch (error) {
  console.error('❌ Error generating docs:', error.message);
  console.error(error.stack);
  process.exit(1);
}
