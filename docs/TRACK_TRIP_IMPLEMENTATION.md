# Track Trip Screen - Implementation Summary

## Overview
This document summarizes the implementation of the Track Trip Screen APIs for the Ping Parent application.

## Implemented Endpoints

### 1. GET /api/parent/trips/:tripId/live-location
**Purpose:** Get the current real-time location of an ongoing trip

**Features:**
- Returns current GPS coordinates and timestamp
- Validates that the trip belongs to the authenticated parent
- Returns 404 if location data is not available

**File:** [src/controllers/parent.controller.ts](src/controllers/parent.controller.ts#L140-L188)

**Usage:**
```javascript
const response = await fetch(
  `http://localhost:3000/api/parent/trips/${tripId}/live-location`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
const { data } = await response.json();
// data.coordinates.lat, data.coordinates.lng
```

---

### 2. GET /api/parent/students/:studentId
**Purpose:** Get detailed information about a specific student

**Features:**
- Returns full student profile including pickup/dropoff locations
- Validates parent ownership
- Used in track trip screen to display student information

**File:** [src/controllers/parent.controller.ts](src/controllers/parent.controller.ts#L190-L229)

**Usage:**
```javascript
const response = await fetch(
  `http://localhost:3000/api/parent/students/${studentId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
const { data } = await response.json();
// data contains student details with locations
```

---

### 3. POST /api/parent/students/:studentId/call-parent
**Purpose:** Initiate a call request to the student's parent

**Features:**
- Creates a call request record
- Retrieves parent's phone number
- Sends real-time notification via WebSocket
- Creates persistent notification in database
- Can be used by drivers or administrators

**File:** [src/controllers/parent.controller.ts](src/controllers/parent.controller.ts#L231-L305)

**Usage:**
```javascript
const response = await fetch(
  `http://localhost:3000/api/parent/students/${studentId}/call-parent`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reason: 'Need to confirm pickup location'
    })
  }
);
const { data } = await response.json();
// data.phoneNumber contains parent's phone
// data.callRequest contains the request record
```

---

## WebSocket Events

### 1. trip:location:update (Client → Server)
**Purpose:** Driver/system sends location updates during trip

**Emit from driver/system:**
```javascript
socket.emit('trip:location:update', {
  tripId: '507f1f77bcf86cd799439013',
  coordinates: {
    lat: 39.7850,
    lng: -89.6520
  }
});
```

**Server broadcasts:**
```javascript
// All connected clients receive
socket.on('trip:location:changed', (data) => {
  // Update map marker
  updateTripMarker(data.tripId, data.coordinates);
});
```

---

### 2. trip:approaching (Server → Client)
**Purpose:** Notify parent when driver is approaching student location

**Driver/system emits:**
```javascript
socket.emit('trip:approaching', {
  tripId: '507f1f77bcf86cd799439013',
  studentId: '507f1f77bcf86cd799439012',
  parentId: '507f1f77bcf86cd799439011',
  estimatedArrival: '2 minutes'
});
```

**Parent receives:**
```javascript
socket.on('trip:approaching', (data) => {
  showAlert(`Driver approaching! ETA: ${data.estimatedArrival}`);
  // Play notification sound
  // Show prominent alert
});
```

**Automatic side effects:**
- Creates notification in database
- Sends `notification:new` event to parent
- High priority notification

**File:** [src/services/websocket.service.ts](src/services/websocket.service.ts#L169-L206)

---

### 3. trip:stop:completed (Server → Client)
**Purpose:** Notify when pickup/dropoff is completed

**Usage:**
```javascript
socket.on('trip:stop:completed', (data) => {
  showNotification(`${studentName} has been picked up/dropped off`);
  // Refresh trip status
  fetchTripDetails(data.tripId);
});
```

---

## New Service Files

### communication.service.ts
**Purpose:** Handle call requests and parent communication

**Location:** [src/services/communication.service.ts](src/services/communication.service.ts)

**Key Functions:**
- `createCallParentRequest()` - Creates call request record
- `getParentPhoneNumber()` - Retrieves parent's phone number

**Interface:**
```typescript
export interface CallParentRequest {
  _id?: any;
  studentId: string;
  parentId: string;
  requestedBy: string;
  requestedAt: Date;
  reason?: string;
  status: "pending" | "completed" | "cancelled";
}
```

---

## Updated Files

### 1. trip.service.ts
**Added Function:** `getTripLiveLocation()`

**Location:** [src/services/trip.service.ts](src/services/trip.service.ts#L177-L188)

```typescript
export const getTripLiveLocation = async (
  tripId: string,
  parentId: string
): Promise<{ coordinates: { lat: number; lng: number }; timestamp: Date } | null>
```

---

### 2. parent.controller.ts
**Added Controllers:**
- `getTripLiveLocationController()` - Line 140
- `getStudentDetail()` - Line 190
- `callParent()` - Line 231

**Location:** [src/controllers/parent.controller.ts](src/controllers/parent.controller.ts)

---

### 3. parent.routes.ts
**Added Routes:**
```typescript
router.get("/parent/students/:studentId", verifyParentToken, getStudentDetail);
router.post("/parent/students/:studentId/call-parent", verifyToken_Middleware, callParent);
router.get("/parent/trips/:tripId/live-location", verifyParentToken, getTripLiveLocationController);
```

**Location:** [src/routes/parent.routes.ts](src/routes/parent.routes.ts)

---

### 4. websocket.service.ts
**Added Event Handler:** `trip:approaching`

**Location:** [src/services/websocket.service.ts](src/services/websocket.service.ts#L169-L206)

**Behavior:**
- Validates required fields (tripId, studentId, parentId)
- Emits to specific parent's room
- Creates high-priority notification
- Sends notification:new event

---

## Frontend Integration Example

### Track Trip Screen Component

```javascript
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import io from 'socket.io-client';

