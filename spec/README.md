# Spec

Reference documentation and database schema for this project.

---

## Structure

```
spec/
├── database/
│   ├── skolo.dbml          — Full database schema (DBML format)
│   └── skolo.dbdiagram     — Visual diagram source
├── docs/
│   ├── Architecture.md             — Folder structure, layers, patterns
│   ├── razorpay-setup.md           — Razorpay account, webhook, endpoints, test creds
│   ├── fcm-push-notifications.md   — FCM setup, Flutter integration, notification types
│   ├── google-maps-setup.md        — Google Maps API key setup and Directions API
│   └── socket-join-order-fix.md    — Position cache fix for parent/driver join-order race
└── features/                       — Per-feature flow & logic docs (mirrors src/modules/)
    ├── auth.md
    ├── billing/
    ├── trips/
    ├── users/
    └── admin/
```

**Feature doc rule**: standalone module → `features/<module>.md` · module with submodules → `features/<module>/<submodule>.md`

---

## Quick Reference

| Topic | File |
|-------|------|
| Architecture & patterns | [docs/Architecture.md](docs/Architecture.md) |
| Database schema | [database/skolo.dbml](database/skolo.dbml) |
| Razorpay payments | [docs/razorpay-setup.md](docs/razorpay-setup.md) |
| Push notifications (FCM) | [docs/fcm-push-notifications.md](docs/fcm-push-notifications.md) |
| Google Maps / Directions | [docs/google-maps-setup.md](docs/google-maps-setup.md) |
| Socket tracking fix | [docs/socket-join-order-fix.md](docs/socket-join-order-fix.md) |
| **Feature flows** | |
| Auth | [features/auth.md](features/auth.md) |
