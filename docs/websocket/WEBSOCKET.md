# WebSocket Real-Time Tracking Documentation

**Version**: 2.0.0  
**Last Updated**: February 3, 2026  
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Connection Setup](#connection-setup)
3. [Complete Flow: Driver to Parent Tracking](#complete-flow-driver-to-parent-tracking)
4. [Driver Events](#driver-events)
5. [Parent Events](#parent-events)
6. [Event Reference](#event-reference)
7. [Room Architecture](#room-architecture)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

WebSocket (Socket.IO) enables **real-time position streaming** without polling.

### Benefits vs REST Polling

| Metric               | REST Polling | WebSocket               |
| -------------------- | ------------ | ----------------------- |
| **Latency**          | 5-10 seconds | < 100ms                 |
| **Requests/hour**    | 720 per user | 1 persistent connection |
| **Server Load**      | High         | Low                     |
| **Battery (Mobile)** | Poor         | Better                  |
| **Bandwidth**        | ~50 KB/trip  | ~3 KB/trip              |

---

## Connection Setup

### Authentication

All connections require JWT authentication:

```javascript
const socket = io("http://localhost:3000", {
  auth: {
    token: "JWT_TOKEN",
    userId: "user_123",
    role: "driver", // or 'parent' or 'admin'
  },
});

socket.on("connect", () => console.log("✓ Connected"));
socket.on("connect_error", (error) => console.error("✗ Error:", error));
socket.on("disconnect", () => console.log("✗ Disconnected"));
```

### Server Auto-initialization

Socket.IO automatically initializes on server startup (no configuration needed).

---

## Independent WebSocket Events (Separate from REST APIs)

### Architecture: Keeping WebSocket & REST Separate

If you want to keep WebSocket and REST APIs completely separate (no mixing):

```
REST APIs (Trip Management)     |  WebSocket Events (Real-time Notifications)
────────────────────────────────┼──────────────────────────────────────
PUT /api/trips/{id}              |  Independent trigger → emit('trip:started')
PATCH /api/trips/{id}/status     |  (No automatic WebSocket from REST)
POST /api/trips/{id}/pickup      |
POST /api/trips/{id}/dropoff     |
                                  |
Called from: Client/Mobile App    |  Called from: Background Job/External Service
Purpose: Persist to database      |  Purpose: Notify subscribers in real-time
```

### When to Use Independent WebSocket Events

| Scenario                        | How                                | Example                                 |
| ------------------------------- | ---------------------------------- | --------------------------------------- |
| **Trip starts (user action)**   | Driver emits directly to WebSocket | `emit('driver:trip_started', {tripId})` |
| **Scheduled trip notification** | Backend sends without REST call    | Cron job emits `trip:started`           |
| **Real-time position updates**  | Driver streams continuously        | `emit('driver:update_position', {...})` |
| **Manual admin trigger**        | Admin dashboard triggers event     | Admin clicks "Notify Driver"            |
| **External system integration** | Third-party service notifies       | GPS tracker emits position              |

---

### How to Call WebSocket Events Independently

#### Option 1: Driver Emits Event Directly (Client-Side)

Driver app initiates WebSocket event WITHOUT making REST API call:

```javascript
// DRIVER APP - Independent WebSocket Event
socket.emit("driver:trip_started", { tripId: "trip_123" }, (response) => {
  console.log("Trip started event sent to parents");
  // No REST API call needed
  // Parents immediately notified via WebSocket
});
```

**When to use**: Driver app controls the event, immediate notification needed

---

#### Option 2: Backend Emits Event on Demand (Server-Side)

Create a separate endpoint/webhook that ONLY broadcasts WebSocket events:

```typescript
// In trip.controller.ts or new tracking.controller.ts
import { TrackingSocketService } from "@modules/tracking/tracking.socket.service";

/**
 * Separate WebSocket-only endpoint
 * Does NOT update database, only broadcasts event
 */
export const broadcastTripStarted = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId, driverId } = req.body;

    // ✅ Only WebSocket, no database update
    TrackingSocketService.broadcastTripStarted(tripId, driverId);

    return res.json({
      success: true,
      message: "Trip started event broadcasted to parents",
    });
  },
);

/**
 * Separate endpoint for each WebSocket event
 */
export const broadcastStudentPickup = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId, studentId, driverId } = req.body;

    TrackingSocketService.broadcastStudentPicked(tripId, driverId, studentId);

    return res.json({
      success: true,
      message: "Student pickup event broadcasted",
    });
  },
);

export const broadcastPositionUpdate = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId, latitude, longitude, speed, heading, accuracy } = req.body;

    TrackingSocketService.broadcastPositionUpdate(tripId, {
      latitude,
      longitude,
      speed,
      heading,
      accuracy,
    });

    return res.json({
      success: true,
      message: "Position update broadcasted",
    });
  },
);
```

**Routes**:

```typescript
// In trip.routes.ts or new tracking.routes.ts

// WebSocket-only event broadcasts (separate from trip management)
router.post("/broadcast/trip-started", broadcastTripStarted);
router.post("/broadcast/student-pickup", broadcastStudentPickup);
router.post("/broadcast/student-dropoff", broadcastStudentDropoff);
router.post("/broadcast/position-update", broadcastPositionUpdate);
router.post("/broadcast/trip-completed", broadcastTripCompleted);
```

**When to use**: Backend triggers event, multiple systems need to broadcast

---

#### Option 3: External Service Triggers WebSocket Event

Use Socket.IO Admin UI or direct socket connection from external service:

```javascript
// External Service (e.g., GPS Tracker, CRM System, Admin Dashboard)
const io = require("socket.io-client");

const socket = io("http://your-backend.com", {
  auth: {
    token: "SERVICE_TOKEN", // Special service token
    userId: "external_service",
    role: "admin",
  },
});

socket.on("connect", () => {
  // Broadcast position from external GPS tracker
  socket.emit("driver:update_position", {
    tripId: "trip_123",
    latitude: 12.9716,
    longitude: 77.5946,
    speed: 45,
  });
});
```

**When to use**: Multiple systems (GPS, CRM, scheduling) trigger events

---

### Independent Event Call Pattern

```
┌──────────────────────────────────────────────────────────────┐
│                    INDEPENDENT WEBSOCKET CALLS              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Source 1: Driver App                                       │
│  ├─ emit('driver:trip_started', {tripId})                   │
│  └─ ✅ Parents notified immediately (no DB needed)          │
│                                                              │
│  Source 2: Backend Broadcast API                            │
│  ├─ POST /broadcast/trip-started {tripId, driverId}        │
│  └─ ✅ Manually trigger notification                        │
│                                                              │
│  Source 3: External Service (GPS Tracker)                   │
│  ├─ emit('driver:update_position', {...})                   │
│  └─ ✅ Position synced from external system                 │
│                                                              │
│  Source 4: Scheduled Job (Cron)                             │
│  ├─ Emit via Socket.IO namespace                            │
│  └─ ✅ Batch notifications at scheduled time               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
         ↓
    ┌────────────────┐
    │  WebSocket     │
    │  Broadcast     │
    │  to Parents    │
    └────────────────┘
         ↓
    ✅ Real-time notification
    (Database update is separate/optional)
```

---

### Code Examples by Source

**Driver App (Client)**:

```javascript
// WebSocket only - no REST call
socket.emit('driver:trip_started', { tripId: 'trip_123' });
socket.emit('driver:student_picked', { tripId, studentId });
socket.emit('driver:update_position', { tripId, latitude, longitude, ... });
```

**Backend Broadcast Endpoint**:

```bash
curl -X POST http://localhost:3000/api/broadcast/trip-started \
  -H "Content-Type: application/json" \
  -d '{"tripId": "trip_123", "driverId": "driver_456"}'
```

**External Service**:

```javascript
// Connect as external service
const socket = io("http://backend.com", { auth: { role: "admin" } });
socket.emit("driver:update_position", { tripId, latitude, longitude });
```

**Cron Job** (if needed):

```typescript
// Every hour, notify all active trips
cron.schedule("0 * * * *", () => {
  const activeTrips = await tripRepository.find({ status: "STARTED" });
  activeTrips.forEach((trip) => {
    TrackingSocketService.broadcastTripStarted(trip._id, trip.driver_id);
  });
});
```

---

## Complete Flow: Driver to Parent Tracking

### 🎯 End-to-End Journey

This section shows the complete flow from driver starting a trip to parents tracking the vehicle in real-time.

#### Phase 1: Trip Initialization

```
1. Driver App Starts Trip
   ↓
2. REST API: POST /api/trips/{tripId}/start
   - Updates trip status to "STARTED"
   - Sends trip:started WebSocket event
   ↓
3. Driver WebSocket: Subscribes to Trip Room
   - socket.emit('driver:subscribe_trip', { tripId })
   - Joins: trip:tripId:driver
```

#### Phase 2: Route Calculation (Choose One Method)

```
Option A: Fast Route (Haversine)
   ↓
   REST API: POST /api/tracking/calculate
   - Body: { tripId, students: [{id, pickupLat, pickupLng}, ...] }
   - Response: { routeGeometry, waypoints, estimatedDistance, estimatedDuration }
   - Calculates distances using Haversine formula
   - Orders students using greedy nearest-neighbor algorithm
   - Generates smooth interpolated coordinates (SLERP)
   - ⏱️ Response time: < 100ms
   ↓
Option B: Accurate Route (TomTom)
   ↓
   REST API: POST /api/tracking/tomtom
   - Body: { tripId, students: [{id, pickupLat, pickupLng}, ...] }
   - Response: { routeGeometry, waypoints, estimatedDistance, estimatedDuration }
   - Uses real road distances via TomTom Matrix API
   - Orders students based on actual travel times
   - Retrieves detailed routing geometry with turns
   - ⏱️ Response time: 1-3 seconds
```

#### Phase 3: Route Broadcasting to Parents

```
Driver calculates route via REST API
   ↓
   Backend broadcasts to all parent watchers:
   - Event: trip:route_updated
   - Data: { tripId, routeGeometry, waypoints, totalDistance, totalDuration }
   ↓
Parents see route on map with all waypoints and student names
```

#### Phase 4: Real-Time Position Streaming

```
Driver sends position every 10-30 seconds:
   ↓
   Driver emits: driver:update_position
   - { tripId, latitude, longitude, speed, heading, accuracy }
   ↓
   Backend validates position (within route corridor)
   - Saves to location_tracking collection
   ↓
   Backend broadcasts to parents:
   - Event: trip:position_update
   - Data: { driverId, latitude, longitude, speed, heading, accuracy, timestamp }
   ↓
Parents see driver's real-time location updating on map
```

#### Phase 5: Student Pickup Events

```
Driver picks up student:
   ↓
   Driver emits: driver:student_picked
   - { tripId, studentId }
   ↓
   REST API: PATCH /api/trips/{tripId}/students/{studentId}/pickup
   - Updates trip_students.picked_up_timestamp
   - Removes student from waypoints (already picked up)
   ↓
   Backend broadcasts to parents:
   - Event: student:picked_up
   - Data: { studentId, studentName, timestamp }
   ↓
Parents see student marked as picked up on the app with notification
```

#### Phase 6: Route Recalculation (If Needed)

```
Driver needs to change route (accident, traffic, etc):
   ↓
   Driver emits: driver:recalculate_route
   OR
   REST API: POST /api/tracking/{tripId}/recalculate
   - Uses driver's current position as new starting point
   - Recalculates optimal sequence from current location
   - Only includes students not yet picked up
   ↓
   Backend broadcasts to parents:
   - Event: trip:route_updated
   - Data: { tripId, routeGeometry, waypoints, newETAs }
   ↓
Parents see updated route with new estimated arrival times
```

#### Phase 7: Student Dropoff Events

```
Driver drops off student:
   ↓
   Driver emits: driver:student_dropped
   - { tripId, studentId }
   ↓
   REST API: PATCH /api/trips/{tripId}/students/{studentId}/dropoff
   - Updates trip_students.dropped_off_timestamp
   - Marks student as completed
   ↓
   Backend broadcasts to parents:
   - Event: student:dropped_off
   - Data: { studentId, studentName, timestamp }
   ↓
Parents see student marked as dropped off
```

#### Phase 8: Trip Completion

```
Driver completes last dropoff:
   ↓
   Driver emits: driver:trip_completed
   - { tripId }
   ↓
   REST API: PATCH /api/trips/{tripId}/end
   - Updates trip status to "COMPLETED"
   - Calculates actual distance and time
   - Finalizes all tracking data
   ↓
   Backend broadcasts to parents:
   - Event: trip:completed
   - Data: { tripId, actualDistance, actualDuration, completedAt }
   ↓
Parents see trip completed with final stats
Driver app ends position streaming
```

---

### 📊 API Sequence Diagram

```
DRIVER                                    BACKEND                            PARENT
  │                                          │                                │
  ├─ Start Trip                              │                                │
  │  └─ REST: PATCH /trips/{id}/start        │                                │
  │     └─ Response: Trip Started            │                                │
  │                                          │                                │
  ├─ WebSocket Connect (JWT)                │                                │
  │  └─ io.connect(url, {auth: {...}})       │                                │
  │     └─ Connected ✓                       │                                │
  │                                          │                                │
  ├─ Subscribe to Trip                       │                                │
  │  └─ emit('driver:subscribe_trip')        │                                │
  │     └─ Joins: trip:id:driver ✓           │                                │
  │                                          │                                │
  ├─ Calculate Route                         │                                │
  │  └─ REST: POST /tracking/calculate       │                                │
  │     └─ Response: RouteData               │                                │
  │                                          ├─ Broadcast: trip:route_updated │
  │                                          │                                ├─ Parent receives route
  │                                          │                                ├─ WebSocket Connect
  │                                          │                                ├─ Subscribe to Trip
  │                                          │                                │
  ├─ Start Position Streaming (every 15s)   │                                │
  │  └─ emit('driver:update_position')       │                                │
  │     {lat, lng, speed, heading, accuracy}│                                │
  │                                          ├─ Save to DB                    │
  │                                          │                                │
  │                                          ├─ Broadcast: trip:position_update
  │                                          │                                ├─ Update map marker
  │                                          │                                │
  ├─ Pickup Student 1                        │                                │
  │  └─ emit('driver:student_picked')        │                                │
  │  └─ REST: PATCH /trips/.../pickup        │                                │
  │                                          ├─ Broadcast: student:picked_up  │
  │                                          │                                ├─ Show notification
  │                                          │                                │
  ├─ (Continue Position Updates)             │                                │
  │  └─ emit('driver:update_position') ...   │                                │
  │     (every 15 seconds)                   │                                │
  │                                          ├─ Broadcast: trip:position_update
  │                                          │                                ├─ Update map
  │                                          │                                │
  ├─ Dropoff Student 1                       │                                │
  │  └─ emit('driver:student_dropped')       │                                │
  │  └─ REST: PATCH /trips/.../dropoff       │                                │
  │                                          ├─ Broadcast: student:dropped_off│
  │                                          │                                ├─ Show notification
  │                                          │                                │
  ├─ (Repeat: Pickup & Dropoff for other students)                           │
  │                                          │                                │
  ├─ Trip Complete                           │                                │
  │  └─ emit('driver:trip_completed')        │                                │
  │  └─ REST: PATCH /trips/{id}/end          │                                │
  │                                          ├─ Broadcast: trip:completed     │
  │                                          │                                ├─ Show completion screen
  │                                          │                                │
  ├─ Disconnect                              │                                │
  └─ Cleanup position stream                 │                                └─ Cleanup


```

---

## Driver Events

### 1. Subscribe to Trip

**Event**: `driver:subscribe_trip`

```javascript
socket.emit("driver:subscribe_trip", { tripId: "trip_123" }, (response) => {
  console.log(response.success ? "✓ Subscribed" : "✗ Failed");
});
```

**What it does**: Joins driver to `trip:tripId:driver` room

---

### 2. Send Position Update

**Event**: `driver:update_position`

```javascript
socket.emit("driver:update_position", {
  tripId: "trip_123",
  latitude: 12.9716,
  longitude: 77.5946,
  speed: 45,
  heading: 180,
  accuracy: 10,
});
```

**Broadcasts**: `trip:position_update` to all parents watching trip

```json
{
  "tripId": "trip_123",
  "driverId": "driver_456",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "speed": 45,
  "heading": 180,
  "accuracy": 10,
  "timestamp": "2024-01-26T10:30:00Z"
}
```

---

### 3. Trip Started

**Event**: `driver:trip_started`

```javascript
socket.emit("driver:trip_started", { tripId: "trip_123" });
```

**Broadcasts**: `trip:started` event to parents

---

### 4. Trip Completed

**Event**: `driver:trip_completed`

```javascript
socket.emit("driver:trip_completed", { tripId: "trip_123" });
```

**Broadcasts**: `trip:completed` event to parents

---

### 5. Student Picked Up

**Event**: `driver:student_picked`

```javascript
socket.emit("driver:student_picked", {
  tripId: "trip_123",
  studentId: "student_456",
});
```

**Broadcasts**: `student:picked_up` event to parents

---

### 6. Student Dropped Off

**Event**: `driver:student_dropped`

```javascript
socket.emit("driver:student_dropped", {
  tripId: "trip_123",
  studentId: "student_456",
});
```

**Broadcasts**: `student:dropped_off` event to parents

---

### 7. Approaching Waypoint (ETA)

**Event**: `driver:approaching_waypoint`

```javascript
socket.emit("driver:approaching_waypoint", {
  tripId: "trip_123",
  studentId: "student_456",
  eta: "2024-01-26T10:35:00Z",
  distance: 500, // meters
});
```

**Broadcasts**: `waypoint:approaching` event to parents

---

## Parent Events

### 1. Subscribe to Trip

**Event**: `parent:subscribe_trip`

```javascript
socket.emit("parent:subscribe_trip", { tripId: "trip_123" }, (response) => {
  console.log(response.success ? "✓ Watching" : "✗ Failed");
});
```

**What it does**: Joins parent to `trip:tripId:tracking` room

---

### 2. Unsubscribe from Trip

**Event**: `parent:unsubscribe_trip`

```javascript
socket.emit("parent:unsubscribe_trip", { tripId: "trip_123" });
```

---

### 3. Listen for Position Updates

**Event**: `trip:position_update` (broadcast from driver)

```javascript
socket.on("trip:position_update", (data) => {
  console.log("Driver at:", data.latitude, data.longitude);
  console.log("Speed:", data.speed, "km/h");
  updateMapMarker(data);
});
```

---

### 4. Listen for Trip Events

```javascript
socket.on("trip:started", (data) => {
  showNotification("🚗 Trip started");
});

socket.on("student:picked_up", (data) => {
  showNotification("✓ Student picked up");
});

socket.on("waypoint:approaching", (data) => {
  showNotification(`📍 Arriving in ${data.distance}m`);
});

socket.on("student:dropped_off", (data) => {
  showNotification("✓ Student dropped off");
});

socket.on("trip:completed", (data) => {
  showNotification("✓ Trip completed");
});
```

---

## Event Reference

### Driver Events (emit)

| Event                         | Payload                                        | Broadcast              |
| ----------------------------- | ---------------------------------------------- | ---------------------- |
| `driver:subscribe_trip`       | `{tripId}`                                     | Joins room             |
| `driver:update_position`      | `{tripId, lat, lng, speed, heading, accuracy}` | `trip:position_update` |
| `driver:trip_started`         | `{tripId}`                                     | `trip:started`         |
| `driver:trip_completed`       | `{tripId}`                                     | `trip:completed`       |
| `driver:student_picked`       | `{tripId, studentId}`                          | `student:picked_up`    |
| `driver:student_dropped`      | `{tripId, studentId}`                          | `student:dropped_off`  |
| `driver:approaching_waypoint` | `{tripId, studentId, eta, distance}`           | `waypoint:approaching` |

### Parent Events (listen)

| Event                  | When                  | Data                      |
| ---------------------- | --------------------- | ------------------------- |
| `trip:position_update` | Driver sends position | position info + timestamp |
| `trip:started`         | Trip begins           | trip info                 |
| `student:picked_up`    | Student picked up     | student info              |
| `waypoint:approaching` | Driver near waypoint  | waypoint info + ETA       |
| `student:dropped_off`  | Student dropped off   | student info              |
| `trip:completed`       | Trip ends             | trip info                 |

---

## Room Architecture

```
trip:123:driver        → Driver receives notifications
   └── driver_socket_1

trip:123:tracking      → All parents watching trip
   ├── parent_socket_1
   ├── parent_socket_2
   └── parent_socket_3
```

**Benefits**:

- ✅ Scalable (one room per trip)
- ✅ Isolated (trip data doesn't leak)
- ✅ Efficient (only send to interested parties)

---

## Best Practices

For step-by-step frontend integration with code examples, see [FLUTTER_INTEGRATION.md](FLUTTER_INTEGRATION.md).

### Key Connection Patterns

**Driver App**:

- Connect to WebSocket with JWT token and role='driver'
- Subscribe to trip: `emit('driver:subscribe_trip', {tripId})`
- Send position every 15s: `emit('driver:update_position', {...})`
- Notify events: `emit('driver:student_picked', {tripId, studentId})`

**Parent App**:

- Connect to WebSocket with JWT token and role='parent'
- Subscribe to trip: `emit('parent:subscribe_trip', {tripId})`
- Listen to events: `on('trip:position_update', handler)`

### Driver Side

1. **Connect once, reuse connection**

   ```javascript
   // Do this once
   const socket = io('http://localhost:3000', { auth: {...} });

   // Reuse for multiple trips
   await socket.emit('driver:subscribe_trip', {tripId: 'trip_1'});
   await socket.emit('driver:subscribe_trip', {tripId: 'trip_2'});
   ```

2. **Send positions every 10-30 seconds**

   ```javascript
   setInterval(() => {
     socket.emit('driver:update_position', {...});
   }, 15000);
   ```

3. **Handle reconnection**
   ```javascript
   socket.on("disconnect", () => {
     console.log("Lost connection, will auto-reconnect");
     // Socket.IO auto-reconnects with exponential backoff
   });
   ```

### Parent Side

1. **Subscribe before trip starts**

   ```javascript
   // Subscribe early
   socket.emit("parent:subscribe_trip", { tripId });

   // Then listen
   socket.on("trip:position_update", updateMap);
   ```

2. **Clean up when done**

   ```javascript
   socket.emit("parent:unsubscribe_trip", { tripId });
   ```

3. **Handle multiple trips**

   ```javascript
   trips.forEach((trip) => {
     socket.emit("parent:subscribe_trip", { tripId: trip.id });
   });

   // All events come on same socket
   socket.on("trip:position_update", handleUpdate);
   ```

---

## Troubleshooting

| Issue                      | Solution                                                             |
| -------------------------- | -------------------------------------------------------------------- |
| **Won't connect**          | Check JWT token is valid and userId matches                          |
| **Connection drops**       | Check network. Socket.IO auto-reconnects                             |
| **Events not received**    | Did you subscribe to trip first?                                     |
| **Parents see no updates** | Driver must subscribe to trip before sending positions               |
| **High latency**           | Check server CPU/memory. Consider Redis adapter for multiple servers |

---

## Quick Code Snippets

### Minimal Driver Example

```javascript
const socket = io("http://localhost:3000", {
  auth: { token, userId, role: "driver" },
});

socket.on("connect", async () => {
  // Subscribe
  socket.emit("driver:subscribe_trip", { tripId });

  // Send positions
  setInterval(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      socket.emit("driver:update_position", {
        tripId,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        speed: pos.coords.speed || 0,
        heading: pos.coords.heading || 0,
        accuracy: pos.coords.accuracy || 0,
      });
    });
  }, 15000);
});
```

### Minimal Parent Example

```javascript
const socket = io("http://localhost:3000", {
  auth: { token, userId, role: "parent" },
});

socket.on("connect", () => {
  socket.emit("parent:subscribe_trip", { tripId });
});

socket.on("trip:position_update", (data) => {
  updateMapMarker(data.latitude, data.longitude);
});

socket.on("student:picked_up", (data) => {
  showNotification("Student picked up!");
});
```

---

**Status**: ✅ Production Ready  
**Last Updated**: January 26, 2026
