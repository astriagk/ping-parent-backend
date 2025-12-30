# Project Architecture Overview

Visual guide to the Ping Parent Backend project structure and documentation organization.

**Version:** 1.0.0
**Last Updated:** 2025-12-30

---

## 📐 High-Level Architecture

```
pp-backend/                           # Root Project Directory
│
├── 🗄️ Database/                       # DATABASE LAYER (Source Code)
│   ├── ping_parent_dbdiagram.dbml   # ⭐ Single source of truth for schema
│   ├── migrations/                   # Database migration scripts
│   └── seeds/                        # Seed data for development
│
├── 📚 docs/                          # DOCUMENTATION LAYER (API Docs)
│   ├── README.md                     # Documentation hub
│   ├── VERSIONING.md                 # Versioning strategy
│   ├── STRUCTURE.md                  # Quick reference
│   ├── SUMMARY.md                    # Overview
│   └── v1/                          # Version 1.x.x documentation
│       ├── api/                      # API reference docs
│       ├── guides/                   # Developer guides
│       └── CHANGELOG.md              # v1 change history
│
├── 💻 src/                           # APPLICATION LAYER (Source Code)
│   ├── controllers/                  # Request handlers
│   ├── services/                     # Business logic
│   ├── repositories/                 # Data access
│   ├── routes/                       # API endpoints
│   ├── types/                        # TypeScript types
│   ├── validations/                  # Input validation
│   ├── middleware/                   # Express middleware
│   ├── constants/                    # Constants & enums
│   ├── utils/                        # Utility functions
│   └── server.ts                     # Application entry point
│
├── 📦 node_modules/                  # Dependencies
├── 🔧 package.json                   # Project metadata & dependencies
├── ⚙️ tsconfig.json                  # TypeScript configuration
└── 📖 README.md                      # Project overview
```

---

## 🔗 Layer Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Database/ping_parent_dbdiagram.dbml                 │  │
│  │  • Defines tables, fields, relationships             │  │
│  │  • Used by: migration tools, type generators         │  │
│  │  • Referenced by: all documentation versions         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │ references
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  DOCUMENTATION LAYER                        │
│  ┌──────────────┐          ┌──────────────┐                │
│  │   docs/v1/   │          │   docs/v2/   │ (future)       │
│  │              │          │              │                │
│  │  • API Docs  │          │  • API Docs  │                │
│  │  • Guides    │          │  • Guides    │                │
│  │              │          │              │                │
│  │  References  │          │  References  │                │
│  │  Database/ ──┼──────────┼─► Database/  │                │
│  └──────────────┘          └──────────────┘                │
└─────────────────────────────────────────────────────────────┘
                           │ documents
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  src/                                                 │  │
│  │  • Implements API endpoints (v1, v2, etc.)           │  │
│  │  • Uses types generated from Database/               │  │
│  │  • Business logic, controllers, services             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Documentation Organization

### Why We Use This Structure

```
✅ CORRECT: Database outside docs/
────────────────────────────────────
Database/                          docs/v1/     docs/v2/
  schema.dbml ────references────▶   api/   ◀──  api/
                                    guides/     guides/

Benefits:
• Single source of truth
• No duplication
• Clear ownership (schema = code)
• API versions share database
```

```
❌ WRONG: Database inside docs/
────────────────────────────────────
docs/v1/           docs/v2/
  database/          database/
    schema.dbml       schema.dbml  ← DUPLICATE!

Problems:
• Duplication and sync issues
• Unclear which is canonical
• Schema mixed with docs
```

---

## 🔄 Version Evolution

### Current State (v1.0.0)

```
Database/schema.dbml (current)
         ↓ used by
    ┌────────────┐
    │  src/      │
    │  API v1    │
    └────────────┘
         ↓ documented by
    docs/v1/
```

### Future State (v2.0.0)

```
Database/schema.dbml (evolved, backward compatible)
         ↓ used by
    ┌────────────┬────────────┐
    │  src/      │  src/      │
    │  API v1    │  API v2    │
    │  (legacy)  │  (current) │
    └────────────┴────────────┘
         ↓ documented by
    ┌────────────┬────────────┐
    │ docs/v1/   │ docs/v2/   │
    └────────────┴────────────┘
```

**Key Points:**
- Same database serves both API versions
- API v1 uses compatibility layer for renamed fields
- API v2 uses new field names directly
- Both reference same `Database/schema.dbml`

---

## 🎯 Design Principles

### 1. Separation of Concerns

