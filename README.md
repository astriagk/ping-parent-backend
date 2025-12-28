# Ping Parent – Backend

Backend service for the **Ping Parent** application built with **Node.js**, **TypeScript**, **Express**, **MongoDB**, and **Redis**.

---

## 🚀 Quick Start

### For New Users

1. **Start Here** → [Installation & Setup](#-getting-started)
2. **Understand Architecture** → [docs/FOLDER_STRUCTURE.md](./docs/FOLDER_STRUCTURE.md)
3. **For Developers** → [docs/AI_CONTEXT.md](./docs/AI_CONTEXT.md) - Complete implementation guide
4. **Detailed Docs** → [docs/](./docs/) folder for in-depth references

### Run the Application

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp environment/.env.example environment/.env
# Edit environment/.env with your configuration

# 3. Start development server
npm run dev

# 4. Build for production
npm run build
npm start
```

---

## 📌 Project Overview

**Ping Parent** - Platform for parents to stay connected with drivers for safe student transportation.

**Tech Stack**: Node.js | TypeScript | Express | MongoDB | Redis | JWT

**Key Features**:
- Phone-based authentication with OTP
- Role-based access (Parent, Driver, Admin)
- Real-time trip tracking
- Repository pattern architecture

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16+
- MongoDB (running)
- Redis (running)

### Installation

```bash
# 1. Clone and install
git clone <repository-url>
cd pp-backend
npm install

# 2. Setup environment
cp environment/.env.example environment/.env
# Edit environment/.env with your database and API keys

# 3. Start development
npm run dev
```

### Available Scripts

```bash
npm run dev      # Development server
npm run build    # Build for production
npm start        # Run production build
npm run lint     # Check code quality
npm test         # Run tests
```

📚 **See [docs/](./docs/) for detailed setup, environment variables, and deployment guides**

---

## 🤖 For Developers & AI Agents

### 📖 Implementation Guide

**[docs/AI_CONTEXT.md](./docs/AI_CONTEXT.md)** - Complete guide with patterns, examples, and coding standards

### Key Rules

1. **Field names** → `snake_case` (match database schema)
2. **Architecture** → Routes → Controllers → Services → Repositories
3. **File placement** → One entity per file in layer folders
4. **Constants** → Never hardcode strings
5. **Repository** → Extend `BaseRepository<T>`

📚 **See [docs/AI_CONTEXT.md](./docs/AI_CONTEXT.md) for detailed patterns and [docs/](./docs/) for references**

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [docs/AI_CONTEXT.md](./docs/AI_CONTEXT.md) | Implementation patterns and coding standards |
| [Database Schema](./Database/ping_parent_dbdiagram.dbml) | Complete database design (DBML) |
| [docs/SUMMARY.md](./docs/SUMMARY.md) | Documentation overview and guide |
| [docs/](./docs/) | Additional references and guides |

---

## 🤝 Contributing

1. Read [docs/AI_CONTEXT.md](./docs/AI_CONTEXT.md) for coding standards
2. Follow the layered architecture pattern
3. See [docs/](./docs/) for contribution guidelines

---

## 📄 License

[Add your license here]
