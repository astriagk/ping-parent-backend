# Database Tables Structure

| Table Name                 | Column Name               | Data Type     | Constraints / Notes                                                                  |
| -------------------------- | ------------------------- | ------------- | ------------------------------------------------------------------------------------ |
| users                      | user_id                   | varchar(36)   | PK                                                                                   |
|                            | phone_number              | varchar(20)   | unique, not null, index                                                              |
|                            | user_type                 | enum          | not null, index, 'parent or driver'                                                  |
|                            | is_active                 | boolean       | default: true                                                                        |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
|                            | updated_at                | timestamp     |                                                                                      |
|                            | last_login                | timestamp     |                                                                                      |
|                            | fcm_token                 | varchar(255)  | 'Firebase Cloud Messaging token'                                                     |
| otp_verification           | otp_id                    | int           | PK, auto-increment                                                                   |
|                            | phone_number              | varchar(20)   | not null, index                                                                      |
|                            | otp_code                  | varchar(6)    | not null, index                                                                      |
|                            | is_verified               | boolean       | default: false                                                                       |
|                            | expires_at                | timestamp     | not null, index                                                                      |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
| parents                    | parent_id                 | varchar(36)   | PK                                                                                   |
|                            | user_id                   | varchar(36)   | unique, not null, FK → users.user_id                                                 |
|                            | name                      | varchar(100)  | not null                                                                             |
|                            | email                     | varchar(100)  | index                                                                                |
|                            | photo_url                 | varchar(255)  |                                                                                      |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
|                            | updated_at                | timestamp     |                                                                                      |
| parent_addresses           | address_id                | varchar(36)   | PK                                                                                   |
|                            | parent_id                 | varchar(36)   | not null, FK → parents.parent_id, index                                              |
|                            | address_line1             | varchar(255)  | not null                                                                             |
|                            | address_line2             | varchar(255)  |                                                                                      |
|                            | city                      | varchar(100)  | not null                                                                             |
|                            | state                     | varchar(100)  | not null                                                                             |
|                            | pincode                   | varchar(10)   |                                                                                      |
|                            | latitude                  | decimal(10,8) | not null                                                                             |
|                            | longitude                 | decimal(11,8) | not null                                                                             |
|                            | is_primary                | boolean       | default: true                                                                        |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
|                            | updated_at                | timestamp     |                                                                                      |
| drivers                    | driver_id                 | varchar(36)   | PK                                                                                   |
|                            | user_id                   | varchar(36)   | unique, not null, FK → users.user_id                                                 |
|                            | driver_unique_id          | varchar(20)   | unique, not null, index, 'Unique ID for parents to search/add'                       |
|                            | name                      | varchar(100)  | not null                                                                             |
|                            | email                     | varchar(100)  |                                                                                      |
|                            | photo_url                 | varchar(255)  |                                                                                      |
|                            | home_address              | varchar(255)  | 'Driver starting point address'                                                      |
|                            | home_latitude             | decimal(10,8) | 'Driver starting point latitude', index                                              |
|                            | home_longitude            | decimal(11,8) | 'Driver starting point longitude', index                                             |
|                            | driving_license_number    | varchar(50)   | not null                                                                             |
|                            | driving_license_photo_url | varchar(255)  |                                                                                      |
|                            | vehicle_license_number    | varchar(50)   | not null                                                                             |
|                            | vehicle_license_photo_url | varchar(255)  |                                                                                      |
|                            | insurance_number          | varchar(50)   |                                                                                      |
|                            | insurance_photo_url       | varchar(255)  |                                                                                      |
|                            | vehicle_type              | enum          | not null, index, 'van, auto, bus'                                                    |
|                            | vehicle_number            | varchar(20)   | not null                                                                             |
|                            | vehicle_capacity          | int           | not null                                                                             |
|                            | current_student_count     | int           | default: 0, 'Current number of active students'                                      |
|                            | approval_status           | enum          | default: 'pending', index, 'pending, approved, rejected'                             |
|                            | approved_by               | varchar(36)   |                                                                                      |
|                            | approved_at               | timestamp     |                                                                                      |
|                            | rejection_reason          | text          |                                                                                      |
|                            | is_available              | boolean       | default: true, index                                                                 |
|                            | rating                    | decimal(3,2)  | default: 0.00                                                                        |
|                            | total_trips               | int           | default: 0                                                                           |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
|                            | updated_at                | timestamp     |                                                                                      |
| schools                    | school_id                 | varchar(36)   | PK                                                                                   |
|                            | school_name               | varchar(200)  | not null                                                                             |
|                            | address                   | varchar(255)  | not null                                                                             |
|                            | city                      | varchar(100)  | not null, index                                                                      |
|                            | state                     | varchar(100)  | not null                                                                             |
|                            | latitude                  | decimal(10,8) | not null, index                                                                      |
|                            | longitude                 | decimal(11,8) | not null, index                                                                      |
|                            | contact_number            | varchar(20)   |                                                                                      |
|                            | email                     | varchar(100)  |                                                                                      |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
|                            | updated_at                | timestamp     |                                                                                      |
| students                   | student_id                | varchar(36)   | PK                                                                                   |
|                            | parent_id                 | varchar(36)   | not null, FK → parents.parent_id, index                                              |
|                            | school_id                 | varchar(36)   | not null, FK → schools.school_id, index                                              |
|                            | student_name              | varchar(100)  | not null                                                                             |
|                            | class                     | varchar(20)   | not null                                                                             |
|                            | section                   | varchar(10)   |                                                                                      |
|                            | roll_number               | varchar(20)   |                                                                                      |
|                            | photo_url                 | varchar(255)  |                                                                                      |
|                            | date_of_birth             | date          |                                                                                      |
|                            | gender                    | enum          | 'male, female, other'                                                                |
|                            | pickup_address_id         | varchar(36)   | not null, FK → parent_addresses.address_id                                           |
|                            | emergency_contact         | varchar(20)   |                                                                                      |
|                            | medical_info              | text          |                                                                                      |
|                            | is_active                 | boolean       | default: true, index                                                                 |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
|                            | updated_at                | timestamp     |                                                                                      |
| driver_student_assignments | assignment_id             | varchar(36)   | PK                                                                                   |
|                            | driver_id                 | varchar(36)   | not null, FK → drivers.driver_id, index                                              |
|                            | student_id                | varchar(36)   | not null, FK → students.student_id, index                                            |
|                            | driver_unique_id          | varchar(20)   | not null, index, 'Unique ID parents use to find driver'                              |
|                            | monthly_fee               | decimal(10,2) |                                                                                      |
|                            | assignment_status         | enum          | default: 'pending', index, 'active, inactive, pending, parent_requested'             |
|                            | assigned_date             | date          | not null                                                                             |
|                            | start_date                | date          |                                                                                      |
|                            | end_date                  | date          |                                                                                      |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
|                            | updated_at                | timestamp     |                                                                                      |
| trips                      | trip_id                   | varchar(36)   | PK                                                                                   |
|                            | driver_id                 | varchar(36)   | not null, FK → drivers.driver_id, index                                              |
|                            | school_id                 | varchar(36)   | not null, FK → schools.school_id, index                                              |
|                            | trip_type                 | enum          | not null, 'pickup, drop'                                                             |
|                            | trip_date                 | date          | not null, index                                                                      |
|                            | trip_status               | enum          | default: 'scheduled', index, 'scheduled, started, in_progress, completed, cancelled' |
|                            | start_time                | timestamp     |                                                                                      |
|                            | end_time                  | timestamp     |                                                                                      |
|                            | total_distance            | decimal(10,2) | 'in kilometers'                                                                      |
|                            | optimized_route_data      | json          | 'Calculated optimal sequence of student pickups/drops'                               |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
|                            | updated_at                | timestamp     |                                                                                      |
| trip_students              | trip_student_id           | varchar(36)   | PK                                                                                   |
|                            | trip_id                   | varchar(36)   | not null, FK → trips.trip_id, index                                                  |
|                            | student_id                | varchar(36)   | not null, FK → students.student_id, index                                            |
|                            | sequence_order            | int           | 'Optimized pickup/drop order'                                                        |
|                            | estimated_arrival_time    | time          | 'Calculated ETA'                                                                     |
|                            | attendance_status         | enum          | default: 'pending', 'present, absent, pending', index                                |
|                            | pickup_status             | enum          | default: 'pending', 'pending, picked, dropped, no_show', index                       |
|                            | pickup_time               | timestamp     |                                                                                      |
|                            | pickup_latitude           | decimal(10,8) |                                                                                      |
|                            | pickup_longitude          | decimal(11,8) |                                                                                      |
|                            | pickup_qr_code            | varchar(100)  |                                                                                      |
|                            | pickup_otp                | varchar(6)    |                                                                                      |
|                            | drop_time                 | timestamp     |                                                                                      |
|                            | drop_latitude             | decimal(10,8) |                                                                                      |
|                            | drop_longitude            | decimal(11,8) |                                                                                      |
|                            | drop_qr_code              | varchar(100)  |                                                                                      |
|                            | drop_otp                  | varchar(6)    |                                                                                      |
|                            | notes                     | text          |                                                                                      |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
|                            | updated_at                | timestamp     |                                                                                      |
| location_tracking          | tracking_id               | varchar(36)   | PK                                                                                   |
|                            | trip_id                   | varchar(36)   | not null, FK → trips.trip_id, index                                                  |
|                            | driver_id                 | varchar(36)   | not null, FK → drivers.driver_id, index                                              |
|                            | latitude                  | decimal(10,8) | not null                                                                             |
|                            | longitude                 | decimal(11,8) | not null                                                                             |
|                            | speed                     | decimal(5,2)  | 'in km/h'                                                                            |
|                            | heading                   | decimal(5,2)  | 'direction in degrees'                                                               |
|                            | accuracy                  | decimal(6,2)  | 'in meters'                                                                          |
|                            | timestamp                 | timestamp     | default: CURRENT_TIMESTAMP, index                                                    |
| daily_qr_otp               | qr_otp_id                 | varchar(36)   | PK                                                                                   |
|                            | student_id                | varchar(36)   | not null, FK → students.student_id, index                                            |
|                            | trip_id                   | varchar(36)   | not null, FK → trips.trip_id, index                                                  |
|                            | qr_code                   | varchar(255)  | unique, not null, index                                                              |
|                            | otp_code                  | varchar(6)    | not null, index                                                                      |
|                            | trip_type                 | enum          | not null, 'pickup, drop'                                                             |
|                            | valid_from                | timestamp     | not null, index                                                                      |
|                            | valid_until               | timestamp     | not null, index                                                                      |
|                            | is_used                   | boolean       | default: false                                                                       |
|                            | used_at                   | timestamp     |                                                                                      |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
| notifications              | notification_id           | varchar(36)   | PK                                                                                   |
|                            | user_id                   | varchar(36)   | not null, FK → users.user_id, index                                                  |
|                            | notification_type         | enum          | not null, 'pickup_started, approaching, picked_up, dropped, payment_due, general'    |
|                            | title                     | varchar(200)  | not null                                                                             |
|                            | message                   | text          | not null                                                                             |
|                            | data                      | json          | 'Additional data'                                                                    |
|                            | is_read                   | boolean       | default: false, index                                                                |
|                            | read_at                   | timestamp     |                                                                                      |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP, index                                                    |
| subscription_plans         | plan_id                   | varchar(36)   | PK                                                                                   |
|                            | plan_name                 | varchar(100)  | not null                                                                             |
|                            | plan_type                 | enum          | not null, 'monthly, quarterly, yearly'                                               |
|                            | price                     | decimal(10,2) | not null                                                                             |
|                            | features                  | json          |                                                                                      |
|                            | is_active                 | boolean       | default: true, index                                                                 |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
|                            | updated_at                | timestamp     |                                                                                      |
| parent_subscriptions       | subscription_id           | varchar(36)   | PK                                                                                   |
|                            | parent_id                 | varchar(36)   | not null, FK → parents.parent_id, index                                              |
|                            | plan_id                   | varchar(36)   | not null, FK → subscription_plans.plan_id                                            |
|                            | start_date                | date          | not null                                                                             |
|                            | end_date                  | date          | not null                                                                             |
|                            | subscription_status       | enum          | not null, 'active, expired, cancelled', index                                        |
|                            | auto_renew                | boolean       | default: true                                                                        |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
|                            | updated_at                | timestamp     |                                                                                      |
| payments                   | payment_id                | varchar(36)   | PK                                                                                   |
|                            | parent_id                 | varchar(36)   | not null, FK → parents.parent_id, index                                              |
|                            | payment_type              | enum          | not null, 'subscription, penalty'                                                    |
|                            | amount                    | decimal(10,2) | not null                                                                             |
|                            | currency                  | varchar(3)    | default: 'INR'                                                                       |
|                            | payment_method            | enum          | not null, 'card, upi, netbanking, wallet, cash'                                      |
|                            | payment_status            | enum          | not null, 'pending, completed, failed, refunded', index                              |
|                            | transaction_id            | varchar(100)  |                                                                                      |
|                            | gateway_response          | json          |                                                                                      |
|                            | subscription_id           | varchar(36)   | FK → parent_subscriptions.subscription_id                                            |
|                            | payment_date              | timestamp     | default: CURRENT_TIMESTAMP, index                                                    |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
|                            | updated_at                | timestamp     |                                                                                      |
| ratings_reviews            | review_id                 | varchar(36)   | PK                                                                                   |
|                            | parent_id                 | varchar(36)   | not null, FK → parents.parent_id                                                     |
|                            | driver_id                 | varchar(36)   | not null, FK → drivers.driver_id, index                                              |
|                            | trip_id                   | varchar(36)   | FK → trips.trip_id                                                                   |
|                            | rating                    | int           | not null, '1-5 stars', index                                                         |
|                            | review_text               | text          |                                                                                      |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
|                            | updated_at                | timestamp     |                                                                                      |
| support_tickets            | ticket_id                 | varchar(36)   | PK                                                                                   |
|                            | user_id                   | varchar(36)   | not null, FK → users.user_id, index                                                  |
|                            | subject                   | varchar(200)  | not null                                                                             |
|                            | description               | text          | not null                                                                             |
|                            | ticket_status             | enum          | default: 'open', 'open, in_progress, resolved, closed', index                        |
|                            | priority                  | enum          | default: 'medium', 'low, medium, high, urgent'                                       |
|                            | assigned_to               | varchar(36)   |                                                                                      |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
|                            | updated_at                | timestamp     |                                                                                      |
|                            | resolved_at               | timestamp     |                                                                                      |
| audit_logs                 | log_id                    | varchar(36)   | PK                                                                                   |
|                            | user_id                   | varchar(36)   | FK → users.user_id, index                                                            |
|                            | action_type               | varchar(50)   | not null                                                                             |
|                            | entity_type               | varchar(50)   | not null                                                                             |
|                            | entity_id                 | varchar(36)   |                                                                                      |
|                            | old_values                | json          |                                                                                      |
|                            | new_values                | json          |                                                                                      |
|                            | ip_address                | varchar(45)   |                                                                                      |
|                            | user_agent                | text          |                                                                                      |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP, index                                                    |
| admin_portal               | admin_id                  | varchar(36)   | PK                                                                                   |
|                            | username                  | varchar(100)  | unique, not null, index                                                              |
|                            | password_hash             | varchar(255)  | not null                                                                             |
|                            | email                     | varchar(100)  | unique, not null, index                                                              |
|                            | phone_number              | varchar(20)   |                                                                                      |
|                            | is_active                 | boolean       | default: true, index                                                                 |
|                            | last_login                | timestamp     |                                                                                      |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
|                            | updated_at                | timestamp     |                                                                                      |
| roles                      | role_id                   | varchar(36)   | PK                                                                                   |
|                            | role_name                 | varchar(50)   | unique, not null, 'parent, driver, superadmin, admin, support'                       |
|                            | description               | text          |                                                                                      |
|                            | created_at                | timestamp     | default: CURRENT_TIMESTAMP                                                           |
|                            | updated_at                | timestamp     |                                                                                      |
| user_roles                 | user_role_id              | varchar(36)   | PK                                                                                   |
|                            | user_id                   | varchar(36)   | not null, FK → users.user_id, index                                                  |
|                            | role_id                   | varchar(36)   | not null, FK → roles.role_id, index                                                  |
|                            | assigned_by               | varchar(36)   | FK → admin_portal.admin_id                                                           |
|                            | assigned_at               | timestamp     | default: CURRENT_TIMESTAMP                                                           |
|                            | is_active                 | boolean       | default: true, index                                                                 |
