# Ping Parent – Backend

Backend service for the **Ping Parent** application built with **Node.js**, **TypeScript**, **Express**, **MongoDB**, and **Redis**.

This service handles APIs, database communication, authentication, and core backend logic.

---

## 📌 Project Overview

**Ping Parent** is a platform designed to help parents stay connected with drivers for safe student transportation.

This backend provides:

- RESTful APIs for authentication, parent, and driver management
- MongoDB data storage using native MongoDB driver (no ORM/ODM)
- Redis for caching and session management
- JWT-based authentication
- Email services for notifications
- Scalable TypeScript-based architecture with repository pattern

---

## 🛠 Tech Stack

- **Node.js** - Runtime environment
- **TypeScript** - Type-safe development
- **Express.js** - Web framework
- **MongoDB (Native Driver)** - Database (no Mongoose)
- **Redis** - Caching and session storage
- **JWT** - Authentication tokens
- **Joi** - Request validation
- **Nodemailer** - Email services
- **Bcrypt** - Password hashing

---

## 📂 Project Structure

This project follows a **layered architecture** pattern with clear separation of concerns:

```
pp-backend/
├── src/
│   ├── config/                    # Configuration files
│   │   ├── index.ts              # Central export
│   │   ├── database.ts           # MongoDB connection
│   │   ├── redis.ts              # Redis connection
│   │   ├── env.ts                # Environment variables
│   │   └── collections.ts        # MongoDB collection names
│   │
│   ├── constants/                # Application constants
│   │   ├── index.ts              # Central export
│   │   ├── httpStatus.ts         # HTTP status codes
│   │   ├── messages.ts           # Error/success messages
│   │   ├── enums.ts              # TypeScript enums
│   │   └── collections.ts        # Collection name constants
│   │
│   ├── controllers/              # Request handlers
│   │   ├── auth.controller.ts    # Authentication endpoints
│   │   ├── parent.controller.ts  # Parent endpoints
│   │   ├── driver.controller.ts  # Driver endpoints
│   │   └── index.ts              # Central export
│   │
│   ├── environment/                  # Environment files
│   │   ├── .env                      # Environment variables
│   │   └──.env.example              # Example env file
│   │
│   ├── middlewares/              # Express middlewares
│   │   ├── auth.middleware.ts    # JWT authentication
│   │   ├── error.middleware.ts   # Error handling
│   │   ├── validate.middleware.ts # Request validation
│   │   ├── rateLimit.middleware.ts # Rate limiting
│   │   └── asyncHandler.middleware.ts # Async error wrapper
│   │
│   ├── repositories/             # Data access layer
│   │   ├── base.repository.ts    # Generic CRUD operations
│   │   ├── user.repository.ts    # User-specific queries
│   │   └── index.ts              # Central export
│   │
│   ├── routes/                   # API routes
│   │   ├── auth.routes.ts        # Auth routes
│   │   ├── parent.routes.ts      # Parent routes
│   │   ├── driver.routes.ts      # Driver routes
│   │   └── index.ts              # Route aggregator
│   │
│   ├── services/                 # Business logic layer
│   │   ├── auth.service.ts       # Authentication logic
│   │   ├── user.service.ts       # User management
│   │   ├── parent.service.ts     # Parent logic
│   │   ├── driver.service.ts     # Driver logic
│   │   ├── token.service.ts      # JWT operations
│   │   ├── redis.service.ts      # Redis operations
│   │   ├── email.service.ts      # Email sending
│   │   ├── passwordReset.service.ts # Password reset
│   │   ├── address.service.ts    # Address management
│   │   ├── role.service.ts       # Role management
│   │   └── index.ts              # Central export
│   │
│   ├── types/                    # TypeScript types/interfaces
│   │   ├── index.ts              # Central export
│   │   ├── user.type.ts          # User types
│   │   ├── auth.types.ts         # Auth types
│   │   ├── parent.type.ts        # Parent types
│   │   ├── driver.type.ts        # Driver types
│   │   ├── school.type.ts        # School types
│   │   ├── trip.type.ts          # Trip types
│   │   ├── notification.type.ts  # Notification types
│   │   ├── subscription.type.ts  # Subscription types
│   │   ├── review.type.ts        # Review types
│   │   ├── admin.type.ts         # Admin types
│   │   ├── express.d.ts          # Express type extensions
│   │   └── environment.d.ts      # Environment variable types
│   │
│   ├── utils/                    # Utility functions
│   │   ├── logger.ts             # Logging utility
│   │   ├── apiResponse.ts        # Standardized responses
│   │   ├── apiError.ts           # Custom error class
│   │   ├── helpers.ts            # Helper functions
│   │   ├── jwt.ts                # JWT utilities
│   │   ├── email.ts              # Email utilities
│   │   ├── nodemailer.ts         # Nodemailer setup
│   │   ├── validation.ts         # Validation helpers
│   │   ├── assignTrimmedFields.ts # Field assignment
│   │   └── index.ts              # Central export
│   │
│   ├── validations/              # Request validation schemas
│   │   ├── auth.validation.ts    # Auth validation (Joi)
│   │   ├── user.validation.ts    # User validation (Joi)
│   │   └── index.ts              # Central export
│   │
│   ├── app.ts                    # Express app setup
│   └── server.ts                 # Server entry point
│
├── docs/                         # Documentation
│   └── FOLDER_STRUCTURE.md       # Folder structure reference
│
├── .gitignore
├── .prettierignore
├── .prettierrc.json
├── eslint.config.js
├── jest.config.cjs
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🏗 Architecture Patterns

### 1. **Layered Architecture**

```
Request → Routes → Middlewares → Controllers → Services → Repositories → Database
```

- **Routes**: Define API endpoints
- **Middlewares**: Handle authentication, validation, error handling
- **Controllers**: Process HTTP requests/responses
- **Services**: Contain business logic
- **Repositories**: Abstract database operations
- **Config**: Centralized configuration management

### 2. **Repository Pattern**

All database operations go through repository classes:

- `BaseRepository<T>`: Generic CRUD operations
- Specific repositories extend base (e.g., `UserRepository`)
- Keeps business logic separate from data access

### 3. **Service Layer**

Business logic is isolated in service classes:

- `authService`: Login, register, token management
- `userService`: User CRUD operations
- `emailService`: Email notifications
- `redisService`: Caching operations

### 4. **Centralized Exports**

Each folder has an `index.ts` that exports all modules:

```typescript
// Import from anywhere easily
import { ERROR_MESSAGES, HTTP_STATUS } from "@/constants";
import { userRepository } from "@/repositories";
import { ApiResponse, logger } from "@/utils";
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (running instance)
- Redis (running instance)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd pp-backend
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

