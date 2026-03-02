# Admin Roles — Responsibilities & Flow

> Quick reference for what each admin role does in the Ping Parent system.

---

## Role Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                     SUPER ADMIN (SA)                    │
│              Scope: GLOBAL (all schools)                │
│                                                         │
│  - Highest authority in the system                      │
│  - Can create: Admin + School Admin                     │
│  - Full access to every feature                         │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                   ADMIN (A)                       │  │
│  │            Scope: GLOBAL (all schools)            │  │
│  │                                                   │  │
│  │  - Created by Super Admin                         │  │
│  │  - Can create: School Admin only                  │  │
│  │  - Most features except system-level ones         │  │
│  │                                                   │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │            SCHOOL ADMIN (SchA)              │  │  │
│  │  │       Scope: OWN SCHOOL only                │  │  │
│  │  │                                             │  │  │
│  │  │  - Created by SA or Admin                   │  │  │
│  │  │  - Cannot create any admin accounts         │  │  │
│  │  │  - All data scoped to their school_id       │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Creation Flow

```
Super Admin
  │
  ├──creates──► Admin
  │               │
  │               └──creates──► School Admin (assigned to a school)
  │
  └──creates──► School Admin (assigned to a school)

School Admin ──► Cannot create anyone
```

---

## What Each Role Does

### Super Admin (SA) — "Platform Owner"

**Exclusive responsibilities (only SA can do these):**

| Area | Actions |
|------|---------|
| Admin Management | Create/update/activate/deactivate Admins and Super Admins |
| Subscription Plans | Create, update, activate, deactivate pricing plans |
| Payments & Refunds | View all payments, process Razorpay refunds |
| Roles & Permissions | Create, update, delete custom roles |
| System Maintenance | Clean old tracking data |
| Notifications | Send platform-wide notifications |

**Plus everything Admin can do (below).**

---

### Admin (A) — "Operations Manager"

**Shared with SA:**

| Area | Actions |
|------|---------|
| Dashboard | View global stats — all parents, drivers, students, trips, revenue |
| School Management | Create, update, delete schools |
| School Admin Management | View school admins per school, deactivate them |
| User Management | List/view/activate/deactivate/delete parents, drivers, students |
| Driver Approvals | Approve or reject driver applications (all schools) |
| Driver-School Assignment | Assign or remove drivers from any school |
| Trips & Tracking | View all trips, trip details, live tracking |
| School Subscriptions | Create, update, renew, cancel school subscriptions |
| Redemption Codes | Generate and view codes for any school |
| Ads Management | Create, update, activate/deactivate, delete ads |
| Support Tickets | View, assign, update status, resolve tickets |
| Audit Logs | View all audit logs with filters |
| Reports | View trip/payment/driver/student reports, export CSV/PDF |
| Assignments | View and manage school assignments, approve/reject |

**Cannot do:**
- Create/manage other Admins
- Manage subscription plans
- Process refunds
- Manage roles & permissions
- System maintenance

---

### School Admin (SchA) — "School Operations"

**Everything is scoped to their own school only.**

| Area | Actions |
|------|---------|
| Dashboard | View school-scoped stats (own students, drivers, trips) |
| Students | View students list (read-only) |
| Driver Approvals | Approve/reject drivers for own school |
| Driver Assignment | Assign drivers to own school |
| Trips & Tracking | View school-scoped trips, trip details, live tracking |
| School Subscription | View own school's active subscription |
| Redemption Codes | Generate and view codes for own school |
| School Events | Create, update, cancel events; send notifications to parents |
| Event RSVPs | View RSVP responses, export attendance |
| Community Board | Pin/unpin posts, hide posts/comments, view anonymous authors |
| Notifications | View and manage own notifications, send to school parents |
| Assignments | View/create/approve/reject school-scoped assignments |

**Cannot do:**
- Manage any admin accounts
- Manage schools (create/update/delete)
- Manage subscription plans or pricing
- Process payments or refunds
- View audit logs or reports
- Manage ads or support tickets
- System maintenance

---

## Visual Flow — Day-to-Day Operations

