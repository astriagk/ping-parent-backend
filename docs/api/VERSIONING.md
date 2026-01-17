# API Documentation Versioning Strategy

## Overview

The API documentation generator uses a **smart file versioning strategy** that balances convenience with version control.

## Versioning Rules

### 🔄 Patch & Minor Updates → **Update Existing Files**

For incremental changes that don't break compatibility:

- **Patch (1.0.0 → 1.0.1, 1.0.2, etc.)**
  - Bug fixes
  - Documentation improvements
  - Small changes

- **Minor (1.0.0 → 1.1.0, 1.2.0, etc.)**
  - New endpoints added
  - New features
  - Backwards-compatible changes

**File Strategy:**
- ✅ Overwrites existing files (`PP_API_1_0_0.*`)
- ✅ Updates version number inside file content
- ✅ Keeps file count manageable
- ✅ Easy to re-import in Postman (just re-import same file)

### 🆕 Major Updates → **Create New Files**

For breaking changes:

- **Major (1.0.0 → 2.0.0 → 3.0.0)**
  - Removed endpoints (breaking changes)
  - Changed request/response formats
  - API restructuring

**File Strategy:**
- ✅ Creates NEW files (`PP_API_2_0_0.*`, `PP_API_3_0_0.*`)
- ✅ Preserves old version files
- ✅ Allows testing both versions side-by-side
- ✅ Teams can migrate gradually

## Examples

### Scenario 1: Normal Development Flow

```bash
# Day 1: Initial API
npm run docs:generate
# Creates: PP_API_1_0_0.* with version 1.0.0

# Day 2: Fixed a bug in documentation
npm run docs:generate -- --bump=patch
# Updates: PP_API_1_0_0.* to version 1.0.1 (same file, new content)

# Day 3: Added new parent endpoints
npm run docs:generate -- --bump=minor
# Updates: PP_API_1_0_0.* to version 1.1.0 (same file, new content)

# Day 4: Added more trip endpoints
npm run docs:generate -- --bump=minor
# Updates: PP_API_1_0_0.* to version 1.2.0 (same file, new content)

# Result: Only ONE set of files (PP_API_1_0_0.*) at version 1.2.0
```

### Scenario 2: Major API Redesign

```bash
# Current: PP_API_1_0_0.* at version 1.2.0

# Major API restructure - removed old endpoints
npm run docs:generate -- --bump=major
# Creates: PP_API_2_0_0.* with version 2.0.0
# Preserves: PP_API_1_0_0.* at version 1.2.0

# Bug fix on v2 API
npm run docs:generate -- --bump=patch
# Updates: PP_API_2_0_0.* to version 2.0.1

# Add features to v2 API
npm run docs:generate -- --bump=minor
# Updates: PP_API_2_0_0.* to version 2.1.0

# Result: TWO sets of files
# - PP_API_1_0_0.* at version 1.2.0 (old API)
# - PP_API_2_0_0.* at version 2.1.0 (current API)
```

### Scenario 3: Multiple Major Versions

```bash
# Start: v1.0.0
npm run docs:generate -- --bump=major
# Files: PP_API_1_0_0.* (v1.0.0)

# Evolve v1
npm run docs:generate -- --bump=minor
npm run docs:generate -- --bump=minor
# Files: PP_API_1_0_0.* (v1.2.0)

# Break to v2
npm run docs:generate -- --bump=major
# Files: PP_API_1_0_0.* (v1.2.0) + PP_API_2_0_0.* (v2.0.0)

# Evolve v2
npm run docs:generate -- --bump=minor
npm run docs:generate -- --bump=patch
# Files: PP_API_1_0_0.* (v1.2.0) + PP_API_2_0_0.* (v2.0.1)

# Break to v3
npm run docs:generate -- --bump=major
# Files: PP_API_1_0_0.* (v1.2.0) + PP_API_2_0_0.* (v2.0.1) + PP_API_3_0_0.* (v3.0.0)
```

## File Structure

