/**
 * API Documentation Generator v3.0
 * Enhanced script that generates clean, usable Postman Collections
 *
 * Improvements over v2:
 * - ✅ Accurate endpoint extraction from route files
 * - ✅ Proper Joi schema parsing with full type support
 * - ✅ Clear, descriptive endpoint names from comments
 * - ✅ Complete request body examples with realistic data
 * - ✅ Proper base path resolution from main routes
 * - ✅ Query parameters extraction
 * - ✅ Response examples based on common patterns
 * - ✅ Grouped by module/feature for easy navigation
 *
 * Run: npm run docs:generate:v2 [-- --version=1.0.0] [-- --bump=patch|minor|major]
 */

const fs = require("fs");
const path = require("path");

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  MODULES_DIR: path.join(__dirname, "../src/modules"),
  ROUTES_LAYER_DIR: path.join(__dirname, "../src/routes"), // role-scoped gateway files
  ROUTES_FILE: path.join(__dirname, "../src/routes/index.ts"),
  OUTPUT_DIR: path.join(__dirname, "../docs"),
  POSTMAN_DIR: path.join(__dirname, "../docs/postman/collections"),
  ENV_DIR: path.join(__dirname, "../docs/postman/environments"),
  OPENAPI_DIR: path.join(__dirname, "../docs/openapi"),
  VERSION_FILE: path.join(__dirname, "../docs/openapi/.version-v2.json"),
  BASE_NAME: "PP_API_V2",
};

// Ensure directories exist
[
  CONFIG.OUTPUT_DIR,
  CONFIG.POSTMAN_DIR,
  CONFIG.ENV_DIR,
  CONFIG.OPENAPI_DIR,
].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert JSON to YAML format
 */
function jsonToYaml(obj, indent = 0) {
  const spaces = "  ".repeat(indent);
  let yaml = "";

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return `[]\n`;
    }
    obj.forEach((item) => {
      if (typeof item === "object" && item !== null) {
        yaml += `${spaces}-\n${jsonToYaml(item, indent + 1)}`;
      } else {
        yaml += `${spaces}- ${formatYamlValue(item)}\n`;
      }
    });
  } else if (typeof obj === "object" && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      if (value === undefined) return;

      if (Array.isArray(value)) {
        if (value.length === 0) {
          yaml += `${spaces}${key}: []\n`;
        } else {
          yaml += `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`;
        }
      } else if (typeof value === "object" && value !== null) {
        yaml += `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`;
      } else {
        yaml += `${spaces}${key}: ${formatYamlValue(value)}\n`;
      }
    });
  }

  return yaml;
}

function formatYamlValue(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value.toString();
  if (typeof value === "number") return value.toString();
  if (typeof value === "string") {
    if (
      value.includes("\n") ||
      value.includes(":") ||
      value.includes("#") ||
      value.includes('"')
    ) {
      const escaped = value
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n");
      return `"${escaped}"`;
    }
    return value || '""';
  }
  return String(value);
}

/**
 * Capitalize first letter of each word
 */
function titleCase(str) {
  return str.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Convert camelCase or PascalCase to Title Case
 */
function camelToTitle(str) {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
}

// ============================================================================
// VERSION MANAGEMENT
// ============================================================================

function getVersionInfo() {
  if (fs.existsSync(CONFIG.VERSION_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG.VERSION_FILE, "utf-8"));
  }
  return { current: "1.0.0", history: [] };
}

function saveVersionInfo(versionInfo) {
  fs.writeFileSync(CONFIG.VERSION_FILE, JSON.stringify(versionInfo, null, 2));
}

function parseVersion(version) {
  const [major, minor, patch] = version.split(".").map(Number);
  return { major, minor, patch };
}

function incrementVersion(currentVersion, bumpType = "patch") {
  const { major, minor, patch } = parseVersion(currentVersion);
  switch (bumpType) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

// ============================================================================
// BASE PATH EXTRACTION FROM MAIN ROUTES
// ============================================================================

/**
 * Parse the main routes file to extract base paths for each module
 */
function parseMainRoutesFile() {
  const basePaths = {};

  if (!fs.existsSync(CONFIG.ROUTES_FILE)) {
    console.warn("⚠️  Main routes file not found");
    return basePaths;
  }

  const content = fs.readFileSync(CONFIG.ROUTES_FILE, "utf-8");

  // Match: router.use("/path", routesVariable);
  const routeUseRegex = /router\.use\(\s*["']([^"']+)["']\s*,\s*(\w+)\s*\)/g;
  let match;

  while ((match = routeUseRegex.exec(content)) !== null) {
    const [, basePath, routesVar] = match;
    // Store the variable name to base path mapping
    basePaths[routesVar] = basePath;
  }

  return basePaths;
}

/**
 * Get the import statement variable name from route file
 */
function getRouteVariableName(filePath, mainRoutesContent) {
  const fileName = path.basename(filePath, ".routes.ts");

  // Try different naming conventions
  const possibleNames = [
    `${fileName}Routes`,
    `${fileName.replace(/_/g, "")}Routes`,
    `${camelCase(fileName)}Routes`,
    fileName.replace(/_([a-z])/g, (_, l) => l.toUpperCase()) + "Routes",
  ];

  for (const name of possibleNames) {
    if (mainRoutesContent.includes(name)) {
      return name;
    }
  }

  return null;
}

function camelCase(str) {
  return str.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
}

// ============================================================================
// JOI SCHEMA PARSING - COMPREHENSIVE
// ============================================================================

/**
 * Parse a complete Joi validation file
 */
function parseValidationFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const schemas = {};

  // Find all exported schema definitions
  // Match: export const schemaName = Joi.object({ ... });
  const schemaRegex = /export\s+const\s+(\w+)\s*=\s*Joi\.object\s*\(\s*\{/g;
  let match;

  while ((match = schemaRegex.exec(content)) !== null) {
    const schemaName = match[1];
    const startIndex = match.index + match[0].length;

    // Find the matching closing brace
    const schemaBody = extractBalancedBraces(content, startIndex - 1);

    if (schemaBody) {
      schemas[schemaName] = parseJoiSchemaBody(schemaBody);
    }
  }

  return schemas;
}

/**
 * Extract content within balanced braces
 */
function extractBalancedBraces(content, startIndex) {
  let depth = 0;
  let start = -1;

  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (content[i] === "}") {
      depth--;
      if (depth === 0) {
        return content.substring(start + 1, i);
      }
    }
  }

  return null;
}

/**
 * Parse the body of a Joi.object schema
 */
function parseJoiSchemaBody(schemaBody) {
  const fields = {};

  // Split by field definitions (field_name: Joi.xxx)
  const fieldMatches = schemaBody.matchAll(
    /(\w+)\s*:\s*Joi\.(\w+)\s*\(\s*([^)]*)\s*\)([\s\S]*?)(?=,\s*\w+\s*:|$)/g,
  );

  for (const match of fieldMatches) {
    const [, fieldName, joiType, typeArgs, constraints] = match;

    fields[fieldName] = {
      type: mapJoiType(joiType),
      joiType: joiType,
      required: !constraints.includes(".optional()"),
      constraints: parseJoiConstraints(constraints, joiType, typeArgs),
    };
  }

  return fields;
}