function TrackTripScreen({ tripId, studentId }) {
  const [trip, setTrip] = useState(null);
  const [student, setStudent] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    // Fetch initial data
    Promise.all([
      fetch(`/api/parent/trips/${tripId}/live-location`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),

      fetch(`/api/parent/students/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json())
    ]).then(([locationRes, studentRes]) => {
      setLiveLocation(locationRes.data);
      setStudent(studentRes.data);
    });

    // Setup WebSocket
    const socketInstance = io('http://localhost:3000', {
      auth: { token }
    });

    // Listen for location updates
    socketInstance.on('trip:location:changed', (data) => {
      if (data.tripId === tripId) {
        setLiveLocation(data);
      }
    });

    // Listen for approaching notification
    socketInstance.on('trip:approaching', (data) => {
      if (data.tripId === tripId) {
        showAlert(`Driver approaching! ETA: ${data.estimatedArrival}`);
        playNotificationSound();
      }
    });

    // Listen for stop completed
    socketInstance.on('trip:stop:completed', (data) => {
      if (data.tripId === tripId) {
        showNotification('Pickup/Dropoff completed!');
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [tripId, studentId]);

  const handleCallParent = async () => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(
      `/api/parent/students/${studentId}/call-parent`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'Manual call request from track screen'
        })
      }
    );

    const { data } = await response.json();
    window.location.href = `tel:${data.phoneNumber}`;
  };

  return (
    <div className="track-trip-screen">
      <div className="student-info">
        <h2>{student?.firstName} {student?.lastName}</h2>
        <p>{student?.grade} at {student?.schoolName}</p>
        <button onClick={handleCallParent}>
          📞 Call Parent
        </button>
      </div>

      <MapContainer
        center={[
          liveLocation?.coordinates.lat || 0,
          liveLocation?.coordinates.lng || 0
        ]}
        zoom={15}
        style={{ height: '500px' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {liveLocation && (
          <Marker position={[
            liveLocation.coordinates.lat,
            liveLocation.coordinates.lng
          ]}>
            <Popup>
              Current Location<br />
              Last updated: {new Date(liveLocation.timestamp).toLocaleTimeString()}
            </Popup>
          </Marker>
        )}

        {student?.pickupLocation && (
          <Marker position={[
            student.pickupLocation.coordinates.lat,
            student.pickupLocation.coordinates.lng
          ]}>
            <Popup>Pickup: {student.pickupLocation.address}</Popup>
          </Marker>
        )}

        {student?.dropoffLocation && (
          <Marker position={[
            student.dropoffLocation.coordinates.lat,
            student.dropoffLocation.coordinates.lng
          ]}>
            <Popup>Dropoff: {student.dropoffLocation.address}</Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="location-info">
        <p>Last Updated: {liveLocation?.timestamp ?
          new Date(liveLocation.timestamp).toLocaleString() :
          'No data'
        }</p>
      </div>
    </div>
  );
}

export default TrackTripScreen;
```

---

## Testing Guide

### 1. Test Live Location Endpoint

```bash
# First, get a trip ID from today's trips
curl -X GET "http://localhost:3000/api/parent/students/STUDENT_ID/trips/today" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Then get live location
curl -X GET "http://localhost:3000/api/parent/trips/TRIP_ID/live-location" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test Student Details

```bash
curl -X GET "http://localhost:3000/api/parent/students/STUDENT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Call Parent

```bash
curl -X POST "http://localhost:3000/api/parent/students/STUDENT_ID/call-parent" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Testing call functionality"}'
```

### 4. Test WebSocket Events

Use a WebSocket testing tool or create a simple test client:

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_TOKEN' }
});

socket.on('connect', () => {
  console.log('Connected!');

  // Simulate location update
  socket.emit('trip:location:update', {
    tripId: 'TRIP_ID',
    coordinates: { lat: 39.7850, lng: -89.6520 }
  });

  // Simulate approaching
  socket.emit('trip:approaching', {
    tripId: 'TRIP_ID',
    studentId: 'STUDENT_ID',
    parentId: 'PARENT_ID',
    estimatedArrival: '2 minutes'
  });
});

socket.on('trip:location:changed', (data) => {
  console.log('Location updated:', data);
});

socket.on('trip:approaching', (data) => {
  console.log('Driver approaching:', data);
});
```

---

## API Endpoint Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/parent/trips/:tripId/live-location` | GET | Get current trip location |
| `/api/parent/students/:studentId` | GET | Get student details |
| `/api/parent/students/:studentId/call-parent` | POST | Request call to parent |

---

## WebSocket Events Summary

| Event Name | Direction | Purpose |
|------------|-----------|---------|
| `trip:location:update` | Client → Server | Send location update |
| `trip:location:changed` | Server → Client | Broadcast location change |
| `trip:approaching` | Server → Client | Notify driver approaching |
| `trip:stop:completed` | Server → Client | Notify stop completed |

---

## Next Steps

1. **Create seed data:**
   - Add sample trips with location data
   - Create test students with locations
   - Link trips to students and parents

2. **Test real-time updates:**
   - Simulate driver movement
   - Test approaching notifications
   - Verify location updates on map

3. **Implement frontend:**
   - Build map component with markers
   - Add real-time location tracking
   - Implement call parent button
   - Show approaching alerts

4. **Add geofencing (future):**
   - Calculate distance to destination
   - Auto-trigger approaching when within radius
   - ETA calculation based on traffic

5. **Performance optimization:**
   - Throttle location updates
   - Use Redis for caching current locations
   - Implement location history pruning

---

## Complete API Documentation

For full API documentation including all endpoints and examples, see:
- [PARENT_DASHBOARD_API.md](PARENT_DASHBOARD_API.md)