```
┌──────────────────── SUPER ADMIN ────────────────────┐
│                                                      │
│  1. Set up the platform                              │
│     └─► Create subscription plans                    │
│     └─► Create schools                               │
│     └─► Create Admins                                │
│     └─► Define roles & permissions                   │
│                                                      │
│  2. Ongoing oversight                                │
│     └─► Monitor global dashboard                     │
│     └─► Review payments & process refunds            │
│     └─► Check audit logs                             │
│     └─► View reports & analytics                     │
│     └─► System maintenance (cleanup old data)        │
│                                                      │
│  3. Escalations                                      │
│     └─► Handle support tickets                       │
│     └─► Activate/deactivate any user                 │
│     └─► Manage notifications                         │
└──────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────── ADMIN ──────────────────────────┐
│                                                      │
│  1. School onboarding                                │
│     └─► Create schools                               │
│     └─► Create School Admins for each school         │
│     └─► Set up school subscriptions                  │
│                                                      │
│  2. Daily operations                                 │
│     └─► Approve/reject driver applications           │
│     └─► Assign drivers to schools                    │
│     └─► Monitor trips & live tracking                │
│     └─► Handle support tickets                       │
│                                                      │
│  3. Reporting                                        │
│     └─► Generate trip/payment/driver reports          │
│     └─► Review audit logs                            │
│     └─► Manage ad campaigns                          │
└──────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────── SCHOOL ADMIN ───────────────────┐
│                                                      │
│  1. School setup                                     │
│     └─► View school subscription                     │
│     └─► Generate student redemption codes            │
│     └─► Assign drivers to school                     │
│                                                      │
│  2. Daily operations                                 │
│     └─► Approve/reject drivers for own school        │
│     └─► Monitor school trips & live tracking         │
│     └─► View students (read-only)                    │
│     └─► Manage driver-student assignments            │
│                                                      │
│  3. Engagement                                       │
│     └─► Create & manage school events                │
│     └─► Track event RSVPs                            │
│     └─► Moderate community board                     │
│     └─► Send notifications to school parents         │
└──────────────────────────────────────────────────────┘
```

---

## Quick Comparison Table

| Feature                      | Super Admin | Admin | School Admin        |
| ---------------------------- | :---------: | :---: | :-----------------: |
| **Scope**                    | Global      | Global | Own school only    |
| **Can create**               | Admin + SchA | SchA only | Nobody          |
| Create Super Admin           | Yes | No  | No                  |
| Manage Admins                | Yes | No  | No                  |
| Manage Schools               | Yes | Yes | No                  |
| Manage School Admins         | Yes | Yes | No                  |
| Approve/reject drivers       | Yes | Yes | Yes (own school)    |
| Activate/deactivate users    | Yes | Yes | No                  |
| Delete users                 | Yes | Yes | No                  |
| Assign drivers to school     | Yes | Yes | Yes (own school)    |
| Manage subscription plans    | Yes | No  | No                  |
| View subscription plans      | Yes | Yes | Yes (read-only)     |
| Create school subscription   | Yes | Yes | No                  |
| Generate redemption codes    | Yes | Yes | Yes (own school)    |
| Process refunds              | Yes | No  | No                  |
| Manage roles                 | Yes | No  | No                  |
| View audit logs              | Yes | Yes | No                  |
| Manage ads                   | Yes | Yes | No                  |
| Manage support tickets       | Yes | Yes | No                  |
| View reports                 | Yes | Yes | No                  |
| Manage school events         | No  | No  | Yes                 |
| Moderate community board     | No  | No  | Yes                 |
| System maintenance           | Yes | No  | No                  |
| Send school notifications    | Yes | No  | Yes (own school)    |

---

## API Gateway Mapping

| Role | Primary Gateway | Base Path |
|------|----------------|-----------|
| Super Admin | Superadmin + Admin | `/api/superadmin` + `/api/admin` |
| Admin | Admin | `/api/admin` |
| School Admin | School Admin + Admin (scoped) | `/api/school-admin` + `/api/admin` |
| All roles | Shared | `/api/shared` |