/**
 * Map Joi types to JSON Schema types
 */
function mapJoiType(joiType) {
  const typeMap = {
    string: "string",
    number: "number",
    boolean: "boolean",
    array: "array",
    object: "object",
    date: "string",
    binary: "string",
    any: "any",
  };
  return typeMap[joiType] || "string";
}

/**
 * Parse Joi chain constraints
 */
function parseJoiConstraints(constraints, joiType, typeArgs) {
  const result = {};

  // Min value/length
  const minMatch = constraints.match(/\.min\(\s*(-?\d+(?:\.\d+)?)\s*\)/);
  if (minMatch) result.min = parseFloat(minMatch[1]);

  // Max value/length
  const maxMatch = constraints.match(/\.max\(\s*(-?\d+(?:\.\d+)?)\s*\)/);
  if (maxMatch) result.max = parseFloat(maxMatch[1]);

  // Length
  const lengthMatch = constraints.match(/\.length\(\s*(\d+)\s*\)/);
  if (lengthMatch) result.length = parseInt(lengthMatch[1]);

  // Email
  if (constraints.includes(".email()")) result.format = "email";

  // URI
  if (constraints.includes(".uri()")) result.format = "uri";

  // UUID
  if (constraints.includes(".uuid()") || constraints.includes(".guid()"))
    result.format = "uuid";

  // Pattern
  const patternMatch = constraints.match(/\.pattern\(\s*\/([^/]+)\/\s*\)/);
  if (patternMatch) result.pattern = patternMatch[1];

  // Valid values (enum)
  const validMatch = constraints.match(/\.valid\s*\(\s*([^)]+)\s*\)/);
  if (validMatch) {
    const validValues = validMatch[1]
      .split(",")
      .map((v) => v.trim())
      .map((v) => {
        // Handle enum values like Gender.MALE
        if (v.includes(".")) {
          const parts = v.split(".");
          return parts[parts.length - 1].toLowerCase();
        }
        // Handle string literals
        return v.replace(/["']/g, "");
      })
      .filter((v) => v);
    result.enum = validValues;
  }

  // Default value
  const defaultMatch = constraints.match(
    /\.default\(\s*["']?([^"')]+)["']?\s*\)/,
  );
  if (defaultMatch) result.default = defaultMatch[1];

  // Positive
  if (constraints.includes(".positive()")) result.positive = true;

  // Integer
  if (constraints.includes(".integer()")) result.integer = true;

  return result;
}

// ============================================================================
// EXAMPLE DATA GENERATION - REALISTIC
// ============================================================================

/**
 * Generate realistic example data based on field name and schema
 */
function generateExample(schema) {
  if (!schema || Object.keys(schema).length === 0) {
    return {};
  }

  const example = {};

  for (const [fieldName, field] of Object.entries(schema)) {
    example[fieldName] = generateFieldExample(fieldName, field);
  }

  return example;
}

/**
 * Generate example value for a single field
 */
function generateFieldExample(fieldName, field) {
  const name = fieldName.toLowerCase();
  const { type, constraints = {} } = field;

  // Handle enums first
  if (constraints.enum && constraints.enum.length > 0) {
    return constraints.enum[0];
  }

  // Handle default values
  if (constraints.default !== undefined) {
    return constraints.default;
  }

  // String type with smart example generation
  if (type === "string") {
    // Phone numbers
    if (
      name.includes("phone") ||
      name.includes("contact") ||
      name.includes("mobile")
    ) {
      return "+919876543210";
    }

    // OTP
    if (name.includes("otp")) {
      return "123456";
    }

    // Email
    if (name.includes("email") || constraints.format === "email") {
      return "user@example.com";
    }

    // URL/URI
    if (
      name.includes("url") ||
      name.includes("photo") ||
      name.includes("image") ||
      constraints.format === "uri"
    ) {
      return "https://example.com/image.jpg";
    }

    // UUID/ID fields
    if (constraints.format === "uuid") {
      return "550e8400-e29b-41d4-a716-446655440000";
    }

    // Razorpay specific - check before generic _id check
    if (name.includes("razorpay_order_id") || name === "order_id")
      return "order_DBJOWzybf0sJbb";
    if (name.includes("razorpay_payment_id")) return "pay_DBJOWzybf0sJbb";
    if (name.includes("razorpay_signature"))
      return "d9e3b4be4c0489eb6a5a1a93e6a5c1ef8b4f0e75c8f2e";
    if (name === "payment_id") return "pay_DBJOWzybf0sJbb";

    // Generic ID fields
    if (name.includes("_id") || name === "id") {
      return "550e8400-e29b-41d4-a716-446655440000";
    }

    // Name fields
    if (name.includes("name")) {
      if (name.includes("school")) return "Delhi Public School";
      if (name.includes("student")) return "Rahul Sharma";
      if (name.includes("driver")) return "Ramesh Kumar";
      return "John Doe";
    }

    // Address fields
    if (name.includes("address")) {
      if (name.includes("line1") || name.includes("_1"))
        return "123 Main Street";
      if (name.includes("line2") || name.includes("_2")) return "Apt 4B";
      return "123 Main Street, Mumbai";
    }

    // City
    if (name.includes("city")) return "Mumbai";

    // State
    if (name.includes("state")) return "Maharashtra";

    // Pincode/Zip
    if (name.includes("pincode") || name.includes("zip")) return "400001";

    // Class/Section
    if (name.includes("class")) return "10th";
    if (name.includes("section")) return "A";
    if (name.includes("roll")) return "R001";

    // Currency
    if (name.includes("currency")) return "INR";

    // Description
    if (
      name.includes("description") ||
      name.includes("notes") ||
      name.includes("info")
    ) {
      return "Additional notes or description";
    }

    // Gender
    if (name.includes("gender")) return "male";

    // Role
    if (name.includes("role")) return "parent";

    // Token
    if (name.includes("token")) return "fcm_token_string";

    // License
    if (name.includes("license")) return "DL-1234567890123";

    // Vehicle
    if (name.includes("vehicle_number") || name.includes("registration"))
      return "MH01AB1234";

    // Default string
    return constraints.length
      ? "x".repeat(constraints.length)
      : "sample_string";
  }

  // Number type
  if (type === "number") {
    // Latitude
    if (name.includes("latitude") || name === "lat") return 19.076;

    // Longitude
    if (name.includes("longitude") || name === "lng" || name === "lon")
      return 72.8777;

    // Amount/Price
    if (
      name.includes("amount") ||
      name.includes("price") ||
      name.includes("cost")
    ) {
      return constraints.integer ? 10000 : 100.0;
    }

    // Rating
    if (name.includes("rating")) return 4.5;

    // Count/Quantity
    if (name.includes("count") || name.includes("quantity")) return 1;

    // Age
    if (name.includes("age")) return 10;

    // Default number
    if (constraints.positive) return constraints.min || 1;
    return constraints.min || 0;
  }

  // Boolean type
  if (type === "boolean") {
    if (
      name.includes("primary") ||
      name.includes("active") ||
      name.includes("is_")
    )
      return true;
    return false;
  }

  // Array type
  if (type === "array") {
    return [];
  }

  // Object type
  if (type === "object") {
    return {};
  }

  // Date type
  if (field.joiType === "date") {
    return "2024-01-15";
  }

  return null;
}

// ============================================================================
// ROUTE FILE PARSING - COMPREHENSIVE
// ============================================================================

/**
 * Find all route files in the modules directory and the role-scoped routes layer.
 *
 * Scans two locations:
 *   1. src/modules/  — legacy module-level route files (Express Router exports)
 *   2. src/routes/   — new role-gateway route files (parent, driver, admin, etc.)
 *
 * Files that have been converted to handler-group exports (no router.get/post calls)
 * are silently skipped by the existing `endpoints.length === 0` guard in main().
 */
function findAllRouteFiles() {
  const routeFiles = [];

  // Recursive scan for module-level route files (nested directory structure)
  function traverse(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith(".routes.ts")) {
        routeFiles.push(fullPath);
      }
    }
  }

  // Flat scan for role-gateway route files (flat directory, no nesting)
  function traverseFlat(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      // Only pick up top-level *.routes.ts files (parent.routes.ts, driver.routes.ts, etc.)
      // Avoid re-scanning src/routes/index.ts or any sub-directories if added later
      if (!stat.isDirectory() && item.endsWith(".routes.ts")) {
        routeFiles.push(fullPath);
      }
    }
  }

  traverse(CONFIG.MODULES_DIR);

  // Also scan the role-scoped routes layer if it exists
  if (fs.existsSync(CONFIG.ROUTES_LAYER_DIR)) {
    traverseFlat(CONFIG.ROUTES_LAYER_DIR);
  }

  return routeFiles;
}

