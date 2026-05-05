# Skolo Backend

Backend service built with **Node.js**, **TypeScript**, **Express**, **MongoDB**, and **Redis**.

---

## Quick Start

```bash
npm install
cp environment/.env.example environment/.env
npm run dev
```

## Scripts

```bash
npm run dev        # Development server
npm run build      # Build for production
npm start          # Run production build
npm run lint       # Lint
npm test           # Tests
```

---

## Tech Stack

Node.js · TypeScript · Express · MongoDB · Redis · JWT

**Features**: OTP auth · Role-based access (Parent, Driver, Admin) · Real-time trip tracking

---

## Spec & Docs

All reference documentation lives in [`spec/`](./spec/):

| Topic                    | File                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------ |
| Architecture & patterns  | [spec/docs/Architecture.md](spec/docs/Architecture.md)                               |
| Database schema          | [spec/database/skolo.dbml](spec/database/skolo.dbml)                                 |
| Razorpay payments        | [spec/docs/razorpay-setup.md](spec/docs/razorpay-setup.md)                           |
| Push notifications (FCM) | [spec/docs/fcm-push-notifications.md](spec/docs/fcm-push-notifications.md)           |
| Google Maps / Directions | [spec/docs/maps/google-maps-cost-usage.md](spec/docs/maps/google-maps-cost-usage.md) |
| Socket tracking fix      | [spec/docs/socket-join-order-fix.md](spec/docs/socket-join-order-fix.md)             |
