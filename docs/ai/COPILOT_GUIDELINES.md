# GitHub Copilot Guidelines

This document provides guidelines for GitHub Copilot when making changes to the Ping Parent Backend codebase.

## General Principles

### 1. **Documentation Requirements**

- **DO NOT** create documentation files or summary documents for changes made unless explicitly requested by the user.
- If a user requests documentation, create it only after they specifically ask for it.
- Focus on implementing the changes in code without generating supplementary documentation.

### 2. **Code Changes**

- Implement changes directly in the codebase rather than suggesting them.
- Use efficient tools to make multiple edits simultaneously when possible.
- Ensure all changes are syntactically correct and follow the project's coding standards.
- Remove unused imports and clean up code after modifications.

### 3. **Database Schema**

- When removing tables or collections, update:
  - Database schema files (DBML, SQL migrations)
  - Any service/repository functions that reference those tables
  - Import statements in files that use database constants

### 4. **Testing Changes**

- Always check for compilation errors after making changes.
- Verify that no broken imports or references remain.
- Use `get_errors` tool to validate TypeScript compilation.

### 5. **Environment Variables**

- Be aware of environment variable naming conventions used in the project.
- For this project: `NODE_ENV` uses values `"dev"`, `"production"`, or `"test"` (not `"development"`).
- When checking environment variables, use the correct values.

### 6. **Communication**

- Provide brief confirmations after completing tasks.
- Do not explain what tools were used - speak naturally about what was accomplished.
- Omit unnecessary introductions or conclusions; be direct and concise.

## Project-Specific Notes

### OTP Handling

- The project uses **Twilio Verify Service** for OTP management.
- Development bypass: Accept `"111111"` as OTP when `NODE_ENV === "dev"`.
- Do NOT create local OTP storage tables unless there's a specific use case.

### Naming Conventions

- Collections: `COLLECTION_NAME` pattern
- Services: `module.service.ts`
- Controllers: `module.controller.ts`
- Routes: `module.routes.ts`
- Types: `module.type.ts`
- Validations: `module.validation.ts`
- Repository: `module.repository.ts`

### Import Aliases

- `@shared` - Shared utilities, constants, middlewares, services
- `@modules` - Feature modules
- Use absolute imports rather than relative paths

## When to Reach Out

- If a change impacts multiple interconnected systems, confirm the scope with the user.
- If there are conflicting design decisions, clarify the preferred approach.
- If documentation is needed, ask the user before creating it.

---

**Last Updated:** February 1, 2026