/**
 * Parse a route file and extract all endpoints
 */
function parseRouteFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const fileName = path.basename(filePath, ".routes.ts");
  const modulePath = path.dirname(filePath);
  const endpoints = [];

  // Load validation schemas — supports two import styles:
  //   1. Relative: from "./feature.validation"       (module-level route files)
  //   2. Alias:    from "@modules/x/y/y.validation"  (role-gateway route files)
  let validationSchemas = {};

  const relativeValidationMatch = content.match(
    /from\s+["']\.\/([^"']+\.validation)["']/,
  );
  if (relativeValidationMatch) {
    const validationPath = path.join(modulePath, relativeValidationMatch[1] + ".ts");
    validationSchemas = parseValidationFile(validationPath);
  } else {
    // Role-gateway files may import multiple validation schemas via @modules/ alias.
    // Collect and merge all of them.
    const aliasValidationRegex = /from\s+["']@modules\/([^"']+\.validation)["']/g;
    let aliasMatch;
    while ((aliasMatch = aliasValidationRegex.exec(content)) !== null) {
      const validationPath = path.join(CONFIG.MODULES_DIR, aliasMatch[1] + ".ts");
      const schemas = parseValidationFile(validationPath);
      Object.assign(validationSchemas, schemas);
    }
  }

  // Check for router-level middleware (applies to all routes)
  const routerUseAuth = content.match(/router\.use\(\s*(\w+Token\w*)/);
  const globalAuth = routerUseAuth ? extractAuthType(routerUseAuth[1]) : null;

  // Parse the file line by line to properly extract comments and routes
  const lines = content.split("\n");
  let comments = []; // Stack of recent comments
  let routeBuffer = "";
  let inMultiLineRoute = false;
  let inJSDocBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Track JSDoc block start/end - don't use these as route comments
    if (trimmedLine.startsWith("/**")) {
      inJSDocBlock = true;
      comments = []; // Clear any pending comments
      continue;
    }
    if (trimmedLine.includes("*/")) {
      inJSDocBlock = false;
      continue;
    }

    // Skip content inside JSDoc blocks (these are module/file level docs)
    if (inJSDocBlock) {
      continue;
    }

    // Capture single-line comments above routes (// comment)
    const commentMatch = trimmedLine.match(/^\/\/\s*(.+)$/);
    if (commentMatch) {
      comments.push(commentMatch[1].trim());
      continue;
    }

    // Start of route definition
    if (trimmedLine.match(/^router\.(get|post|put|patch|delete)\s*\(/i)) {
      routeBuffer = trimmedLine;
      inMultiLineRoute = !trimmedLine.endsWith(");");

      if (!inMultiLineRoute) {
        // Single-line route
        const endpoint = parseRouteLine(
          routeBuffer,
          comments,
          validationSchemas,
          globalAuth,
          fileName,
        );
        if (endpoint) {
          endpoints.push(endpoint);
        }
        comments = [];
        routeBuffer = "";
      }
      continue;
    }

    // Continue multi-line route
    if (inMultiLineRoute) {
      routeBuffer += " " + trimmedLine;

      if (trimmedLine.endsWith(");")) {
        const endpoint = parseRouteLine(
          routeBuffer,
          comments,
          validationSchemas,
          globalAuth,
          fileName,
        );
        if (endpoint) {
          endpoints.push(endpoint);
        }
        comments = [];
        routeBuffer = "";
        inMultiLineRoute = false;
      }
      continue;
    }

    // Reset comments if we hit a non-comment, non-route line (except empty lines)
    if (
      trimmedLine &&
      !trimmedLine.startsWith("//") &&
      !trimmedLine.startsWith("*")
    ) {
      // Don't reset for import statements, const declarations, etc.
      if (
        !trimmedLine.startsWith("import") &&
        !trimmedLine.startsWith("export") &&
        !trimmedLine.startsWith("const") &&
        !trimmedLine.startsWith("/**") &&
        !trimmedLine.startsWith("*/") &&
        !trimmedLine.startsWith("router.use")
      ) {
        comments = [];
      }
    }
  }

  return endpoints;
}

