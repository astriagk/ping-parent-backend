# AI Prompts for Code Generation

This document contains reusable AI prompts for generating consistent module structures in the Ping Parent Backend project.

---

## Module Generator Prompt

Use this prompt to generate a complete module with all necessary files (controller, repository, routes, service, type, validation, and index).

### Prompt Template

````
Create a new module in the src/modules/{ROOT_MODULE} directory with the following structure:

**Root Module:** {ROOT_MODULE}
**Sub-Module:** {SUB_MODULE}

Create the folder structure:
src/modules/{ROOT_MODULE}/{SUB_MODULE}/

Inside this folder, create the following empty files with basic exports:

1. **{SUB_MODULE}.controller.ts**
   - Empty file with comment: // Controller functions for {SUB_MODULE}

2. **{SUB_MODULE}.repository.ts**
   - Empty file with comment: // Repository class for {SUB_MODULE}

3. **{SUB_MODULE}.routes.ts**
   - Import Router from express
   - Create empty router
   - Export router as default
   ```typescript
   import { Router } from "express";

   const router = Router();

   // Define routes here

   export default router;
````

4. **{SUB_MODULE}.service.ts**
   - Empty file with comment: // Service functions for {SUB_MODULE}

5. **{SUB_MODULE}.type.ts**
   - Empty file with comment: // Type definitions for {SUB_MODULE}

6. **{SUB_MODULE}.validation.ts**
   - Empty file with comment: // Validation schemas for {SUB_MODULE}

7. **index.ts**
   - Export statements for all module files:
   ```typescript
   export * from "./{SUB_MODULE}.controller";
   export * from "./{SUB_MODULE}.routes";
   export * from "./{SUB_MODULE}.service";
   export * from "./{SUB_MODULE}.type";
   export * from "./{SUB_MODULE}.validation";
   export { default as {subModule}Routes } from "./{SUB_MODULE}.routes";
   ```

**Additional Requirements:**

- Use snake_case for file and folder names
- Keep all files empty except for basic structure shown above
- No imports, no functions, no implementations - just skeleton files

```

---

## Usage Examples

### Example 1: Create a Payment Module

```

Create a new module in the src/modules/billing directory with the following structure:

**Root Module:** billing
**Sub-Module:** payment

```

### Example 2: Create a Vehicle Module

```

Create a new module in the src/modules/transport directory with the following structure:

**Root Module:** transport
**Sub-Module:** vehicle

```

---

## Quick Reference

Replace these placeholders when using the prompt:
- `{ROOT_MODULE}` - Parent folder name (e.g., admin, billing, users)
- `{SUB_MODULE}` - Sub-folder name in snake_case (e.g., admin_management, payment, subscription_plan)
- `{SubModule}` - Sub-folder name in PascalCase (e.g., AdminManagement, Payment, SubscriptionPlan)
- `{SUB_MODULE_UPPER}` - Sub-folder name in UPPER_SNAKE_CASE (e.g., ADMIN_MANAGEMENT, PAYMENT)

---

## Post-Generation Checklist

After generating a new module, remember to:

1. ✅ Update `src/modules/{ROOT_MODULE}/index.ts` to export the new module
2. ✅subModule}` - Sub-folder name in camelCase for exports (e.g., adminManagement, payment, subscriptionPlan
4. ✅ Add any custom error messages to `src/shared/constants/messages.ts`
5. ✅ Add any custom validation messages to `src/shared/constants/validationMessages.ts`
6. ✅ Test all endpoints
7. ✅ Run documentation generator: `npm run docs:generate`

---

## Additional Notes

- AlwRegister routes in `src/routes/index.ts`
3. ✅ Implement the actual functions in controller, service, repository files
4. ✅ Define types/interfaces in type file
5. ✅ Add validation schemas in validation file
6. ✅ Run documentation generator: `npm run docs:generate`
```
