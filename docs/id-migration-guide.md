# ID Migration Guide — Frontend

Custom-generated ID fields (e.g. `user_id`, `student_id`, `trip_id`) have been removed.
MongoDB's auto-generated `_id` is now the primary key for every collection.
API responses return it as **`_id`** (string).

---

## Quick Summary

| What changed | Before | After |
|---|---|---|
| Primary key field | `user_id`, `student_id`, `trip_id`, etc. | `_id` (MongoDB ObjectId string) |
| Foreign key fields | Same names | **No change** — `parent_id`, `driver_id`, `school_id`, `student_ids`, etc. stay as-is |
| FK values | Custom codes (e.g. `USR-abc123`) | MongoDB ObjectId strings (e.g. `507f1f77bcf86cd799439011`) |

---

## Per-Entity Changes

### Users (`/api/auth/*`)
| Old key | New key |
|---|---|
| `user_id` | `_id` |

### Parents (`/api/parents/*`)
| Old key | New key |
|---|---|
| `parent_id` | `_id` |

### Parent Addresses
| Old key | New key |
|---|---|
| `address_id` | `_id` |

### Drivers (`/api/drivers/*`)
| Old key | New key |
|---|---|
| `driver_id` | `_id` |
| `driver_unique_id` | **unchanged** (still generated, human-readable) |

### Driver Addresses
| Old key | New key |
|---|---|
| `address_id` | `_id` |

### Driver Documents
| Old key | New key |
|---|---|
| `document_id` | `_id` |

### Students (`/api/students/*`)
| Old key | New key |
|---|---|
| `student_id` | `_id` |

### Schools (`/api/schools/*`)
| Old key | New key |
|---|---|
| `school_id` | `_id` |

### School Admins (`/api/school-admin/*`)
| Old key | New key |
|---|---|
| `admin_id` | `_id` |

### Admin Management (`/api/admin/*`)
| Old key | New key |
|---|---|
| `admin_id` | `_id` |

### Roles (`/api/admin/roles/*`)
| Old key | New key |
|---|---|
| `role_id` | `_id` |

### User Roles
| Old key | New key |
|---|---|
| `user_role_id` | `_id` |

### Audit Logs (`/api/admin/audit-logs/*`)
| Old key | New key |
|---|---|
| `log_id` | `_id` |

### Trips (`/api/trips/*`)
| Old key | New key |
|---|---|
| `trip_id` | `_id` |

### Trip Students
| Old key | New key |
|---|---|
| `trip_student_id` | `_id` |

### Driver Student Assignments (`/api/assignments/*`)
| Old key | New key |
|---|---|
| `assignment_id` | `_id` |

### Daily QR/OTP (`/api/qr-otp/*`)
| Old key | New key |
|---|---|
| `qr_otp_id` | `_id` |

### Subscription Plans (`/api/subscription-plans/*`)
| Old key | New key |
|---|---|
| `plan_id` | `_id` |

### Parent Subscriptions (`/api/subscriptions/*`)
| Old key | New key |
|---|---|
| `subscription_id` | `_id` |

### School Subscriptions (`/api/school-subscriptions/*`)
| Old key | New key |
|---|---|
| `subscription_id` | `_id` |

### School Student Codes
| Old key | New key |
|---|---|
| `code_id` | `_id` |
| `code` | **unchanged** (the redemption code string) |

### Payments (`/api/payments/*`)
| Old key | New key |
|---|---|
| `payment_id` | `_id` |

### Reviews (`/api/reviews/*`)
| Old key | New key |
|---|---|
| `review_id` | `_id` |

### Notifications
| Old key | New key |
|---|---|
| `notification_id` | `_id` |

### Location Tracking
| Old key | New key |
|---|---|
| `tracking_id` | `_id` |

### Support Tickets (`/api/support-tickets/*`)
| Old key | New key |
|---|---|
| `ticket_id` | `_id` |

### Tracking Subscriptions
| Old key | New key |
|---|---|
| `subscription_id` | `_id` |

---

## Foreign Key Fields — NO CHANGE

These fields keep their names. Only their **values** changed from custom codes to `_id` strings:

- `user_id` — in parents, drivers (references `users._id`)
- `parent_id` — in students, subscriptions, payments, reviews, QR/OTP (references `parents._id`)
- `driver_id` — in trips, assignments, tracking, reviews (references `drivers._id`)
- `school_id` — in students, school admins, school subscriptions, assignments (references `schools._id`)
- `student_id` / `student_ids` — in trip_students, assignments, QR/OTP, subscriptions (references `students._id`)
- `trip_id` — in trip_students, QR/OTP, tracking, reviews (references `trips._id`)
- `plan_id` — in subscriptions, school student codes (references `subscription_plans._id`)
- `school_subscription_id` — in school student codes, parent subscriptions (references `school_subscriptions._id`)

---

## What to Search & Replace in Frontend

1. **Response parsing**: Anywhere you read `response.data.student_id` (or `trip_id`, `user_id`, etc.) as the document's own ID → change to `response.data._id`
2. **URL params**: If you pass custom IDs in URLs (e.g. `/api/students/:student_id`) → now pass the `_id` value instead
3. **Request bodies**: If you send a custom ID in create/update payloads → remove it (server generates `_id` automatically)
4. **FK references stay the same**: When you send `parent_id`, `driver_id`, `school_id`, `plan_id`, etc. in request bodies, keep them — just use the new `_id` values from referenced entities