```
Database/     → What data exists (structure)
docs/         → How to access data (API)
src/          → Implementation (code)
```

### 2. Single Source of Truth

```
Schema Definition:     Database/schema.dbml (ONE FILE)
Type Generation:       src/types/*.ts (generated from schema)
Documentation:         docs/v*/api/ (describes schema)
```

### 3. Layered Architecture

```
Presentation Layer:    docs/ (documentation for consumers)
Application Layer:     src/ (business logic, API endpoints)
Data Layer:           Database/ + repositories
```

---

## 📊 File Flow

### New Feature Implementation Flow

```
1. Update Schema
   Database/schema.dbml
   └─► Add new table/fields

2. Generate Types
   src/types/
   └─► Create TypeScript interfaces from schema

3. Implement Feature
   src/
   ├─► types/
   ├─► validations/
   ├─► repositories/
   ├─► services/
   ├─► controllers/
   └─► routes/

4. Update Documentation
   docs/v1/
   ├─► api/API_DOCUMENTATION.md
   ├─► api/openapi/swagger.yaml
   └─► CHANGELOG.md
```

### Documentation Update Flow

```
1. Code Change
   src/ → Feature implementation

2. Schema Change (if needed)
   Database/schema.dbml → Update fields

3. API Documentation
   docs/v1/api/API_DOCUMENTATION.md → Add endpoints

4. OpenAPI Spec
   docs/v1/api/openapi/swagger.yaml → Update spec

5. Changelog
   docs/v1/CHANGELOG.md → Document change
```

---

## 🗺️ Navigation Guide

### For Implementation

```
Need:           Start Here:
────────────────────────────────────────────────────
Schema info  →  Database/ping_parent_dbdiagram.dbml
Patterns     →  docs/v1/guides/AI_CONTEXT.md
Examples     →  docs/v1/guides/IMPLEMENTATION_EXAMPLES.md
Reference    →  src/routes/auth.routes.ts (template)
```

### For API Consumers

```
Need:           Start Here:
────────────────────────────────────────────────────
API Docs     →  docs/v1/api/API_DOCUMENTATION.md
OpenAPI      →  docs/v1/api/openapi/swagger.yaml
Testing      →  docs/v1/api/postman/
Examples     →  docs/v1/api/TESTING_DATA.md
```

---

## 🔐 Key Files

| File | Type | Purpose | Owner |
|------|------|---------|-------|
| `Database/schema.dbml` | Source Code | Database schema definition | Backend Team |
| `docs/v1/guides/AI_CONTEXT.md` | Documentation | Implementation patterns | Backend Team |
| `docs/v1/api/API_DOCUMENTATION.md` | Documentation | API reference | Backend Team |
| `docs/v1/api/openapi/swagger.yaml` | Specification | Machine-readable API spec | Backend Team |
| `src/types/*.ts` | Source Code | TypeScript types | Generated from schema |

---

## 🚦 Decision Tree: Where Should This Go?

```
Is it a database table/field definition?
├─ YES → Database/schema.dbml
└─ NO ↓

Is it source code that runs?
├─ YES → src/
└─ NO ↓

Is it API documentation?
├─ YES → docs/v1/api/
└─ NO ↓

Is it a developer guide?
├─ YES → docs/v1/guides/
└─ NO ↓

Is it test-related?
├─ YES (Postman) → docs/v1/api/postman/
├─ YES (Unit tests) → src/**/*.test.ts
└─ NO ↓

When in doubt → Ask in #dev-questions
```

---

## 📚 Related Documentation

- **[README.md](README.md)** - Documentation hub
- **[VERSIONING.md](VERSIONING.md)** - Versioning strategy (includes database section)
- **[STRUCTURE.md](STRUCTURE.md)** - Quick file reference
- **[SUMMARY.md](SUMMARY.md)** - Documentation overview

---

## 💡 Best Practices

### ✅ DO

- Keep database schema in `Database/`
- Version only API documentation in `docs/v*/`
- Reference schema from all doc versions
- Use additive database changes when possible
- Document breaking changes in CHANGELOG.md

### ❌ DON'T

- Copy schema into `docs/v1/`, `docs/v2/`
- Create `Database/v1/`, `Database/v2/` (unless truly separate DBs)
- Mix documentation with source code
- Skip updating CHANGELOG.md
- Make breaking database changes without migration plan

---

**Maintained By:** Development Team
**Questions?** Check [README.md](README.md) or ask in #dev-questions
