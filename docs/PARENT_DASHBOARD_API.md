# Parent Dashboard API Documentation

## Overview
This document describes the API endpoints for the Parent Dashboard including the Home/Landing Screen and Track Trip Screen.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints require JWT authentication. Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

The token must belong to a user with `role: "parent"`.

---

## REST API Endpoints

### 1. Get Parent Profile
Retrieves the authenticated parent's profile information.

**Endpoint:** `GET /parent/profile`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "Springfield",
      "state": "IL",
      "zipCode": "62701",
      "coordinates": {
        "lat": 39.7817,
        "lng": -89.6501
      }
    },
    "role": "parent",
    "emailVerified": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User is not a parent
- `404 Not Found`: Parent profile not found
- `500 Internal Server Error`: Server error

---

### 2. Get Students
Retrieves all students associated with the authenticated parent.

**Endpoint:** `GET /parent/students`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "parentId": "507f1f77bcf86cd799439011",
      "firstName": "Sarah",
      "lastName": "Doe",
      "age": 8,
      "schoolName": "Springfield Elementary",
      "grade": "3rd Grade",
      "pickupLocation": {
        "address": "456 School Rd, Springfield, IL",
        "coordinates": {
          "lat": 39.7900,
          "lng": -89.6550
        }
      },
      "dropoffLocation": {
        "address": "123 Main St, Springfield, IL",
        "coordinates": {
          "lat": 39.7817,
          "lng": -89.6501
        }
      },
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-20T14:30:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User is not a parent
- `500 Internal Server Error`: Server error

---

### 3. Get Today's Trips for a Student
Retrieves all trips scheduled for today for a specific student.

**Endpoint:** `GET /parent/students/:studentId/trips/today`

