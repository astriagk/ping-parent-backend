# Ping Parent – Backend

Backend service for the **Ping Parent** application built with **Node.js**, **TypeScript**, **Express**, **MongoDB**, and **Redis**.

---

## 🚀 Quick Start

### For New Users

1. **Start Here** → [Installation & Setup](#-getting-started)
2. **Understand Architecture** → [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
3. **Generate Modules** → [docs/AI_PROMPTS.md](./docs/AI_PROMPTS.md) - Module generator templates
4. **API Documentation** → [docs/api/](./docs/api/) - OpenAPI & Postman collections

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
npm run docs:generate  # Generate API documentation
```

📚 **See [docs/](./docs/) for detailed setup and [docs/api/](./docs/api/) for API documentation**

---

## 🤖 For Developers & AI Agents

### 📖 Documentation Guides

**[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture and design patterns

**[docs/AI_PROMPTS.md](./docs/AI_PROMPTS.md)** - Module generator templates for quick scaffolding

**[docs/api/](./docs/api/)** - API documentation (OpenAPI, Postman, Testing data)

### Key Rules

1. **Field names** → `snake_case` (match database schema)
2. **Architecture** → Routes → Controllers → Services → Repositories

### 🔧 API Documentation

Generate API documentation automatically from your routes:

```bash
npm run docs:generate                    # Auto version bump
npm run docs:generate -- --bump=patch    # Patch version (bug fixes)
npm run docs:generate -- --bump=minor    # Minor version (new features)
npm run docs:generate -- --bump=major    # Major version (breaking changes)
```

Outputs:

- \*\*OpenARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture and design patterns |
  | [docs/AI_PROMPTS.md](./docs/AI_PROMPTS.md) | Module generator templates for scaffolding |
  | [docs/api/](./docs/api/) | API documentation (OpenAPI, Postman, Changelog) |
  | [docs/api/README.md](./docs/api/README.md) | API documentation overview |
  | [docs/api/TESTING_DATA.md](./docs/api/TESTING_DATA.md) | Sample test data for API testing |
  | [Database Schema](./Database/ping_parent_dbdiagram.dbml) | Complete database design (DBML)

📚 **See [docs/AI_PROMPTS.md](./docs/AI_PROMPTS.md) for module generation and [docs/api/](./docs/api/) for API doc 4. **Constants** → Never hardcode strings 5. **Repository\*\* → Extend `BaseRepository<T>`

📚 **See [docs/AI_CONTEXT.md](./docs/AI_CONTEXT.md) for detailed patterns and [docs/](./docs/) for references**

---

## 📚 Documentation

| Document                                                 | Purpose                                      |
| -------------------------------------------------------- | -------------------------------------------- |
| [docs/AI_CONTEXT.md](./docs/AI_CONTEXT.md)               | Implementation patterns and coding standards |
| [Database Schema](./Database/ping_parent_dbdiagram.dbml) | Complete database design (DBML)              |
| [docs/SUMMARY.md](./docs/SUMMARY.md)                     | Documentation overview and guide             |
| [docs/](./docs/)                                         | Additional references and guides             |

---

## 🤝 ContributRCHITECTURE.md](./docs/ARCHITECTURE.md) for system design

2. Use [docs/AI_PROMPTS.md](./docs/AI_PROMPTS.md) to generate new modules
3. Follow the layered architecture pattern
4. Run `npm run docs:generate` after adding new rout) for coding standards
5. Follow the layered architecture pattern
6. See [docs/](./docs/) for contribution guidelines

---

## 📄 License

[Add your license here]
