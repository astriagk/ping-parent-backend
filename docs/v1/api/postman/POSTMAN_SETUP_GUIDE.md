# Postman Collection Setup Guide

Complete guide to import and test the Ping Parent API using Postman.

---

## 📦 Files to Import

1. **Collection File:** `Ping_Parent_API.postman_collection.json`
2. **Environment File:** `Ping_Parent_Environment.postman_environment.json`

Both files are located in the `docs/v1/api/postman/` folder:
- Collection: `docs/v1/api/postman/collections/Ping_Parent_API.postman_collection.json`
- Environment: `docs/v1/api/postman/environments/Ping_Parent_Environment.postman_environment.json`

---

## 🚀 Quick Start

### Step 1: Import Collection

1. Open **Postman**
2. Click **Import** button (top left)
3. Drag and drop `Ping_Parent_API.postman_collection.json` OR click "Upload Files"
4. Click **Import**
5. You should see "Ping Parent API - Complete Collection" in your Collections

### Step 2: Import Environment

1. Click the **Environments** tab (left sidebar)
2. Click **Import** button
3. Drag and drop `Ping_Parent_Environment.postman_environment.json`
4. Click **Import**
5. You should see "Ping Parent - Local Environment"

### Step 3: Select Environment

1. Click the **environment dropdown** in the top-right corner
2. Select **"Ping Parent - Local Environment"**
3. The environment is now active (you'll see it highlighted)

---

## 🧪 Testing Workflow

### Option 1: Quick Test (Recommended for First Time)

Follow this order to test the complete flow:

#### **A. Admin Setup (First Time Only)**

1. **Admin Portal APIs** → **Admin Login**
   - Username: `admin_super`
   - Password: `Admin@123456`
   - ✅ Token saved automatically to `ADMIN_TOKEN`

2. **School APIs** → **Create School (Admin - WITH COORDINATES)**
   - Creates Springfield Elementary with GPS coordinates
   - ✅ School ID saved to `SCHOOL1_ID`

#### **B. Parent Registration & Setup**

3. **Authentication** → **Register - Send OTP (Parent)**
   - Sends OTP to +1234567890
   - ✅ Check response for success

4. **Authentication** → **Register - Verify OTP (Parent)**
   - Verifies OTP: 123456
   - ✅ Token auto-saved to `PARENT1_TOKEN`
   - ✅ User ID saved to `PARENT1_ID`

5. **Parent APIs** → **Update Parent Profile**
   - Updates email and alternate phone
   - ✅ Profile updated

6. **Parent APIs** → **Update Parent Address (WITH COORDINATES)**
   - **IMPORTANT:** Includes GPS coordinates (40.7128, -74.0060)
   - ✅ Address saved with location

7. **Student APIs** → **Add New Student**
   - Creates Emily Johnson (STU001)
   - ✅ Student ID saved to `STUDENT1_ID`

#### **C. Driver Registration & Setup**

8. **Authentication** → **Register - Send OTP (Driver)**
   - Sends OTP to +1234567893

9. **Authentication** → **Register - Verify OTP (Driver)**
   - ✅ Token auto-saved to `DRIVER1_TOKEN`
   - ✅ User ID saved to `DRIVER1_ID`

10. **Driver APIs** → **Create Driver Profile**
    - Creates profile with vehicle details
    - ✅ Profile created

11. **Driver APIs** → **Create/Update Driver Address (WITH COORDINATES)**
    - **IMPORTANT:** Includes GPS coordinates (40.7200, -74.0100)
    - ✅ Address saved with location

12. **Driver APIs** → **Upload Driver Documents**
    - Uploads license document
    - ✅ Document uploaded

13. **Driver APIs** → **Set Driver Availability**
    - Sets driver as available
    - ✅ Availability updated

#### **D. Assignment Flow**

14. **Assignment & Trip APIs** → **Create Driver-Student Assignment**
    - Parent assigns Emily to Jane
    - ✅ Assignment created with status "pending"
    - ✅ Assignment ID saved to `ASSIGNMENT1_ID`

15. **Assignment & Trip APIs** → **Get Pending Assignments (Driver)**
    - Driver views pending requests
    - ✅ Shows 1 pending assignment

16. **Assignment & Trip APIs** → **Approve Assignment (Driver)**
    - Driver approves Emily's assignment
    - ✅ Status changed to "approved"

#### **E. Subscription & Payment**

17. **Subscription & Payment APIs** → **Get All Subscription Plans**
    - ✅ Returns 4 plans

18. **Subscription & Payment APIs** → **Subscribe to Plan (Parent)**
    - Parent subscribes to Monthly Plan
    - ✅ Subscription ID saved

19. **Subscription & Payment APIs** → **Make Payment**
    - Parent pays $99.99
    - ✅ Payment ID saved

20. **Subscription & Payment APIs** → **Complete Payment**
    - Completes payment
    - ✅ Payment status: completed

#### **F. Trip & Attendance**

21. **Assignment & Trip APIs** → **Create Trip (Driver)**
    - Driver creates morning pickup trip
    - ✅ Trip ID saved to `TRIP1_ID`

22. **Attendance & QR/OTP APIs** → **Generate QR/OTP**
    - System generates QR code and OTP for Emily
    - ✅ OTP auto-saved to `GENERATED_OTP`

23. **Assignment & Trip APIs** → **Start Trip (Update Status)**
    - Driver starts the trip
    - ✅ Status: in_progress

24. **Attendance & QR/OTP APIs** → **Verify QR/OTP**
    - Driver scans QR code
    - ✅ Verification successful

25. **Attendance & QR/OTP APIs** → **Mark Student Attendance**
    - Marks Emily as present
    - ✅ Attendance recorded

26. **Attendance & QR/OTP APIs** → **Record Pickup (WITH GPS)**
    - **IMPORTANT:** Records pickup with GPS location
    - ✅ Pickup time and location saved

27. **Assignment & Trip APIs** → **Complete Trip**
    - Driver completes the trip
    - ✅ Status: completed

#### **G. Reviews**

28. **Ratings & Reviews APIs** → **Submit Rating/Review**
    - Parent submits 4.5-star review
    - ✅ Review saved

29. **Ratings & Reviews APIs** → **Get Driver Rating (Public)**
    - ✅ Shows driver's average rating

---

### Option 2: Test Individual Modules

You can test modules independently:

#### **Authentication Module**
- Send OTP → Verify OTP → Login → Verify Token → Logout

#### **Parent Module**
- Register → Update Profile → Add Address (GPS) → Add Students

#### **Driver Module**
- Register → Create Profile → Add Address (GPS) → Upload Docs → Set Availability

#### **Assignment Module**
- Create Assignment → View Pending → Approve/Reject

#### **Trip Module**
- Create Trip → Start → Mark Attendance → Record Pickup → Complete

#### **Payment Module**
- View Plans → Subscribe → Make Payment → View History

---

## 🔑 Important Environment Variables

### Automatically Populated (During Tests)

| Variable | Description | Auto-Saved By |
|----------|-------------|---------------|
| `PARENT1_TOKEN` | Parent 1 JWT token | Register/Login request |
| `PARENT1_ID` | Parent 1 user ID | Register request |
| `DRIVER1_TOKEN` | Driver 1 JWT token | Register/Login request |
| `DRIVER1_ID` | Driver 1 user ID | Register request |
| `ADMIN_TOKEN` | Admin JWT token | Admin login request |
| `STUDENT1_ID` | Student 1 ID | Add student request |
| `SCHOOL1_ID` | School 1 ID | Create school request |
| `ASSIGNMENT1_ID` | Assignment ID | Create assignment request |
| `TRIP1_ID` | Trip ID | Create trip request |
| `SUBSCRIPTION1_ID` | Subscription ID | Subscribe request |
| `PAYMENT1_ID` | Payment ID | Make payment request |
| `GENERATED_OTP` | Generated OTP for trips | Generate QR/OTP request |

### Pre-configured (Ready to Use)

| Variable | Value | Description |
|----------|-------|-------------|
| `BASE_URL` | `http://localhost:3000/api` | API base URL |
| `TEST_OTP` | `123456` | Default OTP for testing |
| `PARENT1_PHONE` | `+1234567890` | Parent 1 phone number |
| `PARENT1_LAT` | `40.7128` | Parent 1 latitude |
| `PARENT1_LNG` | `-74.0060` | Parent 1 longitude |
| `DRIVER1_PHONE` | `+1234567893` | Driver 1 phone number |
| `DRIVER1_LAT` | `40.7200` | Driver 1 latitude |
| `DRIVER1_LNG` | `-74.0100` | Driver 1 longitude |
| `SCHOOL1_LAT` | `40.7589` | School 1 latitude |
| `SCHOOL1_LNG` | `-73.9851` | School 1 longitude |
| `PLAN1_ID` | `PLAN001` | Monthly plan ID |

---

## 📋 Collection Structure

```
Ping Parent API - Complete Collection
│
├── 01. Authentication & User Management (11 requests)
│   ├── Get All Roles
│   ├── Register - Send OTP (Parent)
│   ├── Register - Verify OTP (Parent)
│   ├── Register - Send OTP (Driver)
│   ├── Register - Verify OTP (Driver)
│   ├── Login - Send OTP
│   ├── Login - Verify OTP
│   ├── Verify Token
│   ├── Logout
│   ├── Get All Users (Admin)
│   ├── Activate User (Admin)
│   └── Deactivate User (Admin)
│
├── 02. Parent APIs (4 requests)
│   ├── Get Parent Profile
│   ├── Update Parent Profile
│   ├── Get Parent Address
│   └── Update Parent Address (WITH COORDINATES) ⚠️
│
├── 03. Driver APIs (9 requests)
│   ├── Get Driver Profile
│   ├── Create Driver Profile
│   ├── Update Driver Profile
│   ├── Set Driver Availability
│   ├── Get Driver Address
│   ├── Create/Update Driver Address (WITH COORDINATES) ⚠️
│   ├── Get Driver Documents
│   ├── Upload Driver Documents
│   └── Update Driver Documents
│
├── 04. Student APIs (7 requests)
│   ├── Add New Student
│   ├── Get All My Students
│   ├── Get Active Students
│   ├── Get Student Details by ID
│   ├── Update Student
│   ├── Delete Student
│   └── Get Student by Student ID
│
├── 05. School APIs (5 requests)
│   ├── Get All Schools
│   ├── Get School Details
│   ├── Create School (Admin - WITH COORDINATES) ⚠️
│   ├── Update School (Admin)
│   └── Delete School (Admin)
│
├── 06. Assignment & Trip APIs (11 requests)
│   ├── Create Driver-Student Assignment
│   ├── Get Assignment Details
│   ├── Get My Assignments (Driver)
│   ├── Get Pending Assignments (Driver)
│   ├── Approve Assignment (Driver)
│   ├── Reject Assignment (Driver)
│   ├── Create Trip (Driver)
│   ├── Get My Trips (Driver)
│   ├── Get Trips by Date
│   ├── Start Trip (Update Status)
│   └── Complete Trip
│
├── 07. Attendance & QR/OTP APIs (7 requests)
│   ├── Generate QR/OTP
│   ├── Get QR/OTP for Student Trip
│   ├── Verify QR/OTP
│   ├── Mark Student Attendance
│   ├── Record Pickup (WITH GPS) ⚠️
│   ├── Record Drop (WITH GPS) ⚠️
│   └── Get Trip Students
│
├── 08. Notification APIs (5 requests)
│   ├── Get All Notifications
│   ├── Get Unread Notifications
│   ├── Get Unread Count
│   ├── Mark Notification as Read
│   └── Mark All as Read
│
├── 09. Subscription & Payment APIs (7 requests)
│   ├── Get All Subscription Plans
│   ├── Subscribe to Plan (Parent)
│   ├── Get My Subscriptions
│   ├── Get Active Subscription
│   ├── Make Payment
│   ├── Complete Payment
│   └── Get Payment History
│
├── 10. Ratings & Reviews APIs (4 requests)
│   ├── Submit Rating/Review
│   ├── Get My Reviews
│   ├── Get Driver Reviews (Public)
│   └── Get Driver Rating (Public)
│
├── 11. Admin Portal APIs (4 requests)
│   ├── Admin Login
│   ├── Get All Admins
│   ├── Get All Users (Admin)
│   └── Get Audit Logs
│
└── 12. Role Management (2 requests)
    ├── Get All Roles
    └── Create Role
```

**Total: 76 API requests**

---

## 🧪 Automated Tests

The collection includes automated test scripts that:

### Auto-Save Tokens
```javascript
// Example: After login, token is automatically saved
var jsonData = pm.response.json();
if (jsonData.data && jsonData.data.token) {
    pm.environment.set("PARENT1_TOKEN", jsonData.data.token);
}
```

### Auto-Save IDs
```javascript
// Example: After creating a student, ID is saved
var jsonData = pm.response.json();
if (jsonData.data && jsonData.data._id) {
    pm.environment.set("STUDENT1_ID", jsonData.data._id);
}
```

### Validate Responses
```javascript
// Example: Check if address has coordinates
pm.test("Address has coordinates", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.coordinates).to.exist;
    pm.expect(jsonData.data.coordinates.latitude).to.eql(40.7128);
});
```

---

## ⚠️ Critical: GPS Coordinates

### Requests that REQUIRE Coordinates

The following requests **MUST** include GPS coordinates:

1. **Update Parent Address**
   ```json
   {
     "coordinates": {
       "latitude": 40.7128,
       "longitude": -74.0060
     }
   }
   ```

2. **Create/Update Driver Address**
   ```json
   {
     "coordinates": {
       "latitude": 40.7200,
       "longitude": -74.0100
     }
   }
   ```

3. **Create School (Admin)**
   ```json
   {
     "address": {
       "coordinates": {
         "latitude": 40.7589,
         "longitude": -73.9851
       }
     }
   }
   ```

4. **Record Pickup**
   ```json
   {
     "location": {
       "latitude": 40.7128,
       "longitude": -74.0060
     }
   }
   ```

5. **Record Drop**
   ```json
   {
     "location": {
       "latitude": 40.7589,
       "longitude": -73.9851
     }
   }
   ```

### Why Coordinates are Mandatory

- ✅ Route optimization and planning
- ✅ Distance calculations
- ✅ Proximity-based driver matching
- ✅ Real-time GPS tracking
- ✅ Location verification during pickup/drop
- ✅ Parent-Driver distance validation

**Without coordinates, the application will reject the request.**

---

## 🔧 Troubleshooting

### Issue: "Unauthorized" Error

**Solution:**
1. Check if you have a valid token
2. Click on the request → **Authorization** tab
3. Ensure "Bearer Token" is selected
4. Token should be `{{PARENT1_TOKEN}}`, `{{DRIVER1_TOKEN}}`, or `{{ADMIN_TOKEN}}`
5. Make sure the environment is selected (top-right dropdown)

### Issue: "Validation Error: coordinates required"

**Solution:**
1. Ensure your request body includes coordinates
2. Check the format:
   ```json
   {
     "coordinates": {
       "latitude": 40.7128,
       "longitude": -74.0060
     }
   }
   ```
3. Verify latitude is between -90 and 90
4. Verify longitude is between -180 and 180

### Issue: Variables not saving automatically

**Solution:**
1. Go to **Collections** → Right-click on "Ping Parent API" → **Edit**
2. Go to **Tests** tab
3. Ensure test scripts are present
4. Make sure environment is selected

### Issue: "School not found" when adding student

**Solution:**
1. Run **Admin Login** first to get admin token
2. Run **Create School** to create SCH001
3. Then add students

### Issue: OTP not working

**Solution:**
1. For testing, OTP is hardcoded as `123456`
2. Check `TEST_OTP` variable in environment
3. Make sure you're using the correct phone number from environment

---

## 📊 Test Data Reference

### Quick Copy-Paste

**Admin Login:**
```json
{
  "username": "admin_super",
  "password": "Admin@123456"
}
```

**Parent 1 Registration:**
```json
{
  "phone": "+1234567890",
  "otp": "123456",
  "name": "John Doe",
  "email": "john.doe@parent.com"
}
```

**Parent 1 Address (WITH COORDINATES):**
```json
{
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "coordinates": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

**Driver 1 Registration:**
```json
{
  "phone": "+1234567893",
  "otp": "123456",
  "name": "Jane Smith",
  "email": "jane.smith@driver.com"
}
```

**Student 1:**
```json
{
  "student_id": "STU001",
  "name": "Emily Johnson",
  "school_id": "SCH001",
  "grade": "5th Grade",
  "section": "A",
  "age": 10,
  "gender": "female"
}
```

---

## 🌐 Changing Environment (Local → Staging → Production)

1. Click **Environments** in left sidebar
2. Duplicate "Ping Parent - Local Environment"
3. Rename to "Ping Parent - Staging"
4. Change `BASE_URL` to staging URL:
   ```
   https://staging-api.pingparent.com/api
   ```
5. Save
6. Select the new environment from dropdown

---

## 📝 Running Collection with Newman (CLI)

### Install Newman

```bash
npm install -g newman
```

### Run Entire Collection

```bash
newman run Ping_Parent_API.postman_collection.json \
  -e Ping_Parent_Environment.postman_environment.json
```

### Run Specific Folder

```bash
newman run Ping_Parent_API.postman_collection.json \
  -e Ping_Parent_Environment.postman_environment.json \
  --folder "01. Authentication & User Management"
```

### Generate HTML Report

```bash
newman run Ping_Parent_API.postman_collection.json \
  -e Ping_Parent_Environment.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export newman-report.html
```

---

## ✅ Checklist Before Testing

- [ ] Postman installed (latest version)
- [ ] Collection imported
- [ ] Environment imported
- [ ] Environment selected (check top-right dropdown)
- [ ] Backend server running on `http://localhost:3000`
- [ ] Database connected and running
- [ ] Redis running (for OTP)
- [ ] Admin account exists in database
- [ ] Ready to test!

---

## 🎯 Success Criteria

After running all requests in order, you should have:

✅ Admin logged in
✅ School created with coordinates
✅ Parent registered with profile and address (GPS)
✅ Driver registered with profile and address (GPS)
✅ Driver documents uploaded
✅ Student added
✅ Assignment created and approved
✅ Subscription purchased
✅ Payment completed
✅ Trip created and completed
✅ Attendance marked with GPS verification
✅ Review submitted

---

## 📚 Additional Resources

- **API Documentation:** See [API_DOCUMENTATION.md](../API_DOCUMENTATION.md)
- **Testing Data:** See [TESTING_DATA.md](../TESTING_DATA.md)
- **Swagger UI:** `http://localhost:3000/api-docs`
- **Swagger Documentation:** See [swagger.yaml](../openapi/swagger.yaml)

---

## 🆘 Support

For issues or questions:
- Email: dev-team@pingparent.com
- Check API logs for detailed error messages
- Verify environment variables are set correctly
- Ensure backend server is running

---

**Happy Testing! 🚀**
