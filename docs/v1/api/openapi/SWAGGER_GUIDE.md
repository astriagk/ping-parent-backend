# Swagger/OpenAPI Documentation Guide - Ping Parent Backend

This guide explains how to document API endpoints using Swagger/OpenAPI 3.0 specification for the Ping Parent backend.

## Table of Contents

1. [Overview](#overview)
2. [File Location and Structure](#file-location-and-structure)
3. [When to Update Swagger](#when-to-update-swagger)
4. [Adding a New Endpoint](#adding-a-new-endpoint)
5. [Schema Definitions](#schema-definitions)
6. [Common Patterns](#common-patterns)
7. [Field Type Mapping](#field-type-mapping)
8. [Testing and Validation](#testing-and-validation)

---

## Overview

**Location**: `docs/v1/api/openapi/swagger.yaml`

The project uses OpenAPI 3.0 specification for API documentation. All API endpoints MUST be documented in the Swagger file.

### Basic Structure

```yaml
openapi: 3.0.3
info:
  title: Ping Parent Backend API
  version: 1.0.0
  description: API documentation for Ping Parent application

servers:
  - url: http://localhost:3000/api
    description: Local development server
  - url: https://staging-api.pingparent.com/api
    description: Staging server
  - url: https://api.pingparent.com/api
    description: Production server

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    # Schema definitions here

paths:
  # API endpoints here
```

---

## File Location and Structure

### Main Sections

1. **info**: API metadata (title, version, description)
2. **servers**: Environment URLs (local, staging, production)
3. **components**: Reusable components
   - **securitySchemes**: Authentication methods (JWT Bearer)
   - **schemas**: Data models and types
4. **paths**: API endpoints

---

## When to Update Swagger

Update `docs/v1/api/openapi/swagger.yaml` whenever you:
- ✅ Create a new API endpoint
- ✅ Modify request/response payloads
- ✅ Add new schemas/models
- ✅ Change authentication requirements
- ✅ Update error responses
- ✅ Add or modify query parameters

**IMPORTANT**: Keep `swagger.yaml` and `API_DOCUMENTATION.md` in sync!

---

## Adding a New Endpoint

### Step 1: Define Schemas

Add request and response schemas in `components.schemas`:

```yaml
components:
  schemas:
    # Entity schema (response)
    Student:
      type: object
      properties:
        _id:
          type: string
          description: MongoDB internal ID
        student_id:
          type: string
          description: Unique student identifier
          example: "abc123xyz"
        parent_id:
          type: string
          description: Parent's MongoDB ID
        school_id:
          type: string
          description: School's MongoDB ID
        student_name:
          type: string
          example: "John Doe"
        class:
          type: string
          example: "5th Grade"
        section:
          type: string
          example: "A"
        gender:
          type: string
          enum: [male, female, other]
          example: "male"
        is_active:
          type: boolean
          default: true
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    # Create request schema
    CreateStudentRequest:
      type: object
      required:
        - school_id
        - student_name
        - class
        - pickup_address_id
      properties:
        school_id:
          type: string
          description: School MongoDB ID
        student_name:
          type: string
          minLength: 2
          maxLength: 100
          example: "John Doe"
        class:
          type: string
          maxLength: 20
          example: "5th Grade"
        section:
          type: string
          maxLength: 10
          example: "A"
        gender:
          type: string
          enum: [male, female, other]
          example: "male"
        date_of_birth:
          type: string
          format: date
          example: "2015-06-15"
        pickup_address_id:
          type: string
        emergency_contact:
          type: string
          pattern: '^[+]?[0-9]{10,15}$'
          example: "+1234567890"
        medical_info:
          type: string
          maxLength: 500
        photo_url:
          type: string
          format: uri

    # Update request schema
    UpdateStudentRequest:
      type: object
      properties:
        student_name:
          type: string
          minLength: 2
          maxLength: 100
        class:
          type: string
          maxLength: 20
        section:
          type: string
          maxLength: 10
        gender:
          type: string
          enum: [male, female, other]
        date_of_birth:
          type: string
          format: date
        pickup_address_id:
          type: string
        emergency_contact:
          type: string
          pattern: '^[+]?[0-9]{10,15}$'
        medical_info:
          type: string
          maxLength: 500
        photo_url:
          type: string
          format: uri

    # Error response schema (reusable)
    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: string
          example: "Error message"
        details:
          type: array
          items:
            type: string

    # Success response schema (generic)
    SuccessResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        message:
          type: string
        data:
          type: object
```

### Step 2: Define Endpoints

Add endpoint paths in `paths`:

```yaml
paths:
  /students:
    post:
      tags:
        - Student
      summary: Create new student
      description: Create a new student record. Parent ID is automatically derived from authenticated user.
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateStudentRequest'
            example:
              school_id: "school123"
              student_name: "John Doe"
              class: "5th Grade"
              section: "A"
              gender: "male"
              pickup_address_id: "address123"
      responses:
        '201':
          description: Student created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  message:
                    type: string
                    example: "Student created successfully"
                  data:
                    $ref: '#/components/schemas/Student'
        '400':
          description: Bad request - validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '401':
          description: Unauthorized - missing or invalid token
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '409':
          description: Conflict - student already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
              example:
                success: false
                error: "A student with the same name, school, and class already exists for this parent"

  /students/my-students:
    get:
      tags:
        - Student
      summary: Get all students for authenticated parent
      description: Retrieve all students belonging to the authenticated parent
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Successfully retrieved students
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Student'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /students/{id}:
    get:
      tags:
        - Student
      summary: Get student by ID
      description: Retrieve student details by MongoDB ObjectId
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
          description: MongoDB ObjectId of the student
          example: "507f1f77bcf86cd799439011"
      responses:
        '200':
          description: Successfully retrieved student
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    $ref: '#/components/schemas/Student'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '404':
          description: Student not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
              example:
                success: false
                error: "Student not found"

    put:
      tags:
        - Student
      summary: Update student
      description: Update student information by ID
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
          description: MongoDB ObjectId of the student
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateStudentRequest'
      responses:
        '200':
          description: Student updated successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  message:
                    type: string
                    example: "Student updated successfully"
                  data:
                    $ref: '#/components/schemas/Student'
        '400':
          description: Bad request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '404':
          description: Student not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '409':
          description: Conflict - duplicate student
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

    delete:
      tags:
        - Student
      summary: Delete student (soft delete)
      description: Soft delete a student by setting is_active to false
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
          description: MongoDB ObjectId of the student
      responses:
        '200':
          description: Student deleted successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  message:
                    type: string
                    example: "Student deleted successfully"
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '404':
          description: Student not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
```

---

## Schema Definitions

### Naming Conventions

- **Entity schemas**: PascalCase (e.g., `Student`, `School`)
- **Request schemas**: `Create{Entity}Request`, `Update{Entity}Request`
- **Response schemas**: `{Entity}Response` (if needed)
- **Field names**: snake_case to match database (e.g., `student_name`, `created_at`)

### Required vs Optional Fields

```yaml
Student:
  type: object
  required:              # List required fields
    - student_id
    - parent_id
    - school_id
    - student_name
    - class
  properties:
    student_id:
      type: string
    student_name:
      type: string
    section:             # Optional field (not in required list)
      type: string
```

### Using Enums

```yaml
gender:
  type: string
  enum: [male, female, other]  # Match constants/enums.ts
  example: "male"

trip_type:
  type: string
  enum: [pickup, drop]
  example: "pickup"

trip_status:
  type: string
  enum: [scheduled, started, in_progress, completed, cancelled]
  default: "scheduled"
```

---

## Common Patterns

### 1. Protected Endpoint (Requires Authentication)

```yaml
/endpoint:
  get:
    security:
      - BearerAuth: []    # Requires JWT token
    # ... rest of endpoint
```

### 2. Public Endpoint (No Authentication)

```yaml
/auth/login:
  post:
    security: []          # No authentication required
    # ... rest of endpoint
```

### 3. Path Parameters

```yaml
/students/{id}:
  get:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
        description: Student's MongoDB ObjectId
        example: "507f1f77bcf86cd799439011"
```

### 4. Query Parameters

```yaml
/students:
  get:
    parameters:
      - name: page
        in: query
        required: false
        schema:
          type: integer
          default: 1
          minimum: 1
        description: Page number for pagination
      - name: limit
        in: query
        required: false
        schema:
          type: integer
          default: 10
          minimum: 1
          maximum: 100
        description: Number of items per page
      - name: school_id
        in: query
        required: false
        schema:
          type: string
        description: Filter by school ID
```

### 5. File Upload

```yaml
/upload/photo:
  post:
    requestBody:
      required: true
      content:
        multipart/form-data:
          schema:
            type: object
            properties:
              file:
                type: string
                format: binary
                description: Photo file to upload
```

### 6. Nested Objects

```yaml
Address:
  type: object
  properties:
    label:
      type: string
      example: "Home"
    address_line1:
      type: string
      example: "123 Main St"
    city:
      type: string
      example: "Springfield"
    location:
      type: object
      properties:
        latitude:
          type: number
          format: double
          minimum: -90
          maximum: 90
          example: 40.7128
        longitude:
          type: number
          format: double
          minimum: -180
          maximum: 180
          example: -74.0060
```

### 7. Arrays

```yaml
# Array of strings
tags:
  type: array
  items:
    type: string
  example: ["tag1", "tag2", "tag3"]

# Array of objects
students:
  type: array
  items:
    $ref: '#/components/schemas/Student'
```

---

## Field Type Mapping

Map TypeScript/Database types to OpenAPI types:

| TypeScript/DB Type | OpenAPI Type | Format | Example |
|-------------------|--------------|--------|---------|
| `string` | `string` | - | `"John Doe"` |
| `number` | `number` | - | `42` |
| `number` (integer) | `integer` | - | `42` |
| `number` (decimal) | `number` | `double` or `float` | `42.5` |
| `boolean` | `boolean` | - | `true` |
| `Date` | `string` | `date-time` | `"2024-01-15T10:30:00Z"` |
| `Date` (date only) | `string` | `date` | `"2024-01-15"` |
| `enum` | `string` | - | `enum: [value1, value2]` |
| `object` | `object` | - | `{ key: "value" }` |
| `array` | `array` | - | `items: { type: string }` |
| URL | `string` | `uri` | `"https://example.com"` |
| Email | `string` | `email` | `"user@example.com"` |
| Phone | `string` | - | Add `pattern` validation |

### Examples

```yaml
# String with length constraints
student_name:
  type: string
  minLength: 2
  maxLength: 100
  example: "John Doe"

# Number with range constraints
age:
  type: integer
  minimum: 1
  maximum: 120
  example: 25

# Date-time
created_at:
  type: string
  format: date-time
  example: "2024-01-15T10:30:00Z"

# Date only
date_of_birth:
  type: string
  format: date
  example: "2015-06-15"

# URL
photo_url:
  type: string
  format: uri
  example: "https://example.com/photo.jpg"

# Email
email:
  type: string
  format: email
  example: "user@example.com"

# Phone with pattern
phone_number:
  type: string
  pattern: '^[+]?[0-9]{10,15}$'
  example: "+1234567890"

# Enum
gender:
  type: string
  enum: [male, female, other]
  example: "male"
```

---

## Testing and Validation

### 1. Validate YAML Syntax

Use an online YAML validator to check for syntax errors.

### 2. Test with Swagger Editor

1. Go to [https://editor.swagger.io/](https://editor.swagger.io/)
2. Paste your `swagger.yaml` content
3. Verify all endpoints render correctly
4. Check for schema reference errors
5. Test example values

### 3. Swagger UI Integration

If your project has Swagger UI integrated:

```bash
# Start the server
npm run dev

# Access Swagger UI at
http://localhost:3000/api-docs
```

### 4. Common Validation Errors

**Error**: `Could not resolve reference: #/components/schemas/Student`
- **Fix**: Ensure the schema is defined in `components.schemas`

**Error**: `Structural error at paths./students`
- **Fix**: Check YAML indentation (use 2 spaces)

**Error**: `should NOT have additional properties`
- **Fix**: Remove unsupported OpenAPI properties

---

## Checklist for New Endpoints

When adding a new module, ensure:

- [ ] Add tag for the entity category (e.g., `- Student`)
- [ ] Define all schemas in `components.schemas`:
  - [ ] Entity schema (response)
  - [ ] Create request schema
  - [ ] Update request schema (if applicable)
- [ ] Document all CRUD endpoints:
  - [ ] POST (create)
  - [ ] GET (list/retrieve)
  - [ ] GET by ID
  - [ ] PUT/PATCH (update)
  - [ ] DELETE
- [ ] Include authentication (`security: - BearerAuth: []`) for protected routes
- [ ] Define all parameters (path, query) with types and descriptions
- [ ] Document request bodies with schema references
- [ ] Define all response codes (200, 201, 400, 401, 404, 409, 500)
- [ ] Add examples for request/response bodies
- [ ] Use `$ref` to reference reusable schemas
- [ ] Match field names with database schema (snake_case)
- [ ] Include validation rules (minLength, maxLength, pattern, required)
- [ ] Keep in sync with `API_DOCUMENTATION.md`

---

## Tips and Best Practices

1. **Reuse Schemas**: Use `$ref` to avoid duplication
2. **Add Examples**: Provide example values for clarity
3. **Document Errors**: Include all possible error responses
4. **Use Descriptions**: Add helpful descriptions for parameters and fields
5. **Match Database**: Ensure field names match the database schema (snake_case)
6. **Version Control**: Keep swagger.yaml in version control
7. **Stay Consistent**: Follow the same patterns across all endpoints
8. **Test Regularly**: Validate after every change

---

## Related Documents

- [AI_CONTEXT.md](./AI_CONTEXT.md) - Core patterns and conventions
- [IMPLEMENTATION_EXAMPLES.md](./IMPLEMENTATION_EXAMPLES.md) - Complete implementation examples
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common mistakes and fixes
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Detailed API documentation

---

**Document Version**: 1.0
**Last Updated**: 2025
