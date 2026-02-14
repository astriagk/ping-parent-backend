# Test Accounts for Ping Parent

**Version:** 1.0.0  
**Last Updated:** February 1, 2026

---

## Quick Reference: Test Accounts Table

### 🔐 Admin Accounts

| Role          | Username        | Email                  | Password         | Phone           | Status | Notes                     |
| ------------- | --------------- | ---------------------- | ---------------- | --------------- | ------ | ------------------------- |
| Super Admin   | `admin_super`   | admin@pingparent.com   | `Admin@123456`   | +91 98765 43210 | Active | Full system access        |
| Support Admin | `admin_support` | support@pingparent.com | `Support@123456` | +91 98765 43211 | Active | Limited access, view only |

---

### 👨‍👩‍👧 Parent Accounts

| Name         | Phone           | Email                   | Password        | OTP    | Students      | Subscription | Status | Notes      |
| ------------ | --------------- | ----------------------- | --------------- | ------ | ------------- | ------------ | ------ | ---------- |
| Rajesh Kumar | +91 98765 43220 | rajesh.kumar@parent.com | `Parent@123456` | 123456 | Aditya, Priya | Monthly      | Active | 2 children |
| Priya Sharma | +91 98765 43221 | priya.sharma@parent.com | `Parent@123456` | 123456 | Isha          | Quarterly    | Active | 1 child    |
| Vikram Patel | +91 98765 43222 | vikram.patel@parent.com | `Parent@123456` | 123456 | Arjun, Neha   | Monthly      | Active | 2 children |

**Parent Login (OTP Method):**

```json
{
  "phone_number": "+91 98765 43220",
  "otp_code": "123456"
}
```

---

### 👨‍🎓 Student Accounts

| Name         | Phone           | Email                    | Parent       | Grade | School                  | Status | Roll Number |
| ------------ | --------------- | ------------------------ | ------------ | ----- | ----------------------- | ------ | ----------- |
| Aditya Kumar | +91 98765 43230 | aditya.kumar@student.com | Rajesh Kumar | 5th   | Bangalore Public School | Active | BPS-001     |
| Priya Kumar  | +91 98765 43231 | priya.kumar@student.com  | Rajesh Kumar | 7th   | Bangalore Public School | Active | BPS-002     |
| Isha Sharma  | +91 98765 43232 | isha.sharma@student.com  | Priya Sharma | 4th   | Whitefield Academy      | Active | WFA-001     |
| Arjun Patel  | +91 98765 43233 | arjun.patel@student.com  | Vikram Patel | 6th   | Bangalore Public School | Active | BPS-003     |
| Neha Patel   | +91 98765 43234 | neha.patel@student.com   | Vikram Patel | 3rd   | Whitefield Academy      | Active | WFA-002     |

---

### 🚗 Driver Accounts

| Name         | Phone           | Email                   | Password        | License #   | Vehicle       | School                  | Status | Documents  |
| ------------ | --------------- | ----------------------- | --------------- | ----------- | ------------- | ----------------------- | ------ | ---------- |
| Suresh Kumar | +91 98765 43240 | suresh.kumar@driver.com | `Driver@123456` | DL-2024-001 | KA-05-AB-1234 | Bangalore Public School | Active | Verified ✓ |
| Anjali Reddy | +91 98765 43241 | anjali.reddy@driver.com | `Driver@123456` | DL-2024-002 | KA-05-CD-5678 | Whitefield Academy      | Active | Verified ✓ |
| Mohan Singh  | +91 98765 43242 | mohan.singh@driver.com  | `Driver@123456` | DL-2024-003 | KA-05-EF-9012 | Bangalore Public School | Active | Pending    |

**Driver Login:**

```json
{
  "phone_number": "+91 98765 43240",
  "password": "Driver@123456"
}
```

---

### 🏫 School Accounts

| School Name             | Phone           | Email                    | Password        | Principal        | Location             | Status | Admin Type   |
| ----------------------- | --------------- | ------------------------ | --------------- | ---------------- | -------------------- | ------ | ------------ |
| Bangalore Public School | +91 98765 43250 | admin@bangaloreups.com   | `School@123456` | Dr. Rajesh Gupta | 13.0827°N, 80.2707°E | Active | School Admin |
| Whitefield Academy      | +91 98765 43251 | admin@whitefieldacad.com | `School@123456` | Ms. Divya Nair   | 13.1939°N, 80.0319°E | Active | School Admin |
| Richmond Global School  | +91 98765 43252 | admin@richmondglobal.com | `School@123456` | Mr. Arun Verma   | 12.9716°N, 77.5946°E | Active | School Admin |

**School Login:**

```json
{
  "phone_number": "+91 98765 43250",
  "password": "School@123456"
}
```

---

## Common Test Credentials

### Default Passwords

- **Admin:** `Admin@123456`
- **Parent:** `Parent@123456`
- **Student:** `Student@123456`
- **Driver:** `Driver@123456`
- **School:** `School@123456`

### OTP Code (All Parents)

```
123456
```

### Test Coordinates (GPS Locations)

| Location                               | Latitude | Longitude | Notes               |
| -------------------------------------- | -------- | --------- | ------------------- |
| Bangalore Public School (Indiranagar)  | 13.0827  | 80.2707   | School main address |
| Whitefield Academy                     | 13.1939  | 80.0319   | School main address |
| Richmond Global School (JP Nagar)      | 12.9716  | 77.5946   | School main address |
| Parent Home (Rajesh - Indiranagar)     | 13.0835  | 80.2715   | Pickup location     |
| Parent Home (Priya - Whitefield)       | 13.1945  | 80.0325   | Pickup location     |
| Parent Home (Vikram - JP Nagar)        | 12.9720  | 77.5950   | Pickup location     |
| Driver Location (Suresh - Indiranagar) | 13.0830  | 80.2710   | Starting location   |
| Driver Location (Anjali - Whitefield)  | 13.1940  | 80.0320   | Starting location   |

---

## Testing Workflow Sequence

1. **Login as Admin** → Create schools and manage system
2. **Login as School Admin** → Register students and manage routes
3. **Register as Parent** → Add children, addresses, and subscribe
4. **Register as Driver** → Upload documents and set availability
5. **Parent:** Make payment and create assignments
6. **System:** Auto-match drivers based on proximity
7. **Driver:** Accept trip, mark attendance, verify with OTP/QR
8. **Parent:** Track real-time location, submit review

---

## Notes

- ⚠️ **Location Coordinates are MANDATORY** for address operations
- All phone numbers start with `+123456789X` pattern for easy identification
- All test emails use `@parent.com`, `@student.com`, `@driver.com`, `@pingparent.com` domains
- OTP code `123456` works for all parent accounts in test environment
- Use these credentials in Postman collections or API testing tools
- For real-time tracking tests, use the coordinates provided above
