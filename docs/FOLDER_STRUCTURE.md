backend/
├── src/
│ ├── config/
│ │ ├── index.ts
│ │ ├── database.ts
│ │ ├── redis.ts
│ │ └── env.ts
│ │
│ ├── constants/
│ │ ├── index.ts
│ │ ├── httpStatus.ts
│ │ ├── messages.ts
│ │ ├── enums.ts
│ │ └── collections.ts
│ │
│ ├── controllers/
│ │ ├── auth.controller.ts
│ │ ├── user.controller.ts
│ │ └── index.ts
│ │
│ ├── middlewares/
│ │ ├── auth.middleware.ts
│ │ ├── error.middleware.ts
│ │ ├── validate.middleware.ts
│ │ ├── rateLimit.middleware.ts
│ │ └── asyncHandler.middleware.ts
│ │
│ ├── repositories/
│ │ ├── base.repository.ts
│ │ ├── user.repository.ts
│ │ └── index.ts
│ │
│ ├── routes/
│ │ ├── auth.routes.ts
│ │ ├── user.routes.ts
│ │ └── index.ts
│ │
│ ├── services/
│ │ ├── auth.service.ts
│ │ ├── user.service.ts
│ │ ├── token.service.ts
│ │ ├── redis.service.ts
│ │ └── email.service.ts
│ │
│ ├── types/
│ │ ├── index.ts
│ │ ├── user.types.ts
│ │ ├── auth.types.ts
│ │ ├── express.d.ts
│ │ └── environment.d.ts
│ │
│ ├── utils/
│ │ ├── logger.ts
│ │ ├── apiResponse.ts
│ │ ├── apiError.ts
│ │ ├── helpers.ts
│ │ └── jwt.ts
│ │
│ ├── validations/
│ │ ├── auth.validation.ts
│ │ ├── user.validation.ts
│ │ └── index.ts
│ │
│ ├── app.ts
│ └── server.ts
│
├── environment/
│ ├── .env
│ └── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc.json
├── eslint.config.js
├── jest.config.cjs
├── tsconfig.json
├── package.json
└── README.md