**URL Parameters:**
- `studentId` (required): The ID of the student

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "studentId": "507f1f77bcf86cd799439012",
      "parentId": "507f1f77bcf86cd799439011",
      "driverId": "507f1f77bcf86cd799439020",
      "vehicleId": "507f1f77bcf86cd799439021",
      "startLocation": {
        "address": "123 Main St, Springfield, IL",
        "coordinates": {
          "lat": 39.7817,
          "lng": -89.6501
        }
      },
      "endLocation": {
        "address": "456 School Rd, Springfield, IL",
        "coordinates": {
          "lat": 39.7900,
          "lng": -89.6550
        }
      },
      "currentLocation": {
        "coordinates": {
          "lat": 39.7850,
          "lng": -89.6520
        },
        "timestamp": "2024-01-22T08:15:30.000Z"
      },
      "scheduledStartTime": "2024-01-22T08:00:00.000Z",
      "actualStartTime": "2024-01-22T08:02:00.000Z",
      "estimatedEndTime": "2024-01-22T08:30:00.000Z",
      "status": "ongoing",
      "distance": 5.2,
      "duration": 1800,
      "notes": "Morning pickup",
      "createdAt": "2024-01-20T10:00:00.000Z",
      "updatedAt": "2024-01-22T08:15:30.000Z"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request`: Missing studentId parameter
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User is not a parent
- `404 Not Found`: Student not found or doesn't belong to parent
- `500 Internal Server Error`: Server error

---

### 4. Get Notifications
Retrieves notifications for the authenticated parent.

**Endpoint:** `GET /parent/notifications`

**Query Parameters:**
- `limit` (optional): Maximum number of notifications to return (e.g., `5`)
- `status` (optional): Filter by status - `unread` or `read`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Examples:**
```
GET /parent/notifications?limit=5&status=unread
GET /parent/notifications?limit=10
GET /parent/notifications?status=read
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "userId": "507f1f77bcf86cd799439011",
      "parentId": "507f1f77bcf86cd799439011",
      "type": "trip_started",
      "title": "Trip Started",
      "message": "Your child's trip has started",
      "relatedEntityType": "trip",
      "relatedEntityId": "507f1f77bcf86cd799439013",
      "status": "unread",
      "priority": "medium",
      "createdAt": "2024-01-22T08:02:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439015",
      "userId": "507f1f77bcf86cd799439011",
      "parentId": "507f1f77bcf86cd799439011",
      "type": "stop_completed",
      "title": "Stop Completed",
      "message": "Your child has been picked up/dropped off",
      "relatedEntityType": "trip",
      "relatedEntityId": "507f1f77bcf86cd799439013",
      "status": "unread",
      "priority": "high",
      "createdAt": "2024-01-22T08:05:00.000Z"
    }
  ]
}
```

**Notification Types:**
- `trip_started`: Trip has begun
- `trip_ended`: Trip has been completed
- `trip_delayed`: Trip is delayed
- `stop_completed`: Student picked up or dropped off
- `alert`: Important alert
- `update`: General update

**Priority Levels:**
- `low`: Low priority
- `medium`: Medium priority
- `high`: High priority

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User is not a parent
- `500 Internal Server Error`: Server error

---

### 5. Get Trip Live Location
Retrieves the current live location of an ongoing trip.

**Endpoint:** `GET /parent/trips/:tripId/live-location`

**URL Parameters:**
- `tripId` (required): The ID of the trip

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "coordinates": {
      "lat": 39.7850,
      "lng": -89.6520
    },
    "timestamp": "2024-01-22T08:15:30.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing tripId parameter
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User is not a parent
- `404 Not Found`: Trip not found or live location not available
- `500 Internal Server Error`: Server error

---

### 6. Get Student Details
Retrieves detailed information about a specific student.

**Endpoint:** `GET /parent/students/:studentId`

**URL Parameters:**
- `studentId` (required): The ID of the student

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "parentId": "507f1f77bcf86cd799439011",
    "firstName": "Sarah",
    "lastName": "Doe",
    "age": 8,
    "schoolName": "Springfield Elementary",
    "grade": "3rd Grade",
    "pickupLocation": {
      "address": "456 School Rd, Springfield, IL",
      "coordinates": {
        "lat": 39.7900,
        "lng": -89.6550
      }
    },
    "dropoffLocation": {
      "address": "123 Main St, Springfield, IL",
      "coordinates": {
        "lat": 39.7817,
        "lng": -89.6501
      }
    },
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-20T14:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing studentId parameter
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User is not a parent
- `404 Not Found`: Student not found or doesn't belong to parent
- `500 Internal Server Error`: Server error

---

### 7. Call Parent
Creates a call request to contact a student's parent. This endpoint can be used by drivers or administrators.

**Endpoint:** `POST /parent/students/:studentId/call-parent`

**URL Parameters:**
- `studentId` (required): The ID of the student

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Need to confirm pickup location"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "callRequest": {
      "_id": "507f1f77bcf86cd799439020",
      "studentId": "507f1f77bcf86cd799439012",
      "parentId": "507f1f77bcf86cd799439011",
      "requestedBy": "507f1f77bcf86cd799439030",
      "requestedAt": "2024-01-22T08:20:00.000Z",
      "reason": "Need to confirm pickup location",
      "status": "pending"
    },
    "phoneNumber": "+1234567890",
    "message": "Call request created successfully"
  }
}
```

**Note:** This endpoint:
- Creates a call request record in the database
- Retrieves the parent's phone number
- Sends a real-time notification to the parent via WebSocket
- Creates a notification in the database

**Error Responses:**
- `400 Bad Request`: Missing studentId parameter
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Student not found
- `500 Internal Server Error`: Server error

---

## WebSocket Events

### Connection
Connect to the WebSocket server with JWT authentication:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: '<access_token>'
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

---

### 1. Trip Location Update
Real-time location updates for ongoing trips.

**Event Name:** `trip:location:changed`

**Client Listens:**
```javascript
socket.on('trip:location:changed', (data) => {
  console.log('Trip location updated:', data);
  // Update map with new coordinates
});
```

**Data Structure:**
```json
{
  "tripId": "507f1f77bcf86cd799439013",
  "coordinates": {
    "lat": 39.7850,
    "lng": -89.6520
  },
  "timestamp": "2024-01-22T08:15:30.000Z"
}
```

**Usage:** Update the trip marker on the map in real-time as the vehicle moves.

---