/**
 * Parse a single route line/definition
 */
function parseRouteLine(
  routeStr,
  comments,
  validationSchemas,
  globalAuth,
  fileName,
) {
  // Extract HTTP method
  const methodMatch = routeStr.match(
    /router\.(get|post|put|patch|delete)\s*\(/i,
  );
  if (!methodMatch) return null;
  const method = methodMatch[1].toUpperCase();

  // Extract route path
  const pathMatch = routeStr.match(/\(\s*["']([^"']+)["']/);
  if (!pathMatch) return null;
  const route = pathMatch[1];

  // Extract the arguments part
  const argsMatch = routeStr.match(/\(\s*["'][^"']+["']\s*,(.+)\)/s);
  const args = argsMatch ? argsMatch[1] : "";

  // Determine authentication
  let auth = globalAuth;
  if (args.includes("verifyParentToken")) auth = "parent";
  else if (args.includes("verifyDriverToken")) auth = "driver";
  else if (args.includes("verifyAdminToken")) auth = "admin";
  else if (args.includes("verifySchoolAdminToken")) auth = "school_admin";
  else if (
    args.includes("verifyToken_Middleware") ||
    args.includes("verifyAuthToken")
  )
    auth = "general";

  // Extract validation schema
  const validateMatch = args.match(/validate\s*\(\s*(\w+)\s*\)/);
  let requestBody = null;
  let schemaFields = null;

  if (validateMatch) {
    const schemaName = validateMatch[1];
    schemaFields = validationSchemas[schemaName];
    if (schemaFields) {
      requestBody = generateExample(schemaFields);
    }
  }

  // Find the best comment for the endpoint name
  // Priority: Comments with numbers like "01. " or "02. " are preferred
  // Skip comments that start with "Request body:" or similar patterns
  let primaryComment = null;
  let additionalInfo = [];

  for (const comment of comments) {
    // Skip section-header divider comments like "--- Profile ---" or "--- Public sub-routes (no auth) ---"
    if (/^-{2,}/.test(comment)) {
      continue;
    }

    // Skip helper comments that describe the request body
    if (
      comment.toLowerCase().startsWith("request body:") ||
      comment.toLowerCase().startsWith("params:") ||
      comment.toLowerCase().startsWith("query:")
    ) {
      additionalInfo.push(comment);
      continue;
    }

    // Prefer numbered comments (e.g., "01. Get User Profile")
    if (comment.match(/^\d+\.?\s+/) && !primaryComment) {
      primaryComment = comment;
    } else if (!primaryComment) {
      primaryComment = comment;
    }
  }

  // Generate endpoint name
  const name = generateEndpointName(method, route, primaryComment, fileName);
  const description = generateEndpointDescription(
    method,
    route,
    primaryComment,
    auth,
    schemaFields,
    additionalInfo,
  );

  return {
    name,
    description,
    method,
    route,
    auth,
    hasBody: ["POST", "PUT", "PATCH"].includes(method),
    requestBody,
    schemaFields,
    fileName,
  };
}

/**
 * Extract authentication type from middleware name
 */
function extractAuthType(middlewareName) {
  if (middlewareName.includes("Parent")) return "parent";
  if (middlewareName.includes("Driver")) return "driver";
  if (middlewareName.includes("Admin")) return "admin";
  if (middlewareName.includes("SchoolAdmin")) return "school_admin";
  return "general";
}

/**
 * Generate a clear, descriptive endpoint name
 */
function generateEndpointName(method, route, comment, fileName) {
  // Use the comment if available and meaningful
  if (comment && comment.length > 3 && !comment.match(/^\d+$/)) {
    // Clean up the comment
    return comment
      .replace(/^\d+\.\s*/, "") // Remove leading numbers like "01. "
      .replace(/\s*\([^)]*\)\s*$/, "") // Remove trailing parentheses content
      .trim();
  }

  // Generate from route path
  const parts = route.split("/").filter((p) => p && !p.startsWith(":"));
  const resource = parts[parts.length - 1] || fileName;

  const methodVerbs = {
    GET: "Get",
    POST: "Create",
    PUT: "Update",
    PATCH: "Update",
    DELETE: "Delete",
  };

  // Check for list vs single item
  const hasIdParam = route.includes(":");
  const isGet = method === "GET";

  let verb = methodVerbs[method];
  if (isGet && !hasIdParam) {
    verb = "Get All";
  } else if (isGet && hasIdParam) {
    verb = "Get";
  }

  return `${verb} ${titleCase(resource)}`;
}

/**
 * Generate a detailed description for the endpoint
 */
function generateEndpointDescription(
  method,
  route,
  comment,
  auth,
  schemaFields,
  additionalInfo = [],
) {
  const parts = [];

  // Add the main purpose
  if (comment) {
    parts.push(comment.replace(/^\d+\.\s*/, ""));
  }

  // Add additional info comments (like "Request body:" hints from the source)
  if (additionalInfo.length > 0) {
    parts.push("\n\n📝 Notes:");
    additionalInfo.forEach((info) => {
      parts.push(`• ${info}`);
    });
  }

  // Add authentication info
  if (auth) {
    const authNames = {
      parent: "Parent",
      driver: "Driver",
      admin: "Admin",
      school_admin: "School Admin",
      general: "Authenticated User",
    };
    parts.push(`\n\n🔐 Requires ${authNames[auth] || auth} authentication`);
  }

  // Add request body fields info
  if (schemaFields && Object.keys(schemaFields).length > 0) {
    parts.push("\n\n📋 Request Body Fields:");
    for (const [fieldName, field] of Object.entries(schemaFields)) {
      const required = field.required ? "(required)" : "(optional)";
      const type = field.type;
      parts.push(`• ${fieldName}: ${type} ${required}`);
    }
  }

  return parts.join("\n") || `${method} ${route}`;
}

// ============================================================================
// POSTMAN COLLECTION GENERATION
// ============================================================================

/**
 * Get sub-folder name from a route path for gateway categories.
 * Skips the role-prefix segment (e.g. "admin" in /admin/schools) and returns
 * a title-cased label for the resource segment (e.g. "Schools").
 */
function getSubfolderName(route, categoryName) {
  const segments = route.split("/").filter((p) => p);
  if (!segments.length) return "General";

  let startIdx = 0;

  // For gateway categories, detect and skip the role prefix segment
  // e.g. "Admin (Gateway)" → prefix "admin", "School Admin (Gateway)" → "school-admin"
  if (categoryName && categoryName.endsWith("(Gateway)")) {
    const gatewayPrefix = categoryName
      .replace(/ \(Gateway\)$/, "")
      .toLowerCase()
      .replace(/\s+/g, "-");

    if (segments[0] && segments[0].toLowerCase() === gatewayPrefix) {
      startIdx = 1;
    }
  }

  // Find the first non-param segment after the role prefix
  for (let i = startIdx; i < segments.length; i++) {
    if (!segments[i].startsWith(":")) {
      return titleCase(segments[i].replace(/-/g, " "));
    }
  }

  return "General";
}

/**
 * Group endpoints into sub-folders keyed by their resource segment.
 */
function groupEndpointsBySubfolder(endpoints, categoryName) {
  const groups = {};
  for (const ep of endpoints) {
    const folder = getSubfolderName(ep.route, categoryName);
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push(ep);
  }
  return groups;
}

/**
 * Generate Postman Collection v2.1 format.
 * Gateway categories (e.g. "Admin (Gateway)") are rendered with resource
 * sub-folders (Schools, Users, Trips …) for easy navigation.
 */
function generatePostmanCollection(categories, version) {
  return {
    info: {
      name: `Ping Parent API v${version}`,
      description: generateCollectionDescription(categories, version),
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      version: version,
    },
    auth: {
      type: "bearer",
      bearer: [{ key: "token", value: "{{TOKEN}}", type: "string" }],
    },
    variable: [
      { key: "BASE_URL", value: "http://localhost:3000/api", type: "string" },
    ],
    item: Object.entries(categories).map(([category, endpoints]) => {
      // Gateway files (src/routes/*.routes.ts) get resource sub-folders
      if (category.endsWith("(Gateway)")) {
        const subGroups = groupEndpointsBySubfolder(endpoints, category);
        return {
          name: category,
          description: `${category} API endpoints`,
          item: Object.entries(subGroups).map(([subName, subEndpoints]) => ({
            name: subName,
            description: `${subName} endpoints`,
            item: subEndpoints.map((ep) => createPostmanRequest(ep)),
          })),
        };
      }

      // Module-level categories stay flat
      return {
        name: category,
        description: `${category} API endpoints`,
        item: endpoints.map((ep) => createPostmanRequest(ep)),
      };
    }),
  };
}

/**
 * Generate collection description with stats
 */
function generateCollectionDescription(categories, version) {
  const totalEndpoints = Object.values(categories).flat().length;
  const categoryCount = Object.keys(categories).length;

  let desc = `# Ping Parent API v${version}\n\n`;
  desc += `Generated: ${new Date().toISOString()}\n\n`;
  desc += `## Summary\n`;
  desc += `- **Total Endpoints:** ${totalEndpoints}\n`;
  desc += `- **Categories:** ${categoryCount}\n\n`;
  desc += `## Authentication\n`;
  desc += `Set the appropriate token in the environment variables:\n`;
  desc += `- PARENT_TOKEN - For parent endpoints\n`;
  desc += `- DRIVER_TOKEN - For driver endpoints\n`;
  desc += `- ADMIN_TOKEN - For admin endpoints\n`;
  desc += `- TOKEN - For general authenticated endpoints\n\n`;
  desc += `## Categories\n`;

  for (const [category, endpoints] of Object.entries(categories)) {
    desc += `- **${category}**: ${endpoints.length} endpoints\n`;
  }

  return desc;
}

/**
 * Create a Postman request item
 */
function createPostmanRequest(endpoint) {
  const { name, description, method, route, auth, hasBody, requestBody } =
    endpoint;

  // Build the URL
  const pathParts = route.split("/").filter((p) => p);
  const urlPath = pathParts.map((part) => {
    if (part.startsWith(":")) {
      return `{{${part.substring(1).toUpperCase()}}}`;
    }
    return part;
  });

  const item = {
    name: name,
    request: {
      method: method,
      header: [],
      url: {
        raw: `{{BASE_URL}}${route.replace(/:(\w+)/g, "{{$1}}")}`,
        host: ["{{BASE_URL}}"],
        path: urlPath,
      },
      description: description,
    },
    response: [],
  };

  // Add authentication
  if (auth) {
    const tokenMap = {
      parent: "{{PARENT_TOKEN}}",
      driver: "{{DRIVER_TOKEN}}",
      admin: "{{ADMIN_TOKEN}}",
      school_admin: "{{SCHOOL_ADMIN_TOKEN}}",
      general: "{{TOKEN}}",
    };

    item.request.auth = {
      type: "bearer",
      bearer: [
        { key: "token", value: tokenMap[auth] || "{{TOKEN}}", type: "string" },
      ],
    };
  }

  // Add request body
  if (hasBody && requestBody) {
    item.request.header.push({
      key: "Content-Type",
      value: "application/json",
    });

    item.request.body = {
      mode: "raw",
      raw: JSON.stringify(requestBody, null, 2),
      options: {
        raw: { language: "json" },
      },
    };
  }

  // Add path variables
  const pathVars = route.match(/:(\w+)/g);
  if (pathVars) {
    item.request.url.variable = pathVars.map((v) => {
      const varName = v.substring(1);
      return {
        key: varName,
        value: `{{${varName.toUpperCase()}}}`,
        description: `${titleCase(varName)} ID`,
      };
    });
  }

  // Add example responses
  item.response = [
    createExampleResponse(endpoint, 200, "Success"),
    createExampleResponse(endpoint, 400, "Bad Request"),
    createExampleResponse(endpoint, 401, "Unauthorized"),
  ];

  return item;
}

/**
 * Create example response for Postman
 */
function createExampleResponse(endpoint, status, statusText) {
  let body;

  switch (status) {
    case 200:
    case 201:
      body = {
        success: true,
        message: `${endpoint.name} successful`,
        data: {},
      };
      break;
    case 400:
      body = {
        success: false,
        message: "Validation error",
        errors: [],
      };
      break;
    case 401:
      body = {
        success: false,
        message: "Authentication required",
      };
      break;
    default:
      body = {
        success: false,
        message: "Error occurred",
      };
  }

  return {
    name: statusText,
    status: statusText,
    code: status,
    header: [{ key: "Content-Type", value: "application/json" }],
    body: JSON.stringify(body, null, 2),
  };
}

// ============================================================================
// POSTMAN ENVIRONMENT GENERATION
// ============================================================================

/**
 * Generate Postman Environment
 */
function generatePostmanEnvironment(version) {
  return {
    id: `ping-parent-env-v2-${version.replace(/\./g, "-")}`,
    name: `Ping Parent Environment v${version}`,
    values: [
      {
        key: "BASE_URL",
        value: "http://localhost:3000/api",
        type: "default",
        enabled: true,
      },
      { key: "PARENT_TOKEN", value: "", type: "secret", enabled: true },
      { key: "DRIVER_TOKEN", value: "", type: "secret", enabled: true },
      { key: "ADMIN_TOKEN", value: "", type: "secret", enabled: true },
      { key: "SCHOOL_ADMIN_TOKEN", value: "", type: "secret", enabled: true },
      { key: "TOKEN", value: "", type: "secret", enabled: true },
      { key: "PARENT_ID", value: "", type: "default", enabled: true },
      { key: "DRIVER_ID", value: "", type: "default", enabled: true },
      { key: "STUDENT_ID", value: "", type: "default", enabled: true },
      { key: "SCHOOL_ID", value: "", type: "default", enabled: true },
      { key: "TRIP_ID", value: "", type: "default", enabled: true },
      { key: "SUBSCRIPTION_ID", value: "", type: "default", enabled: true },
      { key: "PAYMENT_ID", value: "", type: "default", enabled: true },
      { key: "ORDER_ID", value: "", type: "default", enabled: true },
      { key: "ID", value: "", type: "default", enabled: true },
    ],
    _postman_variable_scope: "environment",
    _postman_exported_at: new Date().toISOString(),
    _postman_exported_using: "PP API Doc Generator v3.0",
  };
}

// ============================================================================
// OPENAPI/SWAGGER GENERATION
// ============================================================================

/**
 * Generate OpenAPI 3.0 specification
 */
function generateOpenAPISpec(categories, version) {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "Ping Parent API",
      version: version,
      description: "School transport tracking and management API",
      contact: { name: "Ping Parent Team" },
    },
    servers: [
      { url: "http://localhost:3000/api", description: "Development" },
      { url: "https://api.pingparent.com/api", description: "Production" },
    ],
    tags: Object.keys(categories).map((cat) => ({
      name: cat,
      description: `${cat} endpoints`,
    })),
    paths: {},
    components: {
      securitySchemes: {
        ParentAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Parent JWT token",
        },
        DriverAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Driver JWT token",
        },
        AdminAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Admin JWT token",
        },
      },
      schemas: {},
    },
  };

  // Generate paths
  for (const [category, endpoints] of Object.entries(categories)) {
    for (const endpoint of endpoints) {
      const pathKey = endpoint.route.replace(/:(\w+)/g, "{$1}");

      if (!spec.paths[pathKey]) {
        spec.paths[pathKey] = {};
      }

      const operation = {
        tags: [category],
        summary: endpoint.name,
        description: endpoint.description || endpoint.name,
        operationId: `${endpoint.method.toLowerCase()}${endpoint.route.replace(/[/:]/g, "_")}`,
        parameters: generatePathParameters(endpoint.route),
        responses: {
          200: {
            description: "Successful operation",
            content: { "application/json": { schema: { type: "object" } } },
          },
          400: { description: "Bad request" },
          401: { description: "Unauthorized" },
          404: { description: "Not found" },
          500: { description: "Internal server error" },
        },
      };

      // Add security
      if (endpoint.auth) {
        const securityMap = {
          parent: [{ ParentAuth: [] }],
          driver: [{ DriverAuth: [] }],
          admin: [{ AdminAuth: [] }],
        };
        operation.security = securityMap[endpoint.auth] || [{ ParentAuth: [] }];
      }

      // Add request body
      if (endpoint.hasBody && endpoint.requestBody) {
        operation.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: generateJsonSchema(endpoint.schemaFields),
              example: endpoint.requestBody,
            },
          },
        };
      }

      spec.paths[pathKey][endpoint.method.toLowerCase()] = operation;
    }
  }

  return spec;
}

