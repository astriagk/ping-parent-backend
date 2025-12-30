# Documentation Versioning Strategy

This document explains the versioning strategy for the Ping Parent Backend API documentation and how to manage different versions without conflicts.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Versioning Scheme](#versioning-scheme)
3. [Directory Structure](#directory-structure)
4. [Database Schema Location](#database-schema-location)
5. [When to Create a New Version](#when-to-create-a-new-version)
6. [Version Migration Guide](#version-migration-guide)
7. [Best Practices](#best-practices)
8. [Examples](#examples)

---

## Overview

The Ping Parent Backend documentation uses **Semantic Versioning (SemVer)** to organize API documentation, ensuring:

- **No conflicts** between different API versions
- **Clear separation** of breaking changes
- **Easy navigation** for users on different versions
- **Smooth migration** paths for upgrading

---

## Versioning Scheme

We follow **Semantic Versioning 2.0.0**: `MAJOR.MINOR.PATCH`

### Version Format: `vMAJOR.MINOR.PATCH`

```
v1.2.3
│ │ │
│ │ └─ PATCH: Bug fixes, typos, minor corrections (backward compatible)
│ └─── MINOR: New features, new endpoints (backward compatible)
└───── MAJOR: Breaking changes, incompatible API changes
```

### Version Number Meanings

#### MAJOR Version (v1.x.x → v2.x.x)

**When to increment:**
- Breaking API changes (endpoint removal, required field changes)
- Authentication method changes
- Database schema breaking changes
- Response format changes that break existing clients

**Documentation impact:**
- Create new `docs/v2/` folder
- Copy `v1/` as template
- Update all references
- Maintain `v1/` for legacy support

**Example:**
```
v1.5.2 → v2.0.0 (Removed deprecated endpoints, changed auth from JWT to OAuth)
```

#### MINOR Version (v1.0.x → v1.1.x)

**When to increment:**
- New API endpoints added
- New optional fields added to requests/responses
- New features that don't break existing functionality
- New modules added

**Documentation impact:**
- Update existing `docs/v1/` files
- Add new endpoints to API_DOCUMENTATION.md
- Update swagger.yaml
- Update CHANGELOG.md

**Example:**
```
v1.0.5 → v1.1.0 (Added rating/review module with new endpoints)
```

#### PATCH Version (v1.0.0 → v1.0.1)

**When to increment:**
- Bug fixes
- Documentation corrections
- Performance improvements
- Security patches (non-breaking)

**Documentation impact:**
- Update existing `docs/v1/` files
- Fix errors in documentation
- Update CHANGELOG.md

**Example:**
```
v1.0.0 → v1.0.1 (Fixed validation bug, updated API docs)
```

---

## Directory Structure

### Current Structure (v1.0.0)

```
docs/
├── README.md                          # Navigation hub
├── VERSIONING.md                      # This file
├── SUMMARY.md                         # Overview
│
└── v1/                                # Version 1.x.x
    ├── api/
    │   ├── postman/
    │   │   ├── collections/
    │   │   ├── environments/
    │   │   └── POSTMAN_SETUP_GUIDE.md
    │   ├── openapi/
    │   │   ├── swagger.yaml
    │   │   └── SWAGGER_GUIDE.md
    │   ├── API_DOCUMENTATION.md
    │   └── TESTING_DATA.md
    ├── guides/
    │   ├── AI_CONTEXT.md
    │   ├── AI_PROMPTS.md
    │   ├── IMPLEMENTATION_EXAMPLES.md
    │   ├── TROUBLESHOOTING.md
    │   └── FOLDER_STRUCTURE.MD
    └── CHANGELOG.md
```

### Future Structure (when v2 is needed)

```
docs/
├── README.md
├── VERSIONING.md
├── SUMMARY.md
│
├── v1/                                # Legacy (maintained)
│   └── (same structure as above)
│
└── v2/                                # Current version
    ├── api/
    ├── guides/
    └── CHANGELOG.md
```

---

## Database Schema Location

### Why Database Schema is NOT Versioned with Documentation

The database schema (`Database/ping_parent_dbdiagram.dbml`) is kept **outside** the versioned documentation structure for important architectural reasons:

#### ✅ Current Structure (Recommended)

```
pp-backend/
├── Database/                          # DATABASE LAYER (source code)
│   ├── ping_parent_dbdiagram.dbml    # Single source of truth
│   ├── migrations/                    # Database migrations
│   └── seeds/                         # Seed data
│
├── docs/                              # DOCUMENTATION LAYER
│   ├── v1/                           # API v1 docs (references ../Database/)
│   └── v2/                           # API v2 docs (references ../Database/)
│
└── src/                               # APPLICATION LAYER
    ├── types/                         # Generated from Database/
    └── ...
```

#### Key Principles

1. **Database Schema is Source Code, Not Documentation**
   - The `.dbml` file is operational code that defines your data model
   - Used by migration tools, type generators, and database visualization tools
   - It's not just documentation describing the database—it IS the database definition

2. **Single Source of Truth**
   - One canonical schema file prevents duplication and sync issues
   - All API versions (v1, v2, v3) reference the same schema
   - Changes to schema are made in one place only

3. **API Versions Can Share Database Schema**
   - Common pattern: API v1 and v2 run on the same database
   - API versioning handles breaking changes in endpoints, not database
   - Example: v2 might add new fields but v1 ignores them

4. **Separation of Concerns**
   ```
   Database/     → What data exists (source code)
   docs/v1/api/  → How to access data via API v1 (documentation)
   docs/v2/api/  → How to access data via API v2 (documentation)
   ```

#### When to Version Database Schema

Only create `Database/v1/` and `Database/v2/` if you have **separate databases**:

```
Database/
├── v1/
│   ├── schema.dbml               # Old database (legacy)
│   └── migrations/
└── v2/
    ├── schema.dbml               # New database (current)
    └── migrations/
```

**This is only needed when:**
- ❌ Running completely separate databases for different API versions
- ❌ Breaking schema changes that can't coexist
- ❌ Very rare and generally avoided

**Why this is rare:**
- Doubles database maintenance cost
- Complicates data synchronization
- Makes migrations harder
- Most apps use a single evolving database

#### How Schema Changes Work

```
Example Timeline:
v1.0.0: Database has 'users', 'trips' tables
        ↓
v1.1.0: Add 'ratings' table (backward compatible)
        → Update Database/schema.dbml
        → Document in docs/v1/CHANGELOG.md
        → API v1 continues working
        ↓
v2.0.0: Rename 'trips.status' to 'trips.state' (breaking change)
        → Update Database/schema.dbml
        → API v1 uses old field name (compatibility layer in code)
        → API v2 uses new field name
        → Both APIs share same database!
```

#### Best Practice: Database Evolution Strategy

1. **Additive Changes** (Preferred)
   - Add new tables, columns, indexes
   - Keep old columns for backward compatibility
   - Use application layer to map old → new

2. **Deprecation Period**
   - Mark old columns as deprecated
   - Support both old and new in parallel
   - Remove after all APIs migrated

3. **Migration Scripts**
   - Store in `Database/migrations/`
   - Version-controlled with timestamps
   - Apply in sequence regardless of API version

#### Documentation References

All documentation versions reference the **same** database schema:

```markdown
<!-- In docs/v1/guides/AI_CONTEXT.md -->
See database schema: ../Database/ping_parent_dbdiagram.dbml

<!-- In docs/v2/guides/AI_CONTEXT.md -->
See database schema: ../Database/ping_parent_dbdiagram.dbml
```

#### Summary

**Keep Database/ outside docs/** because:
- ✅ Avoids duplication
- ✅ Single source of truth
- ✅ Schema is code, not just docs
- ✅ Multiple API versions can share one database
- ✅ Follows industry best practices

---

## When to Create a New Version

### ✅ Create New Major Version (v2/) When:

1. **Breaking API Changes:**
   - Removing endpoints
   - Changing required fields
   - Modifying authentication schemes
   - Changing response structure

2. **Incompatible Changes:**
   - Database schema overhaul
   - Complete module rewrites
   - Framework migrations

3. **Architecture Changes:**
   - REST to GraphQL migration
   - Microservices split
   - Major technology stack changes

### ❌ Don't Create New Version When:

1. **Adding features** (increment MINOR instead)
2. **Fixing bugs** (increment PATCH instead)
3. **Adding optional fields** (increment MINOR)
4. **Documentation improvements** (increment PATCH)

---

## Version Migration Guide

### Creating v2 from v1

#### Step 1: Duplicate v1 folder

```bash
# Copy entire v1 structure
cp -r docs/v1 docs/v2
```

#### Step 2: Update version references in v2

Update these files in `docs/v2/`:

1. **v2/CHANGELOG.md**
   ```markdown
   # Version 2.0.0 - YYYY-MM-DD

   ## Breaking Changes
   - List all breaking changes here

   ## Migration from v1
   - Migration guide for users
   ```

2. **v2/api/openapi/swagger.yaml**
   ```yaml
   info:
     title: Ping Parent Backend API
     version: 2.0.0  # Update version
     description: API documentation for Ping Parent application v2

   servers:
     - url: http://localhost:3000/api/v2  # Add version prefix
   ```

3. **v2/api/API_DOCUMENTATION.md**
   ```markdown
   **Version:** 2.0.0
   **Base URL (Local):** `http://localhost:3000/api/v2`
   ```

#### Step 3: Update root README.md

```markdown
## 📊 Version History

| Version | Status | Documentation |
|---------|--------|---------------|
| v2.0.0 | **Current** | [v2/](v2/) |
| v1.5.2 | Deprecated | [v1/](v1/) |
```

#### Step 4: Update path references

Update all internal links in v2 to point to v2 paths:
- `docs/v1/guides/AI_CONTEXT.md` → `docs/v2/guides/AI_CONTEXT.md`
- `docs/v1/api/API_DOCUMENTATION.md` → `docs/v2/api/API_DOCUMENTATION.md`

---

## Best Practices

### 1. Version Consistency

✅ **Do:**
- Keep version numbers consistent across package.json, docs, and API
- Update all three when releasing

❌ **Don't:**
- Have mismatched versions between code and docs
- Skip version numbers

### 2. Backward Compatibility

✅ **Do:**
- Maintain v1 docs when v2 is released
- Support both versions during transition period
- Provide migration guides

❌ **Don't:**
- Delete old version documentation immediately
- Force users to upgrade without warning

### 3. CHANGELOG Maintenance

✅ **Do:**
- Update CHANGELOG.md for every release
- Group changes by category (Breaking, New, Fixed)
- Include migration instructions

❌ **Don't:**
- Skip changelog updates
- Write vague change descriptions

### 4. File References

✅ **Do:**
- Use relative paths within version folders
- Update ALL references when creating new version
- Test all links after version creation

❌ **Don't:**
- Use absolute paths
- Leave broken links

### 5. Deprecation Strategy

When deprecating v1:

1. **Announce deprecation** (3-6 months in advance)
2. **Update v1/README.md** with deprecation notice
3. **Provide migration guide** in v2/CHANGELOG.md
4. **Set end-of-life date** for v1 support
5. **Archive v1** (don't delete, mark as archived)

---

## Examples

### Example 1: Adding New Feature (MINOR)

**Scenario:** Adding rating/review module to existing v1 API

**Version change:** `v1.0.0` → `v1.1.0`

**Actions:**
```bash
# Update package.json
"version": "1.1.0"

# Update docs/v1/CHANGELOG.md
## [1.1.0] - 2025-12-30
### Added
- Rating and review system for drivers
- 4 new endpoints: POST/GET/PUT/DELETE /ratings

# Update docs/v1/api/API_DOCUMENTATION.md
- Add new section for Rating APIs

# Update docs/v1/api/openapi/swagger.yaml
- Add rating schemas and paths
```

### Example 2: Fixing Bug (PATCH)

**Scenario:** Fixed validation error in student creation

**Version change:** `v1.1.0` → `v1.1.1`

**Actions:**
```bash
# Update package.json
"version": "1.1.1"

# Update docs/v1/CHANGELOG.md
## [1.1.1] - 2025-12-31
### Fixed
- Student creation validation now correctly handles edge cases
- Updated API documentation for clarity

# Update docs/v1/api/API_DOCUMENTATION.md
- Clarify student validation rules
```

### Example 3: Breaking Change (MAJOR)

**Scenario:** Changed authentication from JWT to OAuth 2.0

**Version change:** `v1.5.2` → `v2.0.0`

**Actions:**
```bash
# Create v2 folder
cp -r docs/v1 docs/v2

# Update package.json
"version": "2.0.0"

# Create docs/v2/CHANGELOG.md
## [2.0.0] - 2026-01-01
### Breaking Changes
- Authentication changed from JWT to OAuth 2.0
- All endpoints now require OAuth tokens
- `/auth/login` endpoint replaced with `/oauth/authorize`

### Migration from v1
1. Update your authentication flow to OAuth 2.0
2. Replace JWT tokens with OAuth access tokens
3. Update Authorization header format
...

# Update docs/v2/api/openapi/swagger.yaml
- Change version to 2.0.0
- Update security schemes
- Update all endpoint paths to /api/v2/*

# Update docs/README.md
- Mark v1 as "Deprecated"
- Mark v2 as "Current"
```

---

## Version Support Policy

### Active Support

- **Current major version** (e.g., v2.x.x): Full support, all updates
- **Previous major version** (e.g., v1.x.x): Security fixes only (6 months)

### End of Life

After support period:
- Documentation remains available (archived)
- No new updates or fixes
- Clear deprecation notice at top of docs

---

## Version-Specific URL Patterns

### API Endpoints

```
v1: http://localhost:3000/api/auth/login
v2: http://localhost:3000/api/v2/auth/login
```

### Documentation URLs

```
v1: http://localhost:3000/api-docs/v1
v2: http://localhost:3000/api-docs/v2
```

### Swagger UI

```
v1: http://localhost:3000/api-docs
v2: http://localhost:3000/api-docs/v2
```

---

## Checklist: Creating New Major Version

- [ ] Copy `docs/vX/` to `docs/vY/`
- [ ] Update version in `package.json`
- [ ] Update version in all `vY/` files
- [ ] Create new `vY/CHANGELOG.md`
- [ ] Update API base URLs in documentation
- [ ] Update OpenAPI version in swagger.yaml
- [ ] Update all internal file references
- [ ] Update root `docs/README.md`
- [ ] Add deprecation notice to old version
- [ ] Write migration guide
- [ ] Test all documentation links
- [ ] Update Postman collections
- [ ] Announce version release

---

## FAQ

### Q: When should I increment the version?

**A:** Follow SemVer strictly:
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Q: Do I need a new folder for MINOR versions?

**A:** No. Only create new folders (v2, v3) for MAJOR versions. MINOR and PATCH updates modify existing version folders.

### Q: How long should we support old versions?

**A:** Recommended: 6 months for previous major version, security fixes only.

### Q: Can we skip versions (e.g., v1 → v3)?

**A:** Technically yes, but not recommended. Follow sequential versioning for clarity.

### Q: What if we need to fix a bug in v1 after v2 is released?

**A:** Apply the fix to v1, increment PATCH (v1.5.2 → v1.5.3), and consider backporting to v2 if applicable.

---

## Related Documentation

- [README.md](README.md) - Main documentation hub
- [SUMMARY.md](SUMMARY.md) - Documentation overview
- [v1/CHANGELOG.md](v1/CHANGELOG.md) - Version 1 change history

---

**Current Documentation Version:** v1.0.0
**Last Updated:** 2025-12-30
**Maintained By:** Development Team

---

For questions about versioning strategy, contact the development team or create an issue with label `documentation`.
