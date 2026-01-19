# API Documentation Changelog

> Auto-generated API endpoint version history

**Current Version:** 0.0.0
**Last Updated:** 2026-01-10

---

## Version 0.0.0 (PATCH)

**Released:** 2026-01-10

### Summary

| Metric | Previous (N/A) | Current (0.0.0) | Change |
|--------|----------|---------|--------|
| **Total Endpoints** | 0 | 134 | +134 |
| GET | 0 | 62 | +62 |
| POST | 0 | 27 | +27 |
| PUT | 0 | 23 | +23 |
| PATCH | 0 | 13 | +13 |
| DELETE | 0 | 9 | +9 |

### Changes

#### ✅ Added Endpoints (134)

| Method | Path |
|--------|------|
| `POST` | `/admin/login` |
| `POST` | `/admin/setup/create-superadmin` |
| `GET` | `/admin/verify-admin-token` |
| `GET` | `/admin/` |
| `GET` | `/admin/users` |
| `POST` | `/admin/` |
| `GET` | `/admin/:id` |
| `PUT` | `/admin/:id` |
| `PATCH` | `/admin/:id/activate` |
| `PATCH` | `/admin/:id/deactivate` |
| `GET` | `/admin/users/:id` |
| `PUT` | `/admin/users/:id` |
| `PATCH` | `/admin/users/:id/activate` |
| `PATCH` | `/admin/users/:id/deactivate` |
| `DELETE` | `/admin/users/:id` |
| `GET` | `/admin/by-admin-id/:admin_id` |
| `PUT` | `/admin/by-admin-id/:admin_id` |
| `PATCH` | `/admin/by-admin-id/:admin_id/activate` |
| `PATCH` | `/admin/by-admin-id/:admin_id/deactivate` |
| `GET` | `/admin/drivers/:id/details` |
| `GET` | `/admin/parents/:id/details` |
| `PATCH` | `/admin/drivers/:id/approval-status` |
| `GET` | `/audit-logs/` |
| `GET` | `/audit-logs/:id` |
| `GET` | `/roles/` |
| `POST` | `/roles/` |
| `GET` | `/roles/:id` |
| `PUT` | `/roles/:id` |
| `DELETE` | `/roles/:id` |
| `GET` | `/auth/roles` |
| `POST` | `/auth/register/send-otp` |
| `POST` | `/auth/register/verify-otp` |
| `POST` | `/auth/login/send-otp` |
| `POST` | `/auth/login/verify-otp` |
| `GET` | `/auth/verify-token` |
| `POST` | `/auth/logout` |
| `GET` | `/auth/admin/users` |
| `PATCH` | `/auth/admin/users/:id/activate` |
| `PATCH` | `/auth/admin/users/:id/deactivate` |
| `POST` | `/parent-subscriptions/` |
| `GET` | `/parent-subscriptions/my-subscriptions` |
| `GET` | `/parent-subscriptions/my-active-subscription` |
| `GET` | `/parent-subscriptions/:id` |
| `PUT` | `/parent-subscriptions/:id` |
| `POST` | `/parent-subscriptions/:id/cancel` |
| `DELETE` | `/parent-subscriptions/:id` |
| `GET` | `/parent-subscriptions/admin/all-subscriptions` |
| `POST` | `/payments/` |
| `POST` | `/payments/:id/complete` |
| `GET` | `/payments/my-payments` |
| `GET` | `/payments/my-payments/pending` |
| `GET` | `/payments/my-payments/completed` |
| `GET` | `/payments/:id` |
| `PUT` | `/payments/:id` |
| `POST` | `/payments/:id/refund` |
| `GET` | `/payments/admin/all-payments` |
| `GET` | `/subscription-plans/` |
| `GET` | `/subscription-plans/:id` |
| `PUT` | `/subscription-plans/:id` |
| `PATCH` | `/subscription-plans/:id/activate` |
| `PATCH` | `/subscription-plans/:id/deactivate` |
| `GET` | `/notifications/` |
| `GET` | `/notifications/unread` |
| `GET` | `/notifications/unread-count` |
| `PUT` | `/notifications/:id/mark-as-read` |
| `PUT` | `/notifications/mark-all-as-read` |
| `POST` | `/` |
| `GET` | `/my-reviews` |
| `GET` | `/driver/:driverId` |
| `GET` | `/driver/:driverId/rating` |
| `GET` | `/:id` |
| `PUT` | `/:id` |
| `DELETE` | `/:id` |
| `GET` | `/schools/` |
| `GET` | `/schools/:school_id` |
| `POST` | `/schools/admin` |
| `PUT` | `/schools/admin/:school_id` |
| `DELETE` | `/schools/admin/:school_id` |
| `POST` | `/daily-qr-otp/generate` |
| `GET` | `/daily-qr-otp/student/:studentId/trip/:tripId` |
| `POST` | `/daily-qr-otp/verify` |
| `POST` | `/driver-student-assignments/` |
| `GET` | `/driver-student-assignments/:id` |
| `GET` | `/driver-student-assignments/driver/my-assignments` |
| `GET` | `/driver-student-assignments/driver/my-pending-assignments` |
| `POST` | `/driver-student-assignments/:id/approve` |
| `POST` | `/driver-student-assignments/:id/reject` |
| `GET` | `/driver-student-assignments/driver/my-active-assignments` |
| `POST` | `/driver-student-assignments/:id/deactivate` |
| `GET` | `/driver-student-assignments/student/:studentId` |
| `PUT` | `/driver-student-assignments/:id` |
| `DELETE` | `/driver-student-assignments/:id` |
| `GET` | `/driver-student-assignments/admin/all-assignments` |
| `GET` | `/trips/admin/all-trips` |
| `POST` | `/trips/` |
| `GET` | `/trips/my-trips` |
| `GET` | `/trips/my-trips/by-date` |
| `PATCH` | `/trips/:id/status` |
| `GET` | `/trips/my-trips/active` |
| `GET` | `/trips/:id` |
| `PUT` | `/trips/:id` |
| `DELETE` | `/trips/:id` |
| `PUT` | `/trip-students/trip/:tripId/student/:studentId/attendance` |
| `PUT` | `/trip-students/trip/:tripId/student/:studentId/pickup` |
| `PUT` | `/trip-students/trip/:tripId/student/:studentId/drop` |
| `GET` | `/trip-students/trip/:tripId` |
| `GET` | `/trip-students/:id` |
| `GET` | `/trip-students/student/:studentId` |
| `GET` | `/trip-students/trip/:tripId/student/:studentId` |
| `GET` | `/trip-students/trip/:tripId/attendance` |
| `GET` | `/trip-students/trip/:tripId/pickup` |
| `PUT` | `/trip-students/:id` |
| `GET` | `/driver/profile` |
| `POST` | `/driver/profile` |
| `PUT` | `/driver/profile` |
| `PATCH` | `/driver/availability` |
| `GET` | `/driver/address` |
| `POST` | `/driver/address` |
| `GET` | `/driver/documents` |
| `POST` | `/driver/documents` |
| `PUT` | `/driver/documents` |
| `GET` | `/parent/profile` |
| `PUT` | `/parent/profile` |
| `GET` | `/parent/address` |
| `PUT` | `/parent/address` |
| `POST` | `/students/` |
| `GET` | `/students/my-students` |
| `GET` | `/students/my-active-students` |
| `GET` | `/students/:id` |
| `PUT` | `/students/:id` |
| `DELETE` | `/students/:id` |
| `GET` | `/students/by-student-id/:student_id` |
| `PUT` | `/students/by-student-id/:student_id` |
| `DELETE` | `/students/by-student-id/:student_id` |

---

## Version History

| Version | Date | Type | Total Endpoints | GET | POST | PUT | PATCH | DELETE | Changes |
|---------|------|------|-----------------|-----|------|-----|-------|--------|----------|
| **0.0.0** | 2026-01-10 | `PATCH` | 134 | 62 | 27 | 23 | 13 | 9 | - |

---

## Notes

- **MAJOR**: Breaking changes (removed endpoints, changed signatures)
- **MINOR**: New features (added endpoints, backwards-compatible)
- **PATCH**: Bug fixes and documentation improvements

---

*Generated by API Documentation Generator v2.0*