### 2. Trip Status Changed
Notifies when a trip's status changes (e.g., started, completed, cancelled).

**Event Name:** `trip:status:changed`

**Client Listens:**
```javascript
socket.on('trip:status:changed', (data) => {
  console.log('Trip status changed:', data);
  // Update UI to reflect new status
});
```

**Data Structure:**
```json
{
  "tripId": "507f1f77bcf86cd799439013",
  "status": "ongoing",
  "timestamp": "2024-01-22T08:02:00.000Z"
}
```

**Status Values:**
- `scheduled`: Trip is scheduled
- `ongoing`: Trip is in progress
- `completed`: Trip has been completed
- `cancelled`: Trip has been cancelled

**Usage:** Update trip cards/badges to show current status.

---

### 3. Trip Stop Completed
Notifies when a pickup/dropoff stop has been completed.

**Event Name:** `trip:stop:completed`

**Client Listens:**
```javascript
socket.on('trip:stop:completed', (data) => {
  console.log('Stop completed:', data);
  // Show notification to parent
});
```

**Data Structure:**
```json
{
  "tripId": "507f1f77bcf86cd799439013",
  "studentId": "507f1f77bcf86cd799439012",
  "timestamp": "2024-01-22T08:05:00.000Z"
}
```

**Usage:** Display a notification that the child has been picked up or dropped off.

---

### 4. Trip Approaching
Notifies the parent when the driver is approaching the student's location.

**Event Name:** `trip:approaching`

**Client Listens:**
```javascript
socket.on('trip:approaching', (data) => {
  console.log('Driver approaching:', data);
  // Show prominent notification/alert to parent
  // Display ETA information
});
```

**Data Structure:**
```json
{
  "tripId": "507f1f77bcf86cd799439013",
  "studentId": "507f1f77bcf86cd799439012",
  "estimatedArrival": "2 minutes",
  "timestamp": "2024-01-22T08:20:00.000Z"
}
```

**Server Emits (Driver/System side):**
```javascript
socket.emit('trip:approaching', {
  tripId: '507f1f77bcf86cd799439013',
  studentId: '507f1f77bcf86cd799439012',
  parentId: '507f1f77bcf86cd799439011',
  estimatedArrival: '2 minutes'
});
```

**Usage:** Alert the parent that the driver is close to the pickup/dropoff location so they can prepare.

**Note:** This event also automatically:
- Creates a notification in the database
- Sends a `notification:new` event to the parent

---

### 5. New Notification
Sent when a new notification is created for the parent.

**Event Name:** `notification:new`

**Client Listens:**
```javascript
socket.on('notification:new', (data) => {
  console.log('New notification:', data);
  // Show toast/banner notification
  // Update notification bell badge count
});
```

**Data Structure:**
```json
{
  "title": "Trip Started",
  "message": "Your child's trip has started",
  "type": "trip_started"
}
```

**Usage:** Display real-time notifications to the parent without polling.

---

## Complete Frontend Integration Example