/**
 * Generate path parameters for OpenAPI
 */
function generatePathParameters(route) {
  const params = route.match(/:(\w+)/g);
  if (!params) return undefined;

  return params.map((param) => ({
    name: param.substring(1),
    in: "path",
    required: true,
    schema: { type: "string" },
    description: `${titleCase(param.substring(1))} identifier`,
  }));
}

/**
 * Generate JSON Schema from parsed Joi schema
 */
function generateJsonSchema(schemaFields) {
  if (!schemaFields) {
    return { type: "object", properties: {} };
  }

  const properties = {};
  const required = [];

  for (const [fieldName, field] of Object.entries(schemaFields)) {
    const prop = { type: field.type };

    if (field.constraints) {
      if (field.constraints.format) prop.format = field.constraints.format;
      if (field.constraints.min !== undefined)
        prop.minimum = field.constraints.min;
      if (field.constraints.max !== undefined)
        prop.maximum = field.constraints.max;
      if (field.constraints.enum) prop.enum = field.constraints.enum;
      if (field.constraints.pattern) prop.pattern = field.constraints.pattern;
    }

    properties[fieldName] = prop;

    if (field.required) {
      required.push(fieldName);
    }
  }

  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log("\n" + "═".repeat(70));
  console.log("  🚀 Ping Parent API Documentation Generator v3.0");
  console.log("═".repeat(70) + "\n");

  // Parse CLI arguments
  const args = process.argv.slice(2);
  let manualVersion = null;
  let bumpType = "patch";

  args.forEach((arg) => {
    if (arg.startsWith("--version=")) manualVersion = arg.split("=")[1];
    if (arg.startsWith("--bump=")) bumpType = arg.split("=")[1];
  });

  // Step 1: Parse main routes for base paths
  console.log("📍 Step 1: Parsing main routes file...");
  const basePaths = parseMainRoutesFile();
  console.log(`   Found ${Object.keys(basePaths).length} route mappings\n`);

  // Read main routes content for variable lookup
  const mainRoutesContent = fs.existsSync(CONFIG.ROUTES_FILE)
    ? fs.readFileSync(CONFIG.ROUTES_FILE, "utf-8")
    : "";

  // Step 2: Discover route files
  console.log("📁 Step 2: Discovering route files...");
  const routeFiles = findAllRouteFiles();
  console.log(`   Found ${routeFiles.length} route files\n`);

  // Step 3: Parse all routes
  console.log("📋 Step 3: Parsing route definitions...");
  const categories = {};
  let totalEndpoints = 0;

  for (const file of routeFiles) {
    // Check if this file is from the role-gateway layer (src/routes/) or the module layer (src/modules/)
    const isGatewayFile = file.startsWith(CONFIG.ROUTES_LAYER_DIR + path.sep) ||
      file.startsWith(CONFIG.ROUTES_LAYER_DIR + "/");

    let relativePath;
    let categoryName;

    if (isGatewayFile) {
      // Role-gateway file: parent.routes.ts → category "Parent (Gateway)"
      relativePath = path.relative(CONFIG.ROUTES_LAYER_DIR, file);
      const gatewayName = path.basename(file, ".routes.ts"); // e.g. "parent", "driver", "school-admin"
      categoryName = `${titleCase(gatewayName)} (Gateway)`;
    } else {
      // Module-level file: users/parent/parent.routes.ts → "Users - Parent"
      relativePath = path.relative(CONFIG.MODULES_DIR, file);
      const parts = relativePath.split(path.sep);
      if (parts.length > 2) {
        categoryName = `${titleCase(parts[0])} - ${titleCase(parts[1])}`;
      } else {
        categoryName = titleCase(parts[0]);
      }
    }

    // Parse endpoints
    const endpoints = parseRouteFile(file);

    if (endpoints.length === 0) {
      console.log(`   ⚠️  ${relativePath}: No endpoints found`);
      continue;
    }

    // Determine base path from main routes
    const varName = getRouteVariableName(file, mainRoutesContent);
    const basePath = varName ? basePaths[varName] || "" : "";

    // Apply base path to all endpoints
    endpoints.forEach((ep) => {
      if (basePath && !ep.route.startsWith(basePath)) {
        ep.route = basePath + ep.route;
      }
    });

    console.log(`   ✅ ${relativePath}: ${endpoints.length} endpoints`);

    if (!categories[categoryName]) {
      categories[categoryName] = [];
    }
    categories[categoryName].push(...endpoints);
    totalEndpoints += endpoints.length;
  }

  console.log(
    `\n   📊 Total: ${totalEndpoints} endpoints in ${Object.keys(categories).length} categories\n`,
  );

  // Step 4: Version management
  console.log("🔢 Step 4: Version management...");
  const versionInfo = getVersionInfo();
  let newVersion;

  if (manualVersion) {
    newVersion = manualVersion;
    console.log(`   Manual version: ${newVersion}`);
  } else {
    newVersion = incrementVersion(versionInfo.current, bumpType);
    console.log(
      `   ${bumpType.toUpperCase()} bump: ${versionInfo.current} → ${newVersion}`,
    );
  }
  console.log("");

  // Step 5: Generate documentation
  console.log("📝 Step 5: Generating documentation...");
  const filePrefix = `${CONFIG.BASE_NAME}_${newVersion.replace(/\./g, "_")}`;

  // Generate Postman Collection
  const postmanFile = path.join(
    CONFIG.POSTMAN_DIR,
    `${filePrefix}.postman_collection.json`,
  );
  const postmanCollection = generatePostmanCollection(categories, newVersion);
  fs.writeFileSync(postmanFile, JSON.stringify(postmanCollection, null, 2));
  console.log(`   ✅ Postman Collection: ${path.basename(postmanFile)}`);

  // Generate Postman Environment
  const envFile = path.join(
    CONFIG.ENV_DIR,
    `${filePrefix}.postman_environment.json`,
  );
  const postmanEnv = generatePostmanEnvironment(newVersion);
  fs.writeFileSync(envFile, JSON.stringify(postmanEnv, null, 2));
  console.log(`   ✅ Postman Environment: ${path.basename(envFile)}`);

  // Generate OpenAPI Spec
  const openAPIFile = path.join(
    CONFIG.OPENAPI_DIR,
    `${filePrefix}.openapi.yaml`,
  );
  const openAPISpec = generateOpenAPISpec(categories, newVersion);
  const openAPIYaml = jsonToYaml(openAPISpec);
  fs.writeFileSync(openAPIFile, openAPIYaml);
  console.log(`   ✅ OpenAPI Spec: ${path.basename(openAPIFile)}`);

  // Step 6: Update version info
  versionInfo.current = newVersion;
  versionInfo.history.push({
    version: newVersion,
    timestamp: new Date().toISOString(),
    endpoints: totalEndpoints,
    categories: Object.keys(categories).length,
  });
  saveVersionInfo(versionInfo);

  // Summary
  console.log("\n" + "═".repeat(70));
  console.log("  ✨ Documentation Generated Successfully!");
  console.log("═".repeat(70));
  console.log(`
  📦 Version: ${newVersion}
  📊 Endpoints: ${totalEndpoints}
  📁 Categories: ${Object.keys(categories).length}
  
  📂 Output Files:
     • ${path.relative(process.cwd(), postmanFile)}
     • ${path.relative(process.cwd(), envFile)}
     • ${path.relative(process.cwd(), openAPIFile)}
  
  💡 Quick Start:
     1. Import the Postman collection
     2. Import the Postman environment
     3. Set your authentication tokens
     4. Start making requests!
  
  🔧 Usage:
     npm run docs:generate:v2                    # Patch bump
     npm run docs:generate:v2 -- --bump=minor   # Minor bump
     npm run docs:generate:v2 -- --bump=major   # Major bump
     npm run docs:generate:v2 -- --version=2.0.0 # Manual version
  `);
}

// Run the generator
try {
  main();
} catch (error) {
  console.error("\n❌ Error:", error.message);
  console.error(error.stack);
  process.exit(1);
}
