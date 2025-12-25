# Code Formatting & Linting Guide

This project uses **Prettier** for code formatting and **ESLint** for linting with automatic pre-commit hooks.

## 📋 Table of Contents

- [Available Commands](#available-commands)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Configuration Files](#configuration-files)
- [IDE Setup](#ide-setup)

## 🚀 Available Commands

### Formatting

```bash
# Format all TypeScript files in src/
npm run format

# Check formatting without making changes
npm run format:check
```

### Linting

```bash
# Lint all TypeScript files
npm run lint

# Lint and auto-fix issues
npm run lint:fix
```

## 🔐 Pre-commit Hooks

This project uses **Husky** and **lint-staged** to automatically format and lint staged files before each commit.

### What happens on `git commit`:

1. **ESLint** runs on staged `.ts` and `.tsx` files and auto-fixes issues
2. **Prettier** formats staged files
3. If there are unfixable errors, the commit is blocked

### Configuration

Pre-commit hooks are configured in `package.json`:

```json
"lint-staged": {
  "src/**/*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "src/**/*.{json,md}": [
    "prettier --write"
  ]
}
```

## ⚙️ Configuration Files

### Prettier (`.prettierrc.js`)

```javascript
module.exports = {
  semi: true,                    // Add semicolons
  trailingComma: "all",         // Trailing commas everywhere
  singleQuote: false,           // Use double quotes
  printWidth: 80,               // Line width
  tabWidth: 2,                  // 2 spaces per tab
  useTabs: false,               // Use spaces, not tabs
  arrowParens: "always",        // Always add parens in arrow functions
  endOfLine: "lf",              // Unix line endings
  bracketSpacing: true,         // Spaces in object literals
};
```

### ESLint (`eslint.config.mjs`)

Uses TypeScript ESLint parser with:
- Prettier integration
- Import order enforcement
- TypeScript-specific rules
- Auto-fix on save

### TypeScript (`tsconfig.json`)

Configured with:
- Path aliases (`@services/*`, `@controllers/*`, etc.)
- Strict mode enabled
- Source files in `src/`
- Output to `dist/`

## 🛠️ IDE Setup

### VS Code

1. Install extensions:
   - **ESLint** (`dbaeumer.vscode-eslint`)
   - **Prettier** (`esbenp.prettier-vscode`)

2. Add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### WebStorm / IntelliJ IDEA

1. Go to **Settings** → **Languages & Frameworks** → **JavaScript** → **Prettier**
2. Check **On code reformat** and **On save**
3. Set **Run for files**: `{**/*,*}.{ts,tsx,js,jsx,json,md}`

## 📁 Ignored Files

### `.prettierignore`

- `node_modules/`
- `dist/`
- `build/`
- `coverage/`
- `*.log`
- `.env` files
- Lock files

### `.eslintignore`

- `node_modules/`
- `dist/`
- `build/`
- `coverage/`
- Config files (`*.config.js`, `*.config.ts`)

## 🔧 Manual Setup (if hooks don't work)

If pre-commit hooks aren't working:

```bash
# Reinstall Husky
npm run prepare

# Or manually run on all files
npm run lint:fix && npm run format
```

## 📝 Best Practices

1. **Before committing**: Run `npm run lint:fix` to catch issues
2. **Use path aliases**: Import using `@services/*`, `@controllers/*`, etc.
3. **Keep functions small**: ESLint will warn on complexity
4. **Remove unused imports**: Auto-fixed on commit
5. **Consistent naming**: Use camelCase for variables, PascalCase for types

## 🚨 Common Issues

### "ESLint couldn't find config file"
- Make sure `eslint.config.mjs` exists in project root
- Run `npm install` to ensure all dependencies are installed

### "Prettier not formatting"
- Check `.prettierrc.js` exists
- Verify file is not in `.prettierignore`
- Try running `npm run format` manually

### "Pre-commit hook not running"
- Run `npm run prepare` to reinstall Husky
- Check `.husky/pre-commit` file exists and is executable

## 📊 Statistics

Run these commands to check code quality:

```bash
# Count lines of code
npm run count

# Check formatting without changes
npm run format:check

# Run all linting rules
npm run lint
```

---

**Happy coding!** 🎉
