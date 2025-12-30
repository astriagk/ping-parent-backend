# AI Agent Prompt Templates - Ping Parent Backend

This document contains ready-to-use prompt templates for working with AI agents on the Ping Parent backend project.

## 📋 Quick Reference

| Task                   | Template Section                            |
| ---------------------- | ------------------------------------------- |
| Create new CRUD module | [New Module](#-new-module-template)         |
| Fix bugs/errors        | [Bug Fix](#-bug-fix-template)               |
| Add single endpoint    | [New Endpoint](#-new-endpoint-template)     |
| Review/audit code      | [Code Review](#-code-review-template)       |
| Update documentation   | [Documentation](#-documentation-template)   |
| Add Swagger docs       | [Swagger](#-swagger-documentation-template) |
| Auto-generate docs from routes | [Auto-Generate Docs](#-auto-generate-documentation-from-routes-template) |

---

## 🚀 New Module Template

**Copy this when creating a new entity (School, Trip, Address, etc.)**

```
Create a [ENTITY_NAME] module following the Ping Parent backend patterns.

FIRST - Read Project Documentation:
- @docs/v1/guides/AI_CONTEXT.md - Core patterns and conventions
- @docs/v1/guides/FOLDER_STRUCTURE.MD - File organization and architecture
- @docs/v1/guides/IMPLEMENTATION_EXAMPLES.md - Student module example (use as template)
- @docs/v1/guides/TROUBLESHOOTING.md - Common mistakes to avoid

Database Schema:
- Check Database/ping_parent_dbdiagram.dbml for [table_name] table
- ⚠️ CRITICAL: Check field-level notes and table Note
- Exclude calculated fields from validation schemas (e.g., optimized_route_data, sequence_order)

Implementation Steps:

1. Add Enum to constants/enums.ts (if needed)
   - Check if entity has enum fields in database schema
   - Add enum with PascalCase name and lowercase values

2. Create types/[entity].type.ts
   - Import enums from constants/enums.ts
   - Use snake_case for all field names
   - Include _id?: any for MongoDB

3. Update Constants:
   - constants/collections.ts - Add [ENTITY]_COLLECTION
   - constants/messages.ts - Add ERROR_MESSAGES.[ENTITY] and SUCCESS_MESSAGES.[ENTITY]
   - constants/validationMessages.ts - Add VALIDATION_MESSAGES.[ENTITY] (if needed)

4. Create validations/[entity].validation.ts
   - Create separate schemas: create[Entity]Schema, update[Entity]Schema
   - Use VALIDATION_MESSAGES from constants for all error messages
   - Use enum values from constants/enums.ts
   - DO NOT include parent_id or driver_id in create schema (derived from auth)

5. Create repositories/[entity].repository.ts
   - Extend BaseRepository<[Entity]>
   - Add custom query methods (findByParentId, findBySchoolId, etc.)
   - Add findDuplicate[Entity] method for duplicate checking
   - Export singleton instance

6. Create services/[entity].service.ts
   - Add getUserIdBy[ParentId/DriverId] helper if entity belongs to parent/driver
   - Implement duplicate checking in create and update functions
   - Use ApiError with constants for error messages
   - Add created_at, updated_at, is_active fields

7. Create controllers/[entity].controller.ts
   - Export functions WITHOUT "Controller" suffix
   - Use asyncHandler for all async functions
   - Extract userId from req.user?.userId for authenticated routes
   - Validate userId before calling service
   - Use HTTP_STATUS and messages from constants

8. Create routes/[entity].routes.ts
   - Apply middleware in order: validate → auth → controller
   - Use verifyParentToken or verifyDriverToken for protected routes
   - Export default router

9. Register routes in routes/index.ts
   - Import and mount [entity]Routes

10. Update Documentation:
    - Add endpoints to docs/v1/api/API_DOCUMENTATION.md
    - Add Swagger definitions to docs/v1/api/openapi/swagger.yaml (use @docs/v1/api/openapi/SWAGGER_GUIDE.md)

Critical Requirements:
✅ ALL enums in constants/enums.ts (NOT type unions)
✅ ALL validation messages from constants/validationMessages.ts
✅ Controller exports WITHOUT "Controller" suffix
✅ User ID to foreign key conversion (if entity belongs to parent/driver)
✅ Duplicate checking based on business logic
✅ Soft delete (set is_active: false)
✅ snake_case for all database field names

Example Entity: Student (see @docs/v1/guides/IMPLEMENTATION_EXAMPLES.md)
```

---

## 🐛 Bug Fix Template

**Copy this when you encounter an error or bug**

```
I'm getting this error: [PASTE ERROR MESSAGE]

Context:
- File: [file path]
- What I was trying to do: [description]

Reference Documentation:
- @docs/v1/guides/TROUBLESHOOTING.md - Common mistakes and fixes
- @docs/v1/guides/AI_CONTEXT.md - Core patterns and conventions
- @docs/v1/guides/FOLDER_STRUCTURE.MD - File organization rules

Steps:
1. First check @docs/v1/guides/TROUBLESHOOTING.md for common mistakes
2. Verify file placement against @docs/v1/guides/FOLDER_STRUCTURE.MD
3. If not found, debug using patterns from @docs/v1/guides/AI_CONTEXT.md

Common issues to check:
- Controller naming (should NOT have "Controller" suffix)
- Enums should be in constants/enums.ts (not type unions)
- Validation messages from constants/validationMessages.ts
- File placement (layer folders, not feature folders)
- Middleware order (validate → auth → controller)
- User ID conversion (userId vs parent_id/driver_id)
- Import paths and aliases (@constants, @models, etc.)
```

---

## 🔗 New Endpoint Template

**Copy this when adding a single endpoint to existing module**

```
Add a new [GET/POST/PUT/DELETE] /[entity]/[path] endpoint.

Description: [What the endpoint should do]

Requirements:
- Entity: [entity name]
- Authentication: [Public / Parent / Driver / Any authenticated user]
- Request body: [fields needed]
- Response: [what to return]

Reference Documentation:
- @docs/v1/guides/AI_CONTEXT.md - Core patterns and conventions
- @docs/v1/guides/FOLDER_STRUCTURE.MD - File organization
- @docs/v1/guides/IMPLEMENTATION_EXAMPLES.md - Code structure examples
- @docs/v1/api/openapi/SWAGGER_GUIDE.md - API documentation patterns

Implementation:
1. Add repository method (if needed)
2. Add service function
3. Add controller function (export WITHOUT "Controller" suffix)
4. Add route with correct middleware order
5. Update Swagger documentation

Validation:
- Use VALIDATION_MESSAGES from constants for Joi schema
- Validate request params/body/query as needed

Authentication:
- Use verifyParentToken for parent-only routes
- Use verifyDriverToken for driver-only routes
- Use verifyToken_Middleware for any authenticated user
```

---

## 🔍 Code Review Template

**Copy this to request code review/audit**

```
Review the [module name / file path] for compliance with project standards.

Check against:
- @docs/v1/guides/AI_CONTEXT.md - All patterns and conventions
- @docs/v1/guides/FOLDER_STRUCTURE.MD - File organization and architecture
- @docs/v1/guides/TROUBLESHOOTING.md - Common mistakes
- @docs/v1/guides/IMPLEMENTATION_EXAMPLES.md - Reference implementation

Verify:
✅ Naming Conventions
   - Field names: snake_case
   - Functions: camelCase
   - Types/Interfaces: PascalCase
   - Constants: SCREAMING_SNAKE_CASE
   - Controller exports: WITHOUT "Controller" suffix

✅ File Placement
   - Files in layer folders (not feature folders)
   - One entity per file
   - Correct file naming: {entity}.{layer}.ts

✅ Constants Usage
   - No hardcoded strings
   - Error messages from constants/messages.ts
   - Validation messages from constants/validationMessages.ts
   - HTTP status codes from constants/httpStatus.ts

✅ Enum Handling
   - ALL enums in constants/enums.ts
   - No type unions in type files

✅ Validation
   - Joi schemas use VALIDATION_MESSAGES
   - Separate create and update schemas
   - No parent_id/driver_id in create request schemas

✅ Architecture
   - Controllers are thin (HTTP only)
   - Business logic in services
   - All DB operations through repositories
   - Repository extends BaseRepository

✅ Security
   - User ID to foreign key conversion
   - Authentication middleware applied
   - Authorization checks in controllers

✅ Data Integrity
   - Duplicate checking implemented
   - Soft delete (is_active flag)
   - Timestamps (created_at, updated_at)

✅ Documentation
   - API_DOCUMENTATION.md updated
   - swagger.yaml updated
   - Routes registered

Provide detailed feedback on any issues found.
```

---

## 📚 Documentation Template

**Copy this to update documentation**

```
Update documentation for [entity/feature].

Files to update:
1. docs/v1/api/API_DOCUMENTATION.md
   - Add endpoint descriptions
   - Include request/response examples
   - Document authentication requirements

2. docs/v1/api/openapi/swagger.yaml (follow @docs/v1/api/openapi/SWAGGER_GUIDE.md)
   - Add schemas in components.schemas
   - Add endpoints in paths
   - Include all HTTP status codes
   - Add examples

Entity: [entity name]
Endpoints: [list endpoints]
Reference: @docs/v1/api/openapi/SWAGGER_GUIDE.md for patterns
```

---

## 📖 Swagger Documentation Template

**Copy this to add Swagger docs for an endpoint**

```
Add Swagger documentation for the following endpoint:

Method: [GET/POST/PUT/DELETE]
Path: /[entity]/[path]
Description: [What it does]
Authentication: [Required/Not Required]

Request:
- Parameters: [path/query params]
- Body: [request body schema]

Response:
- Success (200/201): [response schema]
- Errors: [400, 401, 404, 409, 500]

Follow @docs/v1/api/openapi/SWAGGER_GUIDE.md for:
- Schema definitions
- Field type mapping
- Common patterns
- Response structures

Add to docs/v1/api/openapi/swagger.yaml:
1. Define schema in components.schemas (if new)
2. Add endpoint under paths
3. Include all response codes
4. Add example values
```

---

## 🤖 Auto-Generate Documentation from Routes Template

**Copy this to automatically generate/update API documentation from route files**

```
Generate complete API documentation from the route file.

Route File: @src/routes/[entity].routes.ts

Reference Documentation:
- @docs/v1/guides/AI_CONTEXT.md - Core patterns and conventions
- @docs/v1/api/openapi/SWAGGER_GUIDE.md - API documentation patterns and standards
- @docs/v1/guides/FOLDER_STRUCTURE.MD - File organization

Process:
1. Read the route file: @src/routes/[entity].routes.ts
2. Analyze ALL routes defined in the file:
   - Extract HTTP methods (GET, POST, PUT, DELETE)
   - Extract route paths and parameters
   - Identify middleware (validation, authentication)
   - Trace to controller functions
   - Trace to validation schemas (for request/response structure)

3. For EACH route found, gather complete information:
   - Read the validation schema from @src/validations/[entity].validation.ts
   - Read the controller from @src/controllers/[entity].controller.ts
   - Read the service from @src/services/[entity].service.ts
   - Read the type definitions from @src/types/[entity].type.ts
   - Extract authentication requirements from middleware
   - Identify request body/params/query structure
   - Identify response structure and status codes

4. Update docs/v1/api/API_DOCUMENTATION.md:
   - Add/update section for [Entity] endpoints
   - For each route, include:
     * Method and path
     * Description (infer from controller/service logic)
     * Authentication requirement (Public/Parent/Driver/Any)
     * Request parameters (path/query/body) with types
     * Request body example (JSON)
     * Success response example (JSON)
     * Error responses (400, 401, 404, 409, 500)
   - Follow existing documentation format in the file
   - Maintain alphabetical order by entity

5. Update docs/v1/api/openapi/swagger.yaml:
   - Add/update schemas in components.schemas:
     * [Entity] - Main entity schema
     * Create[Entity]Request - Request body for POST
     * Update[Entity]Request - Request body for PUT
     * [Entity]Response - Response wrapper with success/data
   - Add/update paths for each endpoint:
     * Include all HTTP methods
     * Add parameters (path, query)
     * Add requestBody (for POST/PUT)
     * Add responses (200, 201, 400, 401, 404, 409, 500)
     * Include security requirements
     * Add descriptions and examples
   - Follow patterns from @docs/v1/api/openapi/SWAGGER_GUIDE.md
   - Use existing response schemas (ApiResponse, ErrorResponse)

Critical Requirements:
✅ Read ALL related files (routes, validation, controller, service, types)
✅ Document EVERY route found in the route file
✅ Use actual field names and types from validation schemas
✅ Include authentication requirements based on middleware
✅ Add realistic example values in documentation
✅ Follow Swagger YAML formatting exactly (indentation matters!)
✅ Reuse common schemas (ApiResponse, ErrorResponse) from existing swagger.yaml
✅ Maintain consistency with existing documentation style
✅ Include all possible error codes (refer to controller implementations)

Example Usage:
Route File: @src/routes/student.routes.ts
→ This will analyze all student routes and update both documentation files
```

---

## 🔧 Database Migration Template

**Copy this when database schema changes**

```
Update code to match new database schema changes.

Database Changes:
- Table: [table_name]
- Changes: [what changed - new fields, modified fields, new enums, etc.]

Reference Documentation:
- Database/ping_parent_dbdiagram.dbml - Database schema
- @docs/v1/guides/AI_CONTEXT.md - Core patterns and conventions
- @docs/v1/guides/FOLDER_STRUCTURE.MD - File organization

Files to Update:
1. constants/enums.ts - Add/update enums
2. types/[entity].type.ts - Update interface
3. validations/[entity].validation.ts - Update Joi schemas
4. services/[entity].service.ts - Handle new fields
5. docs/v1/api/openapi/swagger.yaml - Update schemas
```

---

## 🧪 Testing Template

**Copy this to add tests**

```
Add tests for [module/feature].

Test Coverage Needed:
- Unit tests for service layer
- Integration tests for API endpoints
- Validation schema tests

Reference existing tests in:
- tests/ directory

Test Cases:
1. Happy path (success scenarios)
2. Validation errors (invalid input)
3. Authentication/authorization
4. Duplicate checking
5. Not found scenarios
6. Edge cases

Follow project testing patterns.
```

---

## ⚡ Quick Command Templates

**Ultra-short prompts for common tasks**

### Create Module

```
New module: [Entity] - follow patterns from:
- @docs/v1/guides/AI_CONTEXT.md
- @docs/v1/guides/FOLDER_STRUCTURE.MD
- @docs/v1/guides/IMPLEMENTATION_EXAMPLES.md (Student example)
DB: Database/ping_parent_dbdiagram.dbml table [table_name]
```

### Fix Error

```
Error: [error message]
Check: @docs/v1/guides/TROUBLESHOOTING.md, @docs/v1/guides/AI_CONTEXT.md, @docs/v1/guides/FOLDER_STRUCTURE.MD
```

### Add Endpoint

```
Add [METHOD] /[path]
Follow: @docs/v1/guides/AI_CONTEXT.md, @docs/v1/guides/FOLDER_STRUCTURE.MD
```

### Review Code

```
Review [file/module] against:
- @docs/v1/guides/AI_CONTEXT.md
- @docs/v1/guides/FOLDER_STRUCTURE.MD
- @docs/v1/guides/TROUBLESHOOTING.md
```

### Update Docs

```
Update Swagger for [entity]
Follow: @docs/v1/api/openapi/SWAGGER_GUIDE.md, @docs/v1/guides/AI_CONTEXT.md
```

### Auto-Generate Docs from Routes

```
Generate docs from route file:
@src/routes/[entity].routes.ts

Update:
- docs/v1/api/API_DOCUMENTATION.md
- docs/v1/api/openapi/swagger.yaml

Follow: @docs/v1/api/openapi/SWAGGER_GUIDE.md, @docs/v1/guides/AI_CONTEXT.md
Read all related files (validation, controller, service, types)
```

---

## 📌 Important Reminders

### Always Reference These Files FIRST:

- `@docs/v1/guides/AI_CONTEXT.md` - Core patterns and rules (READ FIRST!)
- `@docs/v1/guides/FOLDER_STRUCTURE.MD` - File organization and architecture (READ FIRST!)
- `@docs/v1/guides/IMPLEMENTATION_EXAMPLES.md` - Student module (complete example)
- `@docs/v1/guides/TROUBLESHOOTING.md` - Common mistakes to avoid
- `@docs/v1/api/openapi/SWAGGER_GUIDE.md` - API documentation guide
- `Database/ping_parent_dbdiagram.dbml` - Database schema

### Critical Rules (Never Forget):

1. ✅ Enums in `constants/enums.ts` (NOT type unions)
2. ✅ Validation messages from `constants/validationMessages.ts`
3. ✅ Controller exports WITHOUT "Controller" suffix
4. ✅ snake_case for database field names
5. ✅ User ID → Foreign Key conversion
6. ✅ Duplicate checking
7. ✅ Middleware order: validate → auth → controller
8. ✅ Files in layer folders (not feature folders)

---

## 🎯 Usage Guide

1. **Copy the appropriate template** from above
2. **Replace placeholders** in [BRACKETS] with your specific details
3. **Paste to AI agent** (Claude, ChatGPT, etc.)
4. **AI will follow** the documented patterns automatically

---

**Document Version**: 1.0
**Last Updated**: 2025

**Related Documentation**:

- [AI_CONTEXT.md](v1/guides/AI_CONTEXT.md) - Core patterns and conventions
- [FOLDER_STRUCTURE.MD](v1/guides/FOLDER_STRUCTURE.MD) - File organization and architecture
- [IMPLEMENTATION_EXAMPLES.md](v1/guides/IMPLEMENTATION_EXAMPLES.md) - Complete examples
- [SWAGGER_GUIDE.md](v1/api/openapi/SWAGGER_GUIDE.md) - API documentation
- [TROUBLESHOOTING.md](v1/guides/TROUBLESHOOTING.md) - Common mistakes
