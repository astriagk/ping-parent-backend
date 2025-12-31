/**
 * Auto-generate Postman Collection and OpenAPI spec from route files
 * Run: node scripts/generate-api-docs.js
 */

const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, '../src/routes');
const OUTPUT_DIR = path.join(__dirname, '../docs/v1/api/postman/collections');
const OPENAPI_OUTPUT = path.join(__dirname, '../docs/v1/api/openapi/swagger.yaml');

// Postman collection template
const postmanCollection = {
  info: {
    name: "Ping Parent API - Auto-Generated",
    description: "Auto-generated API collection from route definitions",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: {
    type: "bearer",
    bearer: [{ key: "token", value: "{{TOKEN}}", type: "string" }]
  },
  item: []
};

// Authentication mapping
const authMap = {
  'verifyParentToken': '{{PARENT1_TOKEN}}',
  'verifyDriverToken': '{{DRIVER1_TOKEN}}',
  'verifyAdminToken': '{{ADMIN_TOKEN}}',
  'verifyToken_Middleware': '{{TOKEN}}',
};

// Parse route files and extract endpoints
function parseRouteFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath, '.routes.ts');
  const endpoints = [];

  // Extract route definitions using regex
  const routeRegex = /router\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']\s*(?:,\s*([^,\)]+))*\)/g;
  let match;

  while ((match = routeRegex.exec(content)) !== null) {
    const [, method, route, middlewares = ''] = match;

    // Determine authentication
    let auth = null;
    if (middlewares.includes('verifyParentToken')) auth = authMap.verifyParentToken;
    else if (middlewares.includes('verifyDriverToken')) auth = authMap.verifyDriverToken;
    else if (middlewares.includes('verifyAdminToken')) auth = authMap.verifyAdminToken;
    else if (middlewares.includes('verifyToken_Middleware')) auth = authMap['verifyToken_Middleware'];

    endpoints.push({
      name: generateEndpointName(method, route, fileName),
      method: method.toUpperCase(),
      route: route,
      auth: auth,
      hasBody: ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())
    });
  }

  return endpoints;
}

// Generate human-readable endpoint name
function generateEndpointName(method, route, fileName) {
  const methodNames = {
    'get': 'Get',
    'post': 'Create',
    'put': 'Update',
    'patch': 'Update',
    'delete': 'Delete'
  };

  const routeParts = route.split('/').filter(p => p && !p.startsWith(':'));
  const resourceName = routeParts[routeParts.length - 1] || fileName;

  return `${methodNames[method]} ${resourceName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
}

// Convert route to Postman format
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
    item.request.auth = {
      type: "bearer",
      bearer: [{ key: "token", value: endpoint.auth, type: "string" }]
    };
  }

  // Add body for POST/PUT/PATCH
  if (endpoint.hasBody) {
    item.request.header.push({
      key: "Content-Type",
      value: "application/json"
    });
    item.request.body = {
      mode: "raw",
      raw: "{}"
    };
  }

  // Extract path variables
  const pathVars = endpoint.route.match(/:([^\/]+)/g);
  if (pathVars) {
    item.request.url.variable = pathVars.map(v => ({
      key: v.substring(1),
      value: `{{${v.substring(1).toUpperCase()}}}`
    }));
  }

  return item;
}

// Convert endpoints to OpenAPI/Swagger format
function generateSwagger(categories) {
  const swagger = {
    openapi: '3.0.0',
    info: {
      title: 'Ping Parent API',
      version: '1.0.0',
      description: 'Auto-generated API documentation from route definitions',
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
      }
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
      if (endpoint.auth === authMap.verifyParentToken) security.push({ ParentAuth: [] });
      if (endpoint.auth === authMap.verifyDriverToken) security.push({ DriverAuth: [] });
      if (endpoint.auth === authMap.verifyAdminToken) security.push({ AdminAuth: [] });

      swagger.paths[pathKey][endpoint.method.toLowerCase()] = {
        tags: [category],
        summary: endpoint.name,
        security: security.length > 0 ? security : undefined,
        parameters: generatePathParameters(endpoint.route),
        requestBody: endpoint.hasBody ? {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {}
              }
            }
          }
        } : undefined,
        responses: {
          '200': { description: 'Successful response' },
          '201': { description: 'Created successfully' },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Not found' },
          '500': { description: 'Internal server error' }
        }
      };
    });
  });

  return swagger;
}

// Generate path parameters for OpenAPI
function generatePathParameters(route) {
  const params = route.match(/:([^\/]+)/g);
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
function generateDocs() {
  console.log('🚀 Starting API documentation generation...\n');

  // Read all route files
  const routeFiles = fs.readdirSync(ROUTES_DIR)
    .filter(file => file.endsWith('.routes.ts'));

  console.log(`📁 Found ${routeFiles.length} route files\n`);

  // Group endpoints by category
  const categories = {};

  routeFiles.forEach(file => {
    const filePath = path.join(ROUTES_DIR, file);
    const fileName = path.basename(file, '.routes.ts');
    const categoryName = fileName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' APIs';

    console.log(`   Processing: ${file}`);
    const endpoints = parseRouteFile(filePath);

    if (endpoints.length > 0) {
      categories[categoryName] = endpoints;
    }
  });

  // Build Postman collection
  Object.entries(categories).forEach(([category, endpoints]) => {
    postmanCollection.item.push({
      name: category,
      item: endpoints.map(convertToPostmanItem)
    });
  });

  // Write Postman collection
  const outputPath = path.join(OUTPUT_DIR, 'Ping_Parent_API_AutoGenerated.postman_collection.json');
  fs.writeFileSync(outputPath, JSON.stringify(postmanCollection, null, 2));

  // Generate and write Swagger/OpenAPI
  const swagger = generateSwagger(categories);
  const swaggerPath = path.join(path.dirname(OPENAPI_OUTPUT), 'swagger_generated.json');
  fs.writeFileSync(swaggerPath, JSON.stringify(swagger, null, 2));

  console.log(`\n✅ Postman collection generated: ${outputPath}`);
  console.log(`✅ Swagger/OpenAPI generated: ${swaggerPath}`);
  console.log(`📊 Total endpoints: ${Object.values(categories).flat().length}`);
  console.log(`📁 Total categories: ${Object.keys(categories).length}\n`);

  console.log('💡 Next steps:');
  console.log('   1. Import Postman collection: Import the JSON file into Postman');
  console.log('   2. View Swagger docs: Import swagger_generated.json into Swagger UI');
  console.log('   3. Run "npm run docs:generate" whenever routes change\n');
}

// Run
try {
  generateDocs();
} catch (error) {
  console.error('❌ Error generating docs:', error.message);
  process.exit(1);
}
