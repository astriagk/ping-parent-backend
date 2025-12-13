# Ping Parent – Backend

Backend service for the **Ping Parent** application built with **Node.js** and **TypeScript**.

This service handles APIs, database communication, and core backend logic.

---

## 📌 Project Overview

**Ping Parent** is a platform designed to help parents stay connected and informed.

This backend provides:

- REST APIs (GET / POST initially)
- MongoDB data storage (without ORM/ODM)
- Scalable TypeScript-based architecture

---

## 🛠 Tech Stack

- **Node.js**
- **TypeScript**
- **Express.js**
- **MongoDB (Native Driver)**
- **ts-node / nodemon**

> ❌ No Mongoose  
> ✅ Direct MongoDB driver usage

---

## 📂 Project Structure (Initial)

ping-parent-backend/
│
├── src/
│ ├── routes/
│ ├── controllers/
│ ├── services/
│ ├── db/
│ │ └── mongo.ts
│ ├── types/
│ ├── utils/
│ └── app.ts
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
└── server.ts
