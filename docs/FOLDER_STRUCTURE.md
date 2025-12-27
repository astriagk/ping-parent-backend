# Ping Parent Backend - Folder Structure

```
pp-backend/
├── src/
│   ├── config/
│   │   ├── index.ts
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── env.ts
│   │
│   ├── constants/
│   │   ├── index.ts
│   │   ├── httpStatus.ts
│   │   ├── messages.ts
│   │   ├── enums.ts
│   │   ├── collections.ts
│   │   └── validationMessages.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── driver.controller.ts
│   │   └── parent.controller.ts
│   │
│   ├── middlewares/
│   │   ├── index.ts
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validate.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   └── asyncHandler.middleware.ts
│   │
│   ├── repositories/
│   │   ├── base.repository.ts
│   │   ├── auth.repository.ts
│   │   ├── driver.repository.ts
│   │   └── parent.repository.ts
│   │
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── driver.routes.ts
│   │   └── parent.routes.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── driver.service.ts
│   │   ├── parent.service.ts
│   │   ├── role.service.ts
│   │   ├── token.service.ts
│   │   └── redis.service.ts
│   │
│   ├── types/
│   │   ├── global/
│   │   ├── auth.type.ts
│   │   ├── driver.type.ts
│   │   └── parent.type.ts
│   │
│   ├── utils/
│   │   ├── index.ts
│   │   ├── logger.ts
│   │   ├── apiResponse.ts
│   │   ├── apiError.ts
│   │   └── helpers.ts
│   │
│   ├── validations/
│   │   ├── auth.validation.ts
│   │   ├── driver.validation.ts
│   │   └── parent.validation.ts
│   │
│   ├── environment/
│   │   ├── .env
│   │   └── .env.example
│   │
│   ├── app.ts
│   └── server.ts
│
├── Database/
│   ├── ping_parent_dbdiagram.dbml
│   ├── ping_parent_dbdiagram.dbdiagram
│   └── db.md
│
├── docs/
│   ├── AI_CONTEXT.md
│   ├── SUMMARY.md
│   ├── FOLDER_STRUCTURE.md
│   └── API_DOCUMENTATION.md
│
├── .husky/
│   ├── pre-commit
│   └── _/
│
├── .gitignore
├── .prettierignore
├── .prettierrc.json
├── eslint.config.js
├── jest.config.cjs
├── tsconfig.json
├── package.json
├── package-lock.json
└── README.md
```

## 📁 Directory Descriptions

### **src/config/**

Configuration files for database, Redis, environment variables, and other app-level settings.

### **src/constants/**

Centralized constants including HTTP status codes, messages, enums, database collection names, and validation messages.

### **src/controllers/**

Request handlers that receive HTTP requests, delegate to services, and return responses.

### **src/middlewares/**

Middleware functions for authentication, validation, error handling, rate limiting, and async handling.

### **src/repositories/**

Data access layer that interacts with MongoDB. All repositories extend `BaseRepository<T>`.

### **src/routes/**

API route definitions that map endpoints to controllers with middleware.

### **src/services/**

Business logic layer containing the core application logic.

### **src/types/**

TypeScript type definitions and interfaces matching the database schema.

### **src/utils/**

Helper functions and utilities for logging, API responses, errors, and common operations.

### **src/validations/**

Joi validation schemas for request validation.

### **src/environment/**

Environment configuration files (.env and .env.example).

### **Database/**

Database schema files in DBML format and documentation.

### **docs/**

Project documentation including implementation guides, API docs, and this folder structure.

---

## 🎯 Key Principles

1. **Layered Architecture**: Routes → Controllers → Services → Repositories → Database
2. **One Entity Per File**: Each entity gets one file per layer (e.g., `auth.controller.ts`, `auth.service.ts`)
3. **Centralized Constants**: No hardcoded strings; all constants in `src/constants/`
4. **Type Safety**: All types match database schema exactly (snake_case fields)
5. **Index Files**: Each directory has `index.ts` for clean exports (where applicable)

---

## 📝 File Naming Conventions

- **Controllers**: `{entity}.controller.ts`
- **Services**: `{entity}.service.ts`
- **Repositories**: `{entity}.repository.ts`
- **Routes**: `{entity}.routes.ts`
- **Types**: `{entity}.type.ts`
- **Validations**: `{entity}.validation.ts`