```
docs/api/
├── .version.json                            # Current version: 2.1.0
├── postman/
│   ├── collections/
│   │   ├── PP_API_1_0_0.postman_collection.json  # v1.2.0 (old API)
│   │   └── PP_API_2_0_0.postman_collection.json  # v2.1.0 (current)
│   └── environments/
│       ├── PP_API_1_0_0.postman_environment.json
│       └── PP_API_2_0_0.postman_environment.json
└── openapi/
    ├── PP_API_1_0_0.openapi.json
    └── PP_API_2_0_0.openapi.json
```

## Why This Strategy?

### ✅ Benefits

1. **Clean File Structure**
   - Only one file per major version
   - No clutter from every minor update

2. **Easy Updates**
   - Patch/minor: Just re-import same file in Postman
   - No need to manage dozens of files

3. **Major Version Safety**
   - Breaking changes create new files
   - Old version preserved for reference
   - Can test both APIs simultaneously

4. **Version Clarity**
   - File name = major version (`PP_API_2_0_0` = v2.x.x)
   - File content = exact version (v2.1.0, v2.1.1, etc.)

### 📊 Comparison

| Approach | Patch/Minor | Major | File Count |
|----------|-------------|-------|------------|
| **Old Way** (every version = new file) | New file | New file | 🔴 High (100+ files) |
| **New Way** (this strategy) | Update file | New file | 🟢 Low (3-5 files) |

## Version Tracking

The `.version.json` file tracks all versions:

```json
{
  "current": "2.1.0",
  "history": [
    {
      "version": "1.0.0",
      "timestamp": "2026-01-10T05:00:00.000Z",
      "files": { "postman": "PP_API_1_0_0.postman_collection.json" }
    },
    {
      "version": "1.1.0",
      "timestamp": "2026-01-10T06:00:00.000Z",
      "files": { "postman": "PP_API_1_0_0.postman_collection.json" }
    },
    {
      "version": "2.0.0",
      "timestamp": "2026-01-10T07:00:00.000Z",
      "files": { "postman": "PP_API_2_0_0.postman_collection.json" }
    },
    {
      "version": "2.1.0",
      "timestamp": "2026-01-10T08:00:00.000Z",
      "files": { "postman": "PP_API_2_0_0.postman_collection.json" }
    }
  ]
}
```

## Best Practices

### When to Use Each Bump Type

**Use Patch (--bump=patch):**
- Fixed typos in examples
- Improved request body examples
- Updated descriptions
- No API changes

**Use Minor (--bump=minor):**
- Added new endpoints
- New optional parameters
- New response fields
- Backwards-compatible additions

**Use Major (--bump=major):**
- Removed endpoints
- Changed required parameters
- Restructured responses
- Any breaking change

### Workflow Tips

1. **Daily Development**
   ```bash
   # Let auto-detection decide
   npm run docs:generate
   ```

2. **Before Release**
   ```bash
   # Be explicit about version
   npm run docs:generate -- --bump=minor
   ```

3. **API Redesign**
   ```bash
   # Create new major version
   npm run docs:generate -- --bump=major
   ```

4. **Postman Import**
   - **Patch/Minor**: Re-import same file (overwrites in Postman)
   - **Major**: Import as new collection (keeps both versions)

## FAQ

**Q: What if I want to keep every version?**
A: Use `--bump=major` for every change (not recommended - creates too many files)

**Q: Can I roll back to a previous version?**
A: Yes, check `.version.json` history for all versions and timestamps

**Q: What happens if I manually edit a file?**
A: Next patch/minor will overwrite it. Use major bump to preserve changes.

**Q: Can I have different versions for different environments?**
A: Yes! Import different major versions:
- `PP_API_1_0_0` → Development
- `PP_API_2_0_0` → Production

**Q: How do I know which file has which version?**
A:
- File name shows major version: `PP_API_2_0_0` = v2.x.x
- Open file to see exact version: v2.1.0, v2.1.1, etc.

---

**Last Updated:** 2026-01-10
**Strategy Version:** 2.0
