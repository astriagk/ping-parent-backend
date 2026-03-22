---
name: commit-message
description: "Use when: generating standardized commit messages for git commits. Generates commit messages in format 'type (scope) : description' based on work performed (feat, fix, bug, hotfix, docs, refactor, chore) with relevant point-wise details and guidelines."
user-invocable: true
---

# Commit Message Generator Skill

## Purpose

Generate standardized, descriptive commit messages for git commits following conventional commit format and project guidelines.

## When to Use

Invoke this skill when you need to:

- Generate a commit message for changes you've made
- Understand what type of commit (feat, fix, bug, hotfix, docs, refactor, chore) applies to your work
- Ensure commit messages follow the project's conventions
- Create point-wise descriptions that clearly document what was changed and why

## How to Use This Skill

### Step 1: Describe Your Changes

Tell the AI what you've developed, fixed, or updated. Examples:

- "I added JWT token refresh to the auth module"
- "I fixed a connection timeout bug in the database layer"
- "I updated the setup documentation for new developers"
- "I refactored the data processor to use a service layer"
- "I upgraded Node.js to v20 for security"

### Step 2: AI References This Skill

The AI will automatically:

1. Read [commit-message.md](./commit-message.md) to understand project conventions
2. Identify the commit type (feat, fix, bug, hotfix, docs, refactor, chore)
3. Determine the scope based on the affected module/feature
4. Extract key points following the type-specific guidelines
5. Generate a formatted commit message

### Step 3: Receive Formatted Commit Message

You'll get a commit message like:

```
feat (auth-module) : add JWT token refresh mechanism for session management
```

Or for different types:

```
fix (database-connection) : resolve connection timeout issue on initial database sync
docs (setup-guide) : add installation and configuration instructions for new developers
refactor (data-processor) : extract database queries into separate service layer for reusability
```

## Asset Files

- **[commit-message.md](./commit-message.md)** — Complete guidelines for all 7 commit types with definitions, key points, and examples

## AI Agent Instructions

When a user asks for a commit message:

1. **Ask or infer the work type** — What did they build/fix/update?
2. **Open the asset** — Read `commit-message.md` to understand each commit type
3. **Identify the commit type** based on work description:
   - New functionality → `feat`
   - Bug fix → `fix`
   - Bug tracking → `bug`
   - Production emergency → `hotfix`
   - Documentation → `docs`
   - Code restructuring → `refactor`
   - Dependencies/config → `chore`
4. **Extract the scope** — Module, feature, or component name (always required)
5. **Gather key details** — Use the type-specific key points from `commit-message.md`
6. **Format the message** — Follow: `{type} ({scope}) : {description}`
7. **Verify** — Message should be clear, concise, and under 72 characters if possible

## Example Workflow

**User input:**

> "I just added a caching layer to the API using Redis to improve response times"

**AI processing:**

- Type: `feat` (new feature)
- Scope: `api-caching`
- Key points: What feature, what problem it solves, high-level approach
- Result: `feat (api-caching) : implement redis caching layer for improved API response times`

**Another example:**

**User input:**

> "Fixed the race condition where concurrent requests were causing database locks"

**AI processing:**

- Type: `fix` (bug fix)
- Scope: `database-concurrency`
- Key points: What bug, root cause, how it's fixed
- Result: `fix (database-concurrency) : prevent race condition in concurrent request handling`