```javascript
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';
const token = localStorage.getItem('accessToken');

// Configure axios
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

function ParentDashboard() {
  const [profile, setProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [trips, setTrips] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Fetch initial data
    fetchDashboardData();

    // Initialize WebSocket
    const socketInstance = io('http://localhost:3000', {
      auth: { token }
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
    });

    socketInstance.on('trip:location:changed', (data) => {
      // Update trip location on map
      updateTripLocation(data.tripId, data.coordinates);
    });

    socketInstance.on('trip:status:changed', (data) => {
      // Update trip status in UI
      updateTripStatus(data.tripId, data.status);
    });

    socketInstance.on('trip:stop:completed', (data) => {
      // Show notification
      showNotification('Stop Completed', 'Your child has been picked up/dropped off');
      // Refresh trips
      fetchTodayTrips(data.studentId);
    });

    socketInstance.on('notification:new', (data) => {
      // Add notification to state
      setNotifications(prev => [data, ...prev]);
      // Show toast notification
      showToast(data.title, data.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch profile
      const profileRes = await api.get('/parent/profile');
      setProfile(profileRes.data.data);

      // Fetch students
      const studentsRes = await api.get('/parent/students');
      setStudents(studentsRes.data.data);

      // Fetch today's trips for first student
      if (studentsRes.data.data.length > 0) {
        const studentId = studentsRes.data.data[0]._id;
        const tripsRes = await api.get(`/parent/students/${studentId}/trips/today`);
        setTrips(tripsRes.data.data);
      }

      // Fetch unread notifications (limit 5)
      const notificationsRes = await api.get('/parent/notifications?limit=5&status=unread');
      setNotifications(notificationsRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchTodayTrips = async (studentId) => {
    try {
      const res = await api.get(`/parent/students/${studentId}/trips/today`);
      setTrips(res.data.data);
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  const updateTripLocation = (tripId, coordinates) => {
    setTrips(prev => prev.map(trip =>
      trip._id === tripId
        ? { ...trip, currentLocation: { coordinates, timestamp: new Date() } }
        : trip
    ));
  };

  const updateTripStatus = (tripId, status) => {
    setTrips(prev => prev.map(trip =>
      trip._id === tripId
        ? { ...trip, status }
        : trip
    ));
  };

  const showNotification = (title, message) => {
    // Implementation depends on your notification library
    console.log(`${title}: ${message}`);
  };

  const showToast = (title, message) => {
    // Implementation depends on your toast library
    console.log(`Toast: ${title} - ${message}`);
  };

  return (
    <div className="dashboard">
      <h1>Welcome, {profile?.firstName}!</h1>

      <section className="students">
        <h2>My Children</h2>
        {students.map(student => (
          <div key={student._id} className="student-card">
            <p>{student.firstName} {student.lastName}</p>
            <p>{student.grade} at {student.schoolName}</p>
          </div>
        ))}
      </section>

      <section className="trips">
        <h2>Today's Trips</h2>
        {trips.map(trip => (
          <div key={trip._id} className="trip-card">
            <p>Status: {trip.status}</p>
            <p>Scheduled: {new Date(trip.scheduledStartTime).toLocaleTimeString()}</p>
            {trip.currentLocation && (
              <p>Current Location: {trip.currentLocation.coordinates.lat}, {trip.currentLocation.coordinates.lng}</p>
            )}
          </div>
        ))}
      </section>

      <section className="notifications">
        <h2>Notifications ({notifications.length})</h2>
        {notifications.map(notif => (
          <div key={notif._id} className="notification-item">
            <strong>{notif.title}</strong>
            <p>{notif.message}</p>
            <small>{new Date(notif.createdAt).toLocaleString()}</small>
          </div>
        ))}
      </section>
    </div>
  );
}

export default ParentDashboard;
```

---

## Testing with Postman/cURL

### Get Parent Profile
```bash
curl -X GET http://localhost:3000/api/parent/profile \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json"
```

### Get Students
```bash
curl -X GET http://localhost:3000/api/parent/students \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json"
```

### Get Today's Trips
```bash
curl -X GET http://localhost:3000/api/parent/students/507f1f77bcf86cd799439012/trips/today \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json"
```

### Get Unread Notifications
```bash
curl -X GET "http://localhost:3000/api/parent/notifications?limit=5&status=unread" \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json"
```

### Get Trip Live Location
```bash
curl -X GET http://localhost:3000/api/parent/trips/507f1f77bcf86cd799439013/live-location \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json"
```

### Get Student Details
```bash
curl -X GET http://localhost:3000/api/parent/students/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json"
```

### Call Parent
```bash
curl -X POST http://localhost:3000/api/parent/students/507f1f77bcf86cd799439012/call-parent \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Need to confirm pickup location"
  }'
```

---

## Environment Variables

Make sure the following environment variables are configured in your `.env.dev` file:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017
DB_NAME=ping_parent
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User doesn't have required permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

---

## Next Steps

1. **Create seed data**: Add sample parents, students, and trips to your database for testing
2. **Test WebSocket connections**: Use a WebSocket client to verify real-time updates
3. **Implement frontend**: Use the example code above as a starting point
4. **Add error boundaries**: Implement proper error handling in your frontend
5. **Set up monitoring**: Add logging and monitoring for production

---

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