```bash
cp environment/.env.example environment/.env
# Edit environment/.env with your configuration
```

4. Start the development server

```bash
npm run dev
```

---

## 🔐 Environment Variables

Required variables in `environment/.env`:

```env
NODE_ENV=development
PORT=3000

# Database
MONGO_URI=mongodb://localhost:27017
DB_NAME=ping_parent

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@pingparent.com

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## 📋 Available Scripts

```bash
npm run dev          # Start development server with nodemon
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm test             # Run tests with Jest
```

---

## 🔑 Key Features

### Authentication

- JWT-based authentication
- Role-based access control (Admin, Parent, Driver)
- Phone number verification with OTP
- Email verification
- Password reset functionality
- Refresh token support

### Security

- Rate limiting on login endpoints
- Password hashing with bcrypt
- Input validation with Joi
- MongoDB injection prevention
- CORS enabled

### Data Management

- MongoDB native driver (no ORM)
- Repository pattern for database operations
- Redis for session/OTP storage
- Transaction support where needed

### Error Handling

- Centralized error middleware
- Custom ApiError class
- Standardized error responses
- Development vs production error details

---

## 🌐 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP

### Parent

- `GET /api/parent/profile` - Get parent profile
- `PUT /api/parent/profile` - Update parent profile
- `GET /api/parent/address` - Get parent address
- `PUT /api/parent/address` - Update parent address

### Driver

- `GET /api/driver/profile` - Get driver profile
- `PUT /api/driver/profile` - Update driver profile
- `POST /api/driver/profile` - Create driver profile
- `GET /api/driver/address` - Get driver address
- `PUT /api/driver/address` - Update driver address
- `GET /api/driver/documents` - Get driver documents
- `PUT /api/driver/documents` - Update driver documents

---

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

---

## 📝 Code Style

- **ESLint**: Linting and code quality
- **Prettier**: Code formatting
- **TypeScript**: Type safety

Configuration files:

- `eslint.config.js` - ESLint rules
- `.prettierrc.json` - Prettier settings
- `tsconfig.json` - TypeScript compiler options

---

## 🗂 Database Collections

- `users` - User accounts (parent/driver/admin)
- `parents` - Parent profiles
- `parent_addresses` - Parent addresses
- `drivers` - Driver profiles
- `driver_addresses` - Driver addresses
- `driver_documents` - Driver documents
- `students` - Student information
- `trips` - Trip records
- `pings` - Location pings
- `notifications` - User notifications
- `otp_verification` - OTP codes
- `password_resets` - Password reset tokens
- `roles` - User roles

---

## 📚 Important Notes for AI Agents

### When Working on This Project:

1. **Follow the Layered Architecture**
   - Always use: Routes → Controllers → Services → Repositories
   - Never call repositories directly from controllers
   - Keep business logic in services, not controllers

2. **Use Existing Utilities**
   - `ApiResponse` for standardized responses
   - `ApiError` for throwing errors
   - `logger` for logging
   - `asyncHandler` for async route handlers

3. **Import Patterns**

   ```typescript
   // Always import from index files
   import { ERROR_MESSAGES, HTTP_STATUS } from "@/constants";
   import { validate } from "@/middlewares";
   import { userService } from "@/services";
   ```

4. **File Naming Conventions**
   - Controllers: `*.controller.ts`
   - Services: `*.service.ts`
   - Routes: `*.routes.ts`
   - Middlewares: `*.middleware.ts`
   - Types: `*.type.ts` or `*.types.ts`
   - Validations: `*.validation.ts`

5. **No Mongoose/ODM**
   - Use native MongoDB driver only
   - All database operations through repositories
   - Use `BaseRepository<T>` for common CRUD operations

6. **TypeScript**
   - Always use proper types (no `any`)
   - Define interfaces in `types/` folder
   - Use type imports from `@/types`

7. **Error Handling**
   - Use `ApiError` class for throwing errors
   - Wrap async routes with `asyncHandler`
   - Let error middleware handle all errors

8. **Validation**
   - Use Joi schemas in `validations/` folder
   - Apply with `validate(schema)` middleware
   - Keep validation logic in validation files

9. **Environment Variables**
   - Access via `ENV` object from `@/config/env`
   - Never use `process.env` directly in code
   - All env vars typed in `environment.d.ts`

10. **Constants**
    - HTTP status codes: Use `HTTP_STATUS` from constants
    - Messages: Use `ERROR_MESSAGES` or `SUCCESS_MESSAGES`
    - Collection names: Use `COLLECTIONS` from constants
    - Enums: Use predefined enums from `constants/enums`

---

## 👥 User Roles

- **Admin**: Full system access
- **Parent**: Manage profile, students, trips
- **Driver**: Manage profile, vehicle, trips

---

## 📖 Additional Documentation

For detailed folder structure reference, see [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md)

---

## 🤝 Contributing

When contributing to this project:

1. Follow the existing architecture patterns
2. Write tests for new features
3. Update documentation
4. Follow code style guidelines
5. Use meaningful commit messages

---

## 📄 License

[Add your license here]

---

## 📧 Contact

For questions or support, contact the development team.
