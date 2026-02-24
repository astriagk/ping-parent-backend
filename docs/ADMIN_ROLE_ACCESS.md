# Admin Portal — Role-Based Access

Single codebase, one sidebar — visibility controlled by `admin_role` from `admin_portal` table.

## Roles

| Role | Scope | Can Create |
|------|-------|------------|
| **superadmin** | Global (all schools, all data) | admin, school_admin |
| **admin** | Global (all schools, all data) | school_admin only |
| **school_admin** | Own `school_id` only | — |

---

## Access Matrix

| # | Sidebar Item | superadmin | admin | school_admin |
|---|-------------|:---:|:---:|:---:|
| 1 | Dashboard | Y | Y | Y (school-scoped) |
| 2 | Manage Admins | Y | — | — |
| 3 | Manage School Admins | Y | Y | — |
| 4 | Manage Schools | Y | Y | — |
| 5 | Driver Approvals | Y | Y | — |
| 6 | Trips & Tracking | Y (all) | Y (all) | Y (school-scoped) |
| 7 | Subscription Plans | Y | — | — |
| 8 | School Subscription | — | — | Y |
| 9 | Student Codes | — | — | Y |
| 10 | Students | — | — | Y (read-only) |
| 11 | Driver Assignments | — | — | Y |
| 12 | Payments Overview | Y | — | — |
| 13 | Manage Ads | Y | Y | — |
| 14 | School Events | — | — | Y |
| 15 | Event RSVPs | — | — | Y |
| 16 | Community Moderation | — | — | Y |
| 17 | Support Tickets | Y | Y | — |
| 18 | User Roles | Y | — | — |
| 19 | Audit Logs | Y | — | — |
| 20 | Notifications | Y | — | Y (school-scoped) |
| 21 | Reports | Y | Y | — |

---

## Sidebar Config JSON

Use this in your frontend to render the sidebar based on the logged-in admin's `admin_role`.

```json
{
  "superadmin": [
    { "key": "dashboard",          "label": "Dashboard",          "icon": "LayoutDashboard",  "path": "/dashboard" },
    { "key": "admin_management",   "label": "Manage Admins",      "icon": "ShieldCheck",      "path": "/admins" },
    { "key": "school_management",  "label": "Manage Schools",     "icon": "School",           "path": "/schools" },
    { "key": "driver_approval",    "label": "Driver Approvals",   "icon": "UserCheck",        "path": "/drivers" },
    { "key": "trips_tracking",     "label": "Trips & Tracking",   "icon": "MapPin",           "path": "/trips" },
    { "key": "subscription_plans", "label": "Subscription Plans", "icon": "CreditCard",       "path": "/subscription-plans" },
    { "key": "payments",           "label": "Payments",           "icon": "IndianRupee",      "path": "/payments" },
    { "key": "ads_management",     "label": "Manage Ads",         "icon": "Megaphone",        "path": "/ads" },
    { "key": "support_tickets",    "label": "Support Tickets",    "icon": "LifeBuoy",         "path": "/support" },
    { "key": "user_roles",         "label": "User Roles",         "icon": "Users",            "path": "/roles" },
    { "key": "audit_logs",         "label": "Audit Logs",         "icon": "FileText",         "path": "/audit-logs" },
    { "key": "notifications",      "label": "Notifications",      "icon": "Bell",             "path": "/notifications" },
    { "key": "reports",            "label": "Reports",            "icon": "BarChart3",        "path": "/reports" }
  ],

  "admin": [
    { "key": "dashboard",              "label": "Dashboard",       "icon": "LayoutDashboard",  "path": "/dashboard" },
    { "key": "school_management",      "label": "Manage Schools",  "icon": "School",           "path": "/schools" },
    { "key": "school_admin_management","label": "School Admins",   "icon": "ShieldCheck",      "path": "/school-admins" },
    { "key": "driver_approval",        "label": "Driver Approvals","icon": "UserCheck",        "path": "/drivers" },
    { "key": "trips_tracking",         "label": "Trips & Tracking","icon": "MapPin",           "path": "/trips" },
    { "key": "ads_management",         "label": "Manage Ads",      "icon": "Megaphone",        "path": "/ads" },
    { "key": "support_tickets",        "label": "Support Tickets", "icon": "LifeBuoy",         "path": "/support" },
    { "key": "reports",                "label": "Reports",         "icon": "BarChart3",        "path": "/reports" }
  ],

  "school_admin": [
    { "key": "dashboard",              "label": "Dashboard",          "icon": "LayoutDashboard",  "path": "/dashboard" },
    { "key": "school_subscription",    "label": "Subscription",       "icon": "CreditCard",       "path": "/subscription" },
    { "key": "student_codes",          "label": "Student Codes",      "icon": "QrCode",           "path": "/student-codes" },
    { "key": "students",               "label": "Students",           "icon": "GraduationCap",    "path": "/students" },
    { "key": "driver_assignments",     "label": "Driver Assignments", "icon": "Bus",              "path": "/assignments" },
    { "key": "trips_tracking",         "label": "Trips & Tracking",   "icon": "MapPin",           "path": "/trips" },
    { "key": "school_events",          "label": "Events",             "icon": "CalendarDays",     "path": "/events" },
    { "key": "event_rsvps",            "label": "Event RSVPs",        "icon": "ClipboardCheck",   "path": "/events/rsvps" },
    { "key": "community_moderation",   "label": "Community Board",    "icon": "MessageSquare",    "path": "/community" },
    { "key": "notifications",          "label": "Notifications",      "icon": "Bell",             "path": "/notifications" }
  ]
}
```

