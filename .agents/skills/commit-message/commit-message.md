# Commit Message Guidelines

This file defines standardized commit message formats for the Skolo project. AI agents should reference this guide to generate descriptive commit messages based on the type of work performed.

---

## General Guidelines

- **Format**: `{type} ({scope}) : {description}`
- **Scope**: Always required (feature name, module, or component)
- **Description**: Clear, concise, starts with lowercase (unless it's a proper noun)
- **Imperative mood**: Use "add", "fix", "update", not "added", "fixed", "updated"
- **Length**: Keep description under 72 characters when possible
- **No period at end**: Avoid terminating punctuation

---

## Commit Types

### 1. **feat** - New Feature

**When to use**: When adding new functionality, features, or capabilities to the system.

**Key Points to Include**:

- What new feature was added
- What problem it solves or capability it enables
- Any new dependencies or breaking changes (if applicable)
- High-level description of how it works

**Format**: `feat ({scope}) : {description}`

**Example**:

```
feat (auth-module) : add JWT token refresh mechanism for session management
```

---

### 2. **fix** - Bug Fix

**When to use**: When fixing a reported bug or issue in existing functionality.

**Key Points to Include**:

- What bug was fixed
- The root cause or what was wrong
- How the fix resolves the issue
- Any affected components or features

**Format**: `fix ({scope}) : {description}`

**Example**:

```
fix (database-connection) : resolve connection timeout issue on initial database sync
```

---

### 3. **bug** - Bug Report/Tracking

**When to use**: When creating a commit that tracks or documents a known bug without fixing it yet.

**Key Points to Include**:

- Bug description and symptoms
- When it occurs or what triggers it
- Suspected cause (if known)
- Impact on users or system

**Format**: `bug ({scope}) : {description}`

**Example**:

```
bug (api-endpoint) : document race condition in concurrent user requests
```

---

### 4. **hotfix** - Critical Production Fix

**When to use**: When applying urgent fixes to production issues that need immediate deployment.

**Key Points to Include**:

- Critical issue summary
- Severity and user impact
- Temporary vs. permanent solution (if applicable)
- Affected versions or environments

**Format**: `hotfix ({scope}) : {description}`

**Example**:

```
hotfix (payment-service) : emergency patch for failed transactions in production
```

---

### 5. **docs** - Documentation

**When to use**: When adding, updating, or improving documentation (README, guides, comments, API docs).

**Key Points to Include**:

- What documentation was added or updated
- Type of documentation (API docs, user guide, README, code comments)
- Important topics or sections covered
- Audience or use case

**Format**: `docs ({scope}) : {description}`

**Example**:

```
docs (setup-guide) : add installation and configuration instructions for new developers
```

---

### 6. **refactor** - Code Refactoring

**When to use**: When improving code structure, readability, or performance without changing functionality.

**Key Points to Include**:

- What was refactored (module, function, component)
- Why it was refactored (improve readability, performance, maintainability)
- Design pattern or approach used
- Any metrics or improvements (if applicable)

**Format**: `refactor ({scope}) : {description}`

**Example**:

```
refactor (data-processor) : extract database queries into separate service layer for reusability
```

---

### 7. **chore** - Maintenance & Configuration

**When to use**: For dependency updates, configuration changes, build system updates, or other maintenance tasks.

**Key Points to Include**:

- What dependency or configuration was updated
- Version numbers or specifics (if applicable)
- Reason for the update (security, performance, compatibility)
- Type of change (dependencies, build tools, CI/CD, environment config)

**Format**: `chore ({scope}) : {description}`

**Example**:

```
chore (dependencies) : upgrade Node.js runtime from v18 to v20 for security patches
```

---

## AI Agent Instructions

When generating commit messages:

1. **Identify the commit type** based on the work performed (feat, fix, bug, hotfix, docs, refactor, chore)
2. **Determine the scope** from the module, feature, or component affected
3. **Gather key points** specific to that commit type from the guidelines above
4. **Construct the message** following the format: `{type} ({scope}) : {description}`
5. **Verify clarity** - Can someone understand what was done without seeing the code?

---

## Example Workflow

**Scenario**: You add a new caching layer to the API module

→ **Type**: `feat` (new feature)  
→ **Scope**: `api-caching`  
→ **Key Points**: What feature was added, what problem it solves, high-level approach  
→ **Result**: `feat (api-caching) : implement redis caching layer for improved API response times`
