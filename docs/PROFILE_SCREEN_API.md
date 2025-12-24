# Profile Screen API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints require JWT authentication:
```
Authorization: Bearer <access_token>
```

---

## Endpoints

### 1. Get Parent Profile
**GET** `/parent/profile`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "profileImageUrl": "https://example.com/images/profile.jpg",
    "role": "parent",
    "emailVerified": true,
    "phoneVerified": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errors:**
- `401` - User not authenticated
- `404` - Parent profile not found
- `500` - Failed to fetch parent profile

---

### 2. Update Parent Profile
**PUT** `/parent/profile`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "profileImageUrl": "https://example.com/images/profile.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "profileImageUrl": "https://example.com/images/profile.jpg",
    "role": "parent",
    "emailVerified": true,
    "phoneVerified": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Profile updated successfully"
}
```

**Errors:**
- `400` - No updates provided
- `401` - User not authenticated
- `404` - Parent profile not found or no changes made
- `500` - Failed to update parent profile

---

### 3. Get Parent Address
**GET** `/parent/address`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "street": "22, 1st cross",
    "city": "Bangalore",
    "state": "KA",
    "zipCode": "560026",
    "coordinates": {
      "lat": 39.7820,
      "lng": -89.6505
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z"
  }
}
```

**Errors:**
- `401` - User not authenticated
- `404` - Address not found
- `500` - Failed to fetch address

---

### 4. Update Parent Address
**PUT** `/parent/address`

**Request Body:**
```json
{
  "street": "22, 1st cross",
  "city": "Bangalore",
  "state": "KA",
  "zipCode": "560026",
  "coordinates": {
    "lat": 39.7820,
    "lng": -89.6505
  }
}
```

**Required:** `street`, `city`, `state`, `zipCode`
**Optional:** `coordinates` (object with `lat` and `lng`)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "street": "22, 1st cross",
    "city": "Bangalore",
    "state": "KA",
    "zipCode": "560026",
    "coordinates": {
      "lat": 39.7820,
      "lng": -89.6505
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z"
  },
  "message": "Address updated successfully"
}
```

**Errors:**
- `400` - Missing required fields (street, city, state, zipCode)
- `401` - User not authenticated
- `500` - Failed to update address

---

### 5. Get Students
**GET** `/parent/students`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "student123",
      "firstName": "Alice",
      "lastName": "Doe",
      "parentId": "507f1f77bcf86cd799439011",
      "grade": "5",
      "school": "Springfield Elementary"
    }
  ]
}
```

**Errors:**
- `401` - User not authenticated
- `500` - Failed to fetch students

---

### 6. Get Student Detail
**GET** `/parent/students/:studentId`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "student123",
    "firstName": "Alice",
    "lastName": "Doe",
    "parentId": "507f1f77bcf86cd799439011",
    "grade": "5",
    "school": "Springfield Elementary"
  }
}
```

**Errors:**
- `400` - Student ID is required
- `401` - User not authenticated
- `404` - Student not found or does not belong to this parent
- `500` - Failed to fetch student details

---

### 7. Get Today's Trips
**GET** `/parent/students/:studentId/trips/today`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "trip123",
      "studentId": "student123",
      "type": "pickup",
      "status": "in_progress",
      "scheduledTime": "2024-01-20T08:00:00.000Z",
      "driverName": "John Driver"
    }
  ]
}
```

**Errors:**
- `400` - Student ID is required
- `401` - User not authenticated
- `404` - Student not found or does not belong to this parent
- `500` - Failed to fetch today's trips

---

### 8. Get Trip Live Location
**GET** `/parent/trips/:tripId/live-location`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tripId": "trip123",
    "currentLocation": {
      "lat": 39.7820,
      "lng": -89.6505
    },
    "lastUpdated": "2024-01-20T08:15:00.000Z",
    "estimatedArrival": "2024-01-20T08:30:00.000Z"
  }
}
```

**Errors:**
- `400` - Trip ID is required
- `401` - User not authenticated
- `404` - Trip not found or Live location not available
- `500` - Failed to fetch trip live location

---

### 9. Get Notifications
**GET** `/parent/notifications`

**Query Parameters:**
- `limit` (optional) - Number of notifications to return
- `status` (optional) - Filter by status: `"unread"` or `"read"`

**Example:** `/parent/notifications?limit=10&status=unread`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "notif123",
      "userId": "507f1f77bcf86cd799439011",
      "type": "alert",
      "title": "Trip Update",
      "message": "Your child's bus is arriving in 5 minutes",
      "status": "unread",
      "priority": "high",
      "createdAt": "2024-01-20T08:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `401` - User not authenticated
- `500` - Failed to fetch notifications

---

### 10. Call Parent Request
**POST** `/parent/students/:studentId/call-parent`

**Request Body:**
```json
{
  "reason": "Emergency pickup required"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "callRequest": {
      "studentId": "student123",
      "parentId": "507f1f77bcf86cd799439011",
      "requestedBy": "driver456",
      "reason": "Emergency pickup required",
      "createdAt": "2024-01-20T08:00:00.000Z"
    },
    "phoneNumber": "+1234567890",
    "message": "Call request created successfully"
  }
}
```

**Errors:**
- `400` - Student ID is required
- `401` - User not authenticated
- `404` - Student not found
- `500` - Failed to create call parent request

---

## Error Response Format

All error responses follow this format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Status Codes
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error