---

## Screen Details

### Shared (All Roles)

**Dashboard** `/dashboard`
- superadmin/admin: Total schools, drivers (pending/approved), parents, students, active trips, revenue
- school_admin: Own school stats — students, drivers, active trips, subscription status

---

### Superadmin Only

**Manage Admins** `/admins`
- Table: `admin_portal`
- CRUD admin and school_admin accounts
- school_admin creation requires selecting a `school_id`
- Cannot create another superadmin (seeded via `/admin/setup`)

**Subscription Plans** `/subscription-plans`
- Table: `subscription_plans`
- Create/edit monthly, quarterly, yearly plans with pricing
- Activate/deactivate plans

**Payments** `/payments`
- Tables: `payments`, `parent_subscriptions`
- View all payment transactions, filter by status (pending/completed/failed/refunded)
- View parent subscription history

**User Roles** `/roles`
- Tables: `roles`, `user_roles`
- Assign/revoke roles for users

**Audit Logs** `/audit-logs`
- Table: `audit_logs`
- Read-only. Filter by user, action_type, entity_type, date range

---

### Superadmin + Admin

**Manage Schools** `/schools`
- Table: `schools`
- CRUD schools (name, address, city, lat/long, contact)

**School Admins** `/school-admins` (admin only sees this label)
- Table: `admin_portal` filtered to `admin_role = school_admin`
- Create school_admin with `school_id`

**Driver Approvals** `/drivers`
- Tables: `drivers`, `driver_documents`, `driver_addresses`
- List drivers by `approval_status` (pending, approved, rejected)
- View profile, uploaded documents (license, insurance)
- Approve or reject with `rejection_reason`

**Trips & Tracking** `/trips` (superadmin + admin scope)
- Tables: `trips`, `trip_students`, `location_tracking`
- View ALL trips across all schools and drivers
- Filter by: school, driver, trip_date, trip_type (pickup/drop), trip_status
- Trip list columns: driver name, school, trip_type, trip_date, trip_status, student count
- Trip detail view:
  - Student list with pickup_status (pending/picked/dropped/no_show)
  - Attendance status (present/absent/pending)
  - Pickup/drop timestamps and lat/long
- Live tracking: View active trip on map with real-time driver location (`location_tracking`)
- Trip history: Completed trips with total_distance, start_time, end_time

**Manage Ads** `/ads`
- Tables: `ads`, `ad_interactions`
- Create ads: banner, interstitial, native_card
- Set target_audience (all/parents/drivers/school_admin), target_school_ids
- View impressions & click analytics

**Support Tickets** `/support`
- Table: `support_tickets`
- List/filter by status (open/in_progress/resolved/closed) and priority
- Assign to admin, update status, resolve

**Reports** `/reports`
- Aggregate data from `trips`, `payments`, `drivers`, `students`
- Trip reports, payment reports, driver stats

---

### School Admin Only

**Subscription** `/subscription`
- Table: `school_subscriptions`
- View own school's subscription (plan, end_date, max_drivers, max_students)
- Renew subscription

**Student Codes** `/student-codes`
- Table: `school_student_codes`
- Generate redemption codes (SCHSTDCD prefix) per student
- Track: total generated, redeemed, pending
- See which parent redeemed (`redeemed_by_parent_id`)

**Students** `/students`
- Table: `students` filtered by `school_id`
- Read-only list of students in this school
- View student details, parent info, assigned driver

**Driver Assignments** `/assignments`
- Table: `driver_student_assignments`
- Assign drivers to students (`assignment_source = school`)
- View/deactivate existing assignments

**Trips & Tracking** `/trips` (school_admin scope)
- Tables: `trips`, `trip_students`, `location_tracking`
- View trips ONLY for own `school_id`
- Same features as superadmin/admin but filtered to own school:
  - Filter by driver, trip_date, trip_type, trip_status
  - Trip detail with student pickup/drop status
  - Live tracking of active trips for this school
  - Trip history for this school

**Events** `/events`
- Table: `school_events`
- Create events: sports, parent_meeting, cultural, holiday, festival, exam, excursion, general
- Set audience_scope: all or class_specific (with target_classes)
- Set requires_rsvp, rsvp_deadline, attachments
- Cancel events with reason
- Trigger push notification to affected parents

**Event RSVPs** `/events/rsvps`
- Table: `event_rsvp`
- View responses per event: attending, not_attending, maybe
- Export RSVP list

**Community Board** `/community`
- Tables: `community_posts`, `community_post_comments`
- Pin/unpin important posts
- Hide inappropriate posts or comments (`is_visible = false`)
- View anonymous post authors (parents cannot)
- Set `moderation_reason`

**Notifications** `/notifications`
- Table: `notifications`
- Send push notifications to all parents of this school

---

## Creation Hierarchy

```
superadmin
├── can create → admin
├── can create → school_admin (with school_id)
│
admin
├── can create → school_admin (with school_id)
│
school_admin
└── cannot create any admin accounts
```

## Frontend Implementation Notes

1. After login, read `admin_role` from the JWT/session
2. Use the sidebar JSON above to render only the allowed menu items
3. For `school_admin`, all API calls should be scoped by their `school_id` (backend enforces this)
4. Trips & Tracking page: same component, different data scope — superadmin/admin see all, school_admin filtered by `school_id`
5. Icons reference [Lucide Icons](https://lucide.dev/icons/) — swap as needed for your icon library
