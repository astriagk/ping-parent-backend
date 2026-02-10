# WebSocket Real-Time Tracking Documentation

**Version**: 3.3.0  
**Last Updated**: February 10, 2026  
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Security & Authentication](#security--authentication)
3. [Connection Setup](#connection-setup)
4. [Event Enums Reference](#event-enums-reference)
5. [Quick Reference: Which Event to Call When](#quick-reference-which-event-to-call-when)
6. [Complete End-to-End Flow](#complete-end-to-end-flow)
7. [Driver Events](#driver-events)
8. [Parent Events](#parent-events)
9. [Admin Events](#admin-events)
10. [Event Reference](#event-reference)
11. [Room Architecture](#room-architecture)
12. [Rate Limiting](#rate-limiting)
13. [Best Practices](#best-practices)
14. [Troubleshooting](#troubleshooting)

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

## Security & Authentication

### 🔐 JWT Token Verification

All WebSocket connections require **verified JWT tokens**. The server validates:

1. **Token Presence**: `token`, `userId`, and `role` must be provided
2. **Token Validity**: JWT is verified using `verifyAccessToken()`
3. **User ID Match**: `userId` in auth must match token payload
4. **Role Match**: `role` in auth must match token payload
5. **Role Whitelist**: Only `driver`, `parent`, or `admin` roles allowed

### 🛡️ Trip Authorization

**Drivers** can only subscribe to trips they own:

- Server verifies `driver_id` matches the trip's `driver_id`

**Parents** can only subscribe to trips where they have a student assigned:

- Server verifies parent has at least one student in `trip_students`

### ⚡ Rate Limiting

Position updates are rate-limited to **1 update per 5 seconds per trip** to prevent abuse.

---

## Connection Setup

### Authentication (All Roles)

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: "your_jwt_access_token", // Required: Valid JWT
    userId: "user_123", // Required: Must match token
    role: "driver", // Required: 'driver', 'parent', or 'admin'
  },
});

// Connection events
socket.on("connect", () => console.log("✓ Connected"));
socket.on("connect_error", (error) => {
  // Possible errors:
  // - "Missing authentication credentials"
  // - "Invalid role"
  // - "User ID mismatch"
  // - "Role mismatch"
  // - "Invalid or expired token"
  console.error("✗ Connection Error:", error.message);
});
socket.on("disconnect", () => console.log("✗ Disconnected"));

// Listen for authorization errors after connection
socket.on("socket:error", (data) => {
  console.error("Socket Error:", data.message);
  // Possible errors:
  // - "Only drivers can subscribe as driver"
  // - "Only parents can subscribe as parent"
  // - "Not authorized to access this trip"
  // - "Not authorized to track this trip"
  // - "Invalid coordinates"
});
```

---

## Event Enums Reference

The backend uses TypeScript enums for all socket events. Use these exact event names:

### Driver Events (Client → Server)

```typescript
// From: @shared/constants/enums.ts
enum DriverSocketEvent {
  SUBSCRIBE_TRIP = "driver:subscribe_trip",
  UNSUBSCRIBE_TRIP = "driver:unsubscribe_trip",
  UPDATE_POSITION = "driver:update_position",
  TRIP_STARTED = "driver:trip_started",
  TRIP_COMPLETED = "driver:trip_completed",
  STUDENT_PICKED = "driver:student_picked",
  STUDENT_DROPPED = "driver:student_dropped",
  APPROACHING_WAYPOINT = "driver:approaching_waypoint",
}
```

### Parent Events (Client → Server)

```typescript
enum ParentSocketEvent {
  SUBSCRIBE_TRIP = "parent:subscribe_trip",
  UNSUBSCRIBE_TRIP = "parent:unsubscribe_trip",
}
```

### Parent Notification Events (Server → Specific Parent)

These events are sent **only to the specific parent** of a student, not to all parents on the trip.
Used for home pickup/drop notifications.

```typescript
enum ParentNotificationEvent {
  MY_STUDENT_PICKED = "parent:my_student_picked",
  MY_STUDENT_DROPPED = "parent:my_student_dropped",
  MY_STUDENT_APPROACHING = "parent:my_student_approaching",
}
```

### Broadcast Events (Server → Client)

```typescript
enum BroadcastSocketEvent {
  POSITION_UPDATE = "trip:position_update",
  TRIP_STARTED = "trip:started",
  TRIP_COMPLETED = "trip:completed",
  ROUTE_CALCULATED = "trip:route_calculated",
  APPROACHING = "trip:approaching",
  STUDENT_PICKED = "trip:student_picked",
  STUDENT_DROPPED = "trip:student_dropped",
  ERROR = "socket:error",
}
```

---

## Quick Reference: Which Event to Call When

This section provides a clear decision matrix for developers implementing the Driver and Parent apps.

### Event Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           EVENT FLOW ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│   DRIVER APP                   BACKEND                    PARENT APP              │
│   ══════════                   ═══════                    ══════════              │
│                                                                                     │
│   1. Connect with JWT ────────►  Auth Check                                        │
│                                                                                     │
│   2. driver:subscribe_trip ───►  Verify ownership ─────►  (none - wait)           │
│                                  Join driver room                                   │
│                                                                                     │
│                                                    ◄─────  parent:subscribe_trip   │
│                                  Verify student    ◄─────  (needs child on trip)   │
│                                  Join tracking room                                 │
│                                  + auto-join parent:id room                        │
│                                                                                     │
│   3. driver:trip_started ─────►  Broadcast ────────────►  trip:started (ALL)       │
│                                                                                     │
│   4. driver:update_position ──►  Rate limit (5s) ──────►  trip:position_update     │
│                                  Validate coords           (ALL parents on trip)   │
│                                                                                     │
│   5. driver:approaching ──────►  Broadcast ────────────►  trip:approaching (ALL)   │
│                                                                                     │
│   6. REST: POST /pickup ──────►  Update DB ────────────►  parent:my_student_picked │
│      (or driver:student_picked)  + Socket broadcast        (SPECIFIC parent only) │
│                                                    AND ─►  trip:student_picked     │
│                                                            (ALL parents on trip)   │
│                                                                                     │
│   7. REST: POST /dropoff ─────►  Update DB ────────────►  parent:my_student_dropped│
│      (or driver:student_dropped) + Socket broadcast        (SPECIFIC parent only) │
│                                                    AND ─►  trip:student_dropped    │
│                                                            (ALL parents on trip)   │
│                                                                                     │
│   8. driver:trip_completed ───►  Broadcast ────────────►  trip:completed (ALL)     │
│                                  Cleanup rooms                                      │
│                                                                                     │
│   9. driver:unsubscribe_trip ─►  Leave room                                        │
│                                                    ◄─────  parent:unsubscribe_trip │
│                                  Leave room        ◄─────                          │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Driver App: Events to EMIT (Client → Server)

| Step | Event                         | When to Call                     | Payload                                           | What Happens                         |
| ---- | ----------------------------- | -------------------------------- | ------------------------------------------------- | ------------------------------------ |
| 1    | `driver:subscribe_trip`       | After connect, before any action | `tripId: string`                                  | Joins driver to trip room            |
| 2    | `driver:trip_started`         | When driver starts the trip      | `tripId: string`                                  | Notifies ALL parents                 |
| 3    | `driver:update_position`      | Every 10-15 seconds during trip  | `{ tripId, latitude, longitude, speed, heading }` | Broadcasts to ALL parents (rate: 5s) |
| 4    | `driver:approaching_waypoint` | When ETA < 5 mins to a student   | `{ tripId, studentId, eta }`                      | Notifies ALL parents                 |
| 5    | `driver:student_picked`       | When student boards vehicle      | `{ tripId, studentId }`                           | Notifies ALL parents                 |
| 6    | `driver:student_dropped`      | When student exits vehicle       | `{ tripId, studentId }`                           | Notifies ALL parents                 |
| 7    | `driver:trip_completed`       | When all students delivered      | `tripId: string`                                  | Notifies ALL parents, cleanup        |
| 8    | `driver:unsubscribe_trip`     | After trip ends or on disconnect | `tripId: string`                                  | Leaves room, cleans rate limit       |

### Driver App: Events to LISTEN (Server → Client)

| Event           | When Received            | Payload               | Action                       |
| --------------- | ------------------------ | --------------------- | ---------------------------- |
| `socket:error`  | On authorization failure | `{ message: string }` | Show error, retry or re-auth |
| `connect`       | On successful connection | -                     | Proceed to subscribe         |
| `connect_error` | On connection failure    | `Error` object        | Retry connection             |

### Parent App: Events to EMIT (Client → Server)

| Event                     | When to Call                     | Payload          | What Happens                  |
| ------------------------- | -------------------------------- | ---------------- | ----------------------------- |
| `parent:subscribe_trip`   | After connect, to start tracking | `tripId: string` | Joins parent to tracking room |
| `parent:unsubscribe_trip` | When done tracking or trip ends  | `tripId: string` | Leaves tracking room          |

### Parent App: Events to LISTEN (Server → Client)

| Event                           | Type         | When Received                 | Payload                                            | Action                           |
| ------------------------------- | ------------ | ----------------------------- | -------------------------------------------------- | -------------------------------- |
| `trip:position_update`          | Broadcast    | Every 5-15 seconds            | `{ tripId, latitude, longitude, speed, ... }`      | Update map marker                |
| `trip:started`                  | Broadcast    | When driver starts trip       | `{ tripId, driverId, timestamp }`                  | Show "Trip started" notification |
| `trip:completed`                | Broadcast    | When driver completes trip    | `{ tripId, driverId, timestamp }`                  | Show "Trip ended", unsubscribe   |
| `trip:route_calculated`         | Broadcast    | After route calculation       | `{ tripId, routeData }`                            | Draw route on map                |
| `trip:approaching`              | Broadcast    | When driver near ANY student  | `{ tripId, studentId, eta, ... }`                  | Show "Driver approaching"        |
| `trip:student_picked`           | Broadcast    | When ANY student picked up    | `{ tripId, studentId, ... }`                       | Update student status            |
| `trip:student_dropped`          | Broadcast    | When ANY student dropped off  | `{ tripId, studentId, ... }`                       | Update student status            |
| `parent:my_student_picked`      | **Targeted** | When YOUR student picked up   | `{ tripId, studentId, studentName, message }`      | High-priority notification       |
| `parent:my_student_dropped`     | **Targeted** | When YOUR student dropped off | `{ tripId, studentId, studentName, message }`      | High-priority notification       |
| `parent:my_student_approaching` | **Targeted** | When driver near YOUR student | `{ tripId, studentId, studentName, eta, message }` | Show alert notification          |
| `socket:error`                  | Error        | On authorization failure      | `{ message: string }`                              | Show error, handle gracefully    |

### Broadcast vs Targeted Events Explained

**Broadcast Events (`trip:*`)** - Sent to ALL parents subscribed to the trip:

- Used for general trip status (started, completed, position)
- Every parent sees every student's pickup/dropoff status
- Useful for showing overall trip progress on map

**Targeted Events (`parent:my_student_*`)** - Sent ONLY to the specific parent:

- Triggered from REST API when driver records pickup/dropoff via OTP verification
- Only the parent of that specific student receives this event
- Used for high-priority notifications ("Your child has been picked up")
- Auto-delivered - parents are auto-joined to `parent:{parentId}` room on connect

### When to Use REST API + Socket vs Socket Only

| Action                   | Method         | Reason                                                |
| ------------------------ | -------------- | ----------------------------------------------------- |
| Start position streaming | Socket only    | Real-time, no database needed                         |
| Record student pickup    | REST API       | Requires OTP/QR verification, creates database record |
| Record student dropoff   | REST API       | Requires OTP/QR verification, creates database record |
| Trip start               | Socket OR REST | Socket for real-time; REST to update DB status        |
| Trip complete            | Socket + REST  | Socket for real-time; REST to finalize records        |
| Calculate route          | REST API       | Heavy computation, auto-broadcasts via socket         |

**REST Endpoints that trigger Socket broadcasts:**

- `POST /api/tracking/calculate` → broadcasts `trip:route_calculated`
- `POST /api/trip-students/:tripId/:studentId/pickup` → sends `parent:my_student_picked` to specific parent
- `POST /api/trip-students/:tripId/:studentId/drop` → sends `parent:my_student_dropped` to specific parent

---

## Complete End-to-End Flow

### 🚗 Trip Lifecycle: Driver → Backend → Parent

This section shows the complete flow with all three roles working together.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMPLETE TRIP TRACKING FLOW                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │   DRIVER    │         │   BACKEND   │         │   PARENT    │           │
│  │     APP     │         │   SERVER    │         │     APP     │           │
│  └─────────────┘         └─────────────┘         └─────────────┘           │
│        │                       │                       │                    │
│        │  ═══════════════════════════════════════════════════════════       │
│        │        PHASE 1: CONNECTION & AUTHENTICATION                        │
│        │  ═══════════════════════════════════════════════════════════       │
│        │                       │                       │                    │
│        ├──── Connect (JWT) ───►│                       │                    │
│        │     auth: {           │                       │                    │
│        │       token: "...",   │                       │                    │
│        │       userId: "drv1", │                       │                    │
│        │       role: "driver"  │                       │                    │
│        │     }                 │                       │                    │
│        │                       │                       │                    │
│        │◄─── Verified ✓ ───────│                       │                    │
│        │                       │                       │                    │
│        │                       │◄──── Connect (JWT) ───│                    │
│        │                       │      auth: {          │                    │
│        │                       │        token: "...",  │                    │
│        │                       │        userId: "par1",│                    │
│        │                       │        role: "parent" │                    │
│        │                       │      }                │                    │
│        │                       │                       │                    │
│        │                       │────► Verified ✓ ──────│                    │
│        │                       │                       │                    │
│        │  ═══════════════════════════════════════════════════════════       │
│        │        PHASE 2: SUBSCRIBE TO TRIP                                   │
│        │  ═══════════════════════════════════════════════════════════       │
│        │                       │                       │                    │
│        ├── driver:subscribe ──►│                       │                    │
│        │   { tripId }          │                       │                    │
│        │                       │                       │                    │
│        │   [Server verifies    │                       │                    │
│        │    driver owns trip]  │                       │                    │
│        │                       │                       │                    │
│        │◄── callback(true) ────│                       │                    │
│        │                       │                       │                    │
│        │                       │◄── parent:subscribe ──│                    │
│        │                       │    { tripId }         │                    │
│        │                       │                       │                    │
│        │                       │    [Server verifies   │                    │
│        │                       │     parent has child  │                    │
│        │                       │     on this trip]     │                    │
│        │                       │                       │                    │
│        │                       │──► callback(true) ────│                    │
│        │                       │                       │                    │
│        │  ═══════════════════════════════════════════════════════════       │
│        │        PHASE 3: TRIP START & ROUTE CALCULATION                      │
│        │  ═══════════════════════════════════════════════════════════       │
│        │                       │                       │                    │
│        ├── driver:trip_started►│                       │                    │
│        │   { tripId }          │                       │                    │
│        │                       ├───► trip:started ─────►                    │
│        │                       │                       │                    │
│        ├── REST: POST /calculate                       │                    │
│        │   { tripId, lat, lng }│                       │                    │
│        │                       │                       │                    │
│        │◄── Route Data ────────│                       │                    │
│        │                       ├─► trip:route_calculated►                   │
│        │                       │                       │                    │
│        │  ═══════════════════════════════════════════════════════════       │
│        │        PHASE 4: REAL-TIME POSITION STREAMING                        │
│        │  ═══════════════════════════════════════════════════════════       │
│        │                       │                       │                    │
│        ├── driver:update_pos ─►│                       │                    │
│        │   { tripId,           │                       │                    │
│        │     latitude,         │   [Rate limit: 5s]    │                    │
│        │     longitude,        │   [Coord validation]  │                    │
│        │     speed,            │                       │                    │
│        │     heading }         ├─► trip:position_update►                    │
│        │                       │                       │                    │
│        │     (every 5-15s)     │                       │  Update map        │
│        │                       │                       │                    │
│        │  ═══════════════════════════════════════════════════════════       │
│        │        PHASE 5: STUDENT PICKUP/DROPOFF                              │
│        │  ═══════════════════════════════════════════════════════════       │
│        │                       │                       │                    │
│        ├── driver:approaching ─►                       │                    │
│        │   { tripId,           │                       │                    │
│        │     studentId,        ├─► trip:approaching ───►                    │
│        │     eta }             │                       │  "Arriving in 2m"  │
│        │                       │                       │                    │
│        ├── driver:student_picked►                      │                    │
│        │   { tripId,           │                       │                    │
│        │     studentId }       ├─► trip:student_picked ►                    │
│        │                       │                       │  "Child picked up" │
│        │                       │                       │                    │
│        ├── driver:student_dropped►                     │                    │
│        │   { tripId,           │                       │                    │
│        │     studentId }       ├─► trip:student_dropped►                    │
│        │                       │                       │  "Child dropped"   │
│        │                       │                       │                    │
│        │  ═══════════════════════════════════════════════════════════       │
│        │        PHASE 6: TRIP COMPLETION                                     │
│        │  ═══════════════════════════════════════════════════════════       │
│        │                       │                       │                    │
│        ├── driver:trip_completed►                      │                    │
│        │   { tripId }          │                       │                    │
│        │                       ├─► trip:completed ─────►                    │
│        │                       │                       │  "Trip finished"   │
│        │                       │                       │                    │
│        ├── driver:unsubscribe ─►                       │                    │
│        │   { tripId }          │                       │                    │
│        │                       │                       │                    │
│        │                       │◄── parent:unsubscribe │                    │
│        │                       │    { tripId }         │                    │
│        │                       │                       │                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Integration Guide

### 🚗 Driver App Integration (In Order)

Follow these steps in **exact order**:

```
┌───────┬─────────────────────────────────────────────────────────────────────┐
│ Step  │ Action                                                              │
├───────┼─────────────────────────────────────────────────────────────────────┤
│  1    │ CONNECT: Create socket with auth (token, userId, role: "driver")    │
│       │ └── Wait for "connect" event before proceeding                      │
├───────┼─────────────────────────────────────────────────────────────────────┤
│  2    │ SUBSCRIBE: Emit "driver:subscribe_trip" with tripId                 │
│       │ └── Wait for callback(true) before proceeding                       │
│       │ └── If callback(false), check "socket:error" event                  │
├───────┼─────────────────────────────────────────────────────────────────────┤
│  3    │ CALCULATE ROUTE: Call REST API POST /api/tracking/calculate         │
│       │ └── This broadcasts route to parents automatically                  │
├───────┼─────────────────────────────────────────────────────────────────────┤
│  4    │ START TRIP: Emit "driver:trip_started" with tripId                  │
│       │ └── Parents receive "trip:started" event                            │
├───────┼─────────────────────────────────────────────────────────────────────┤
│  5    │ STREAM POSITION: Emit "driver:update_position" every 10-15 seconds  │
│       │ └── Include: tripId, latitude, longitude, speed, heading, accuracy  │
│       │ └── Rate limit: Wait 5+ seconds between updates                     │
├───────┼─────────────────────────────────────────────────────────────────────┤
│  6    │ APPROACHING: Emit "driver:approaching_waypoint" when near student   │
│       │ └── Include: tripId, studentId, eta (seconds)                       │
├───────┼─────────────────────────────────────────────────────────────────────┤
│  7    │ PICKUP: Emit "driver:student_picked" when student boards            │
│       │ └── Include: tripId, studentId                                      │
├───────┼─────────────────────────────────────────────────────────────────────┤
│  8    │ DROPOFF: Emit "driver:student_dropped" when student exits           │
│       │ └── Include: tripId, studentId                                      │
├───────┼─────────────────────────────────────────────────────────────────────┤
│  9    │ COMPLETE: Emit "driver:trip_completed" when trip ends               │
│       │ └── Parents receive "trip:completed" event                          │
├───────┼─────────────────────────────────────────────────────────────────────┤
│ 10    │ CLEANUP: Emit "driver:unsubscribe_trip" and optionally disconnect   │
│       │ └── Rate limit tracking is automatically cleaned up                 │
└───────┴─────────────────────────────────────────────────────────────────────┘
```

**Complete Driver Code (In Order)**:

```javascript
// STEP 1: Connect
const socket = io(SERVER_URL, {
  auth: { token, userId, role: "driver" },
});

socket.on("connect", () => {
  // STEP 2: Subscribe (only after connect)
  socket.emit("driver:subscribe_trip", tripId, async (success) => {
    if (!success) {
      console.error("Failed to subscribe");
      return;
    }

    // STEP 3: Calculate route via REST API
    await fetch(`/api/tracking/calculate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        trip_id: tripId,
        latitude: startLat,
        longitude: startLng,
      }),
    });

    // STEP 4: Start trip
    socket.emit("driver:trip_started", tripId);

    // STEP 5: Begin position streaming
    startPositionStreaming();
  });
});

function startPositionStreaming() {
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
  }, 10000); // Every 10 seconds (must be >= 5 seconds)
}

// STEP 6, 7, 8: Call these when appropriate
function approachingStudent(studentId, etaSeconds) {
  socket.emit("driver:approaching_waypoint", {
    tripId,
    studentId,
    eta: etaSeconds,
  });
}

function pickupStudent(studentId) {
  socket.emit("driver:student_picked", { tripId, studentId });
}

function dropoffStudent(studentId) {
  socket.emit("driver:student_dropped", { tripId, studentId });
}

// STEP 9, 10: End trip
function completeTrip() {
  socket.emit("driver:trip_completed", tripId);
  socket.emit("driver:unsubscribe_trip", tripId);
}
```

---

### 👨‍👩‍👧 Parent App Integration (In Order)

Follow these steps in **exact order**:

```
┌───────┬─────────────────────────────────────────────────────────────────────┐
│ Step  │ Action                                                              │
├───────┼─────────────────────────────────────────────────────────────────────┤
│  1    │ CONNECT: Create socket with auth (token, userId, role: "parent")    │
│       │ └── Wait for "connect" event before proceeding                      │
├───────┼─────────────────────────────────────────────────────────────────────┤
│  2    │ SUBSCRIBE: Emit "parent:subscribe_trip" with tripId                 │
│       │ └── Wait for callback(true) before proceeding                       │
│       │ └── If callback(false), parent has no child on this trip            │
├───────┼─────────────────────────────────────────────────────────────────────┤
│  3    │ REGISTER LISTENERS: Set up event handlers for all trip events       │
│       │ └── "trip:position_update" - Update driver marker on map            │
│       │ └── "trip:started" - Show "Trip has started" notification           │
│       │ └── "trip:route_calculated" - Draw route on map                     │
│       │ └── "trip:approaching" - Show "Driver arriving soon" alert          │
│       │ └── "trip:student_picked" - Show "Child picked up" notification     │
│       │ └── "trip:student_dropped" - Show "Child dropped off" notification  │
│       │ └── "trip:completed" - Show "Trip finished" and cleanup             │
│       │ └── "socket:error" - Handle authorization errors                    │
├───────┼─────────────────────────────────────────────────────────────────────┤
│  4    │ WAIT: Just listen - all events come from server automatically       │
├───────┼─────────────────────────────────────────────────────────────────────┤
│  5    │ CLEANUP: Emit "parent:unsubscribe_trip" when done watching          │
│       │ └── Or when "trip:completed" is received                            │
└───────┴─────────────────────────────────────────────────────────────────────┘
```

**Complete Parent Code (In Order)**:

```javascript
// STEP 1: Connect
const socket = io(SERVER_URL, {
  auth: { token, userId, role: "parent" },
});

socket.on("connect", () => {
  // STEP 2: Subscribe (only after connect)
  socket.emit("parent:subscribe_trip", tripId, (success) => {
    if (!success) {
      console.error("Cannot track this trip - no child assigned");
      return;
    }
    console.log("✓ Now tracking trip");
  });
});

// STEP 3: Register all listeners (can be done before or after connect)
socket.on("trip:position_update", (data) => {
  // Update driver marker on map
  updateDriverMarker(data.latitude, data.longitude);
  updateSpeedDisplay(data.speed);
  console.log(`Driver at ${data.latitude}, ${data.longitude}`);
});

socket.on("trip:started", (data) => {
  showNotification("🚗 Trip has started!");
  setTripStatus("in_progress");
});

socket.on("trip:route_calculated", (data) => {
  // Draw route polyline on map
  drawRouteOnMap(data.routeData);
});

socket.on("trip:approaching", (data) => {
  const minutes = Math.round(data.eta / 60);
  showNotification(`📍 Driver arriving in ${minutes} minutes`);
});

socket.on("trip:student_picked", (data) => {
  showNotification("✓ Your child has been picked up!");
  updateStudentStatus(data.studentId, "picked");
});

socket.on("trip:student_dropped", (data) => {
  showNotification("✓ Your child has been dropped off!");
  updateStudentStatus(data.studentId, "dropped");
});

socket.on("trip:completed", (data) => {
  showNotification("✅ Trip completed successfully!");
  setTripStatus("completed");

  // STEP 5: Cleanup
  socket.emit("parent:unsubscribe_trip", tripId);
});

socket.on("socket:error", (data) => {
  console.error("Error:", data.message);
  // Handle specific errors
  if (data.message.includes("Not authorized")) {
    showError("You don't have access to this trip");
  }
});

// STEP 4: Just wait - events come automatically from driver updates
```

---

### ⚠️ Common Integration Mistakes

| Mistake                                      | Solution                                  |
| -------------------------------------------- | ----------------------------------------- |
| Emitting events before `connect`             | Wait for `socket.on("connect")` first     |
| Streaming positions before `subscribe_trip`  | Wait for callback(true) from subscribe    |
| Not handling callback(false)                 | Check `socket:error` event for details    |
| Position updates faster than 5 seconds       | Rate limited - updates ignored, slow down |
| Parent subscribing without child on trip     | Server rejects - callback(false)          |
| Not listening to `socket:error`              | Add error handler to debug issues         |
| Calling `unsubscribe_trip` without subscribe | Safe - just no-op                         |

---

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
   - Joins: trip:{tripId}
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
  │     └─ Joins: trip:{tripId} ✓            │                                │
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

**Authorization**: ✅ Server verifies driver owns the trip

```javascript
socket.emit("driver:subscribe_trip", "trip_123", (success) => {
  if (success) {
    console.log("✓ Subscribed to trip");
  } else {
    console.log("✗ Failed - check socket:error event for details");
  }
});
```

**What it does**:

1. Verifies driver owns the trip (checks `trips.driver_id`)
2. Joins driver to `trip:{tripId}` room (shared with parents)
3. Returns `true` via callback if authorized

**Error Cases**:

- `socket:error` with message "Only drivers can subscribe as driver" - Wrong role
- `socket:error` with message "Not authorized to access this trip" - Driver doesn't own trip

---

### 2. Send Position Update

**Event**: `driver:update_position`

**Rate Limit**: ⏱️ 1 update per 5 seconds per trip

```javascript
socket.emit(
  "driver:update_position",
  {
    tripId: "trip_123",
    latitude: 12.9716,
    longitude: 77.5946,
    speed: 45, // km/h
    heading: 180, // degrees (0-360)
    accuracy: 10, // meters
  },
  (success) => {
    if (!success) {
      // Either rate limited or invalid coordinates
    }
  },
);
```

**Validation**:

- Latitude must be between -90 and 90
- Longitude must be between -180 and 180
- Rate limit: 5 seconds between updates

**Broadcasts**: `trip:position_update` to all parents

```json
{
  "tripId": "trip_123",
  "driverId": "driver_456",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "speed": 45,
  "heading": 180,
  "accuracy": 10,
  "timestamp": "2026-02-05T10:30:00Z"
}
```

---

### 3. Trip Started

**Event**: `driver:trip_started`

```javascript
socket.emit("driver:trip_started", "trip_123", (success) => {
  console.log(success ? "✓ Trip started broadcast" : "✗ Failed");
});
```

**Broadcasts**: `trip:started` to all parents

---

### 4. Trip Completed

**Event**: `driver:trip_completed`

```javascript
socket.emit("driver:trip_completed", "trip_123", (success) => {
  console.log(success ? "✓ Trip completed broadcast" : "✗ Failed");
});
```

**Broadcasts**: `trip:completed` to all parents  
**Cleanup**: Removes rate limit tracking for this trip

---

### 5. Student Picked Up

**Event**: `driver:student_picked`

```javascript
socket.emit(
  "driver:student_picked",
  {
    tripId: "trip_123",
    studentId: "student_456",
  },
  (success) => {
    console.log(success ? "✓ Pickup broadcast" : "✗ Failed");
  },
);
```

**Broadcasts**: `trip:student_picked` to all parents

---

### 6. Student Dropped Off

**Event**: `driver:student_dropped`

```javascript
socket.emit(
  "driver:student_dropped",
  {
    tripId: "trip_123",
    studentId: "student_456",
  },
  (success) => {
    console.log(success ? "✓ Dropoff broadcast" : "✗ Failed");
  },
);
```

**Broadcasts**: `trip:student_dropped` to all parents

---

### 7. Approaching Waypoint

**Event**: `driver:approaching_waypoint`

```javascript
socket.emit(
  "driver:approaching_waypoint",
  {
    tripId: "trip_123",
    studentId: "student_456",
    eta: 120, // seconds until arrival
  },
  (success) => {
    console.log(success ? "✓ Approaching broadcast" : "✗ Failed");
  },
);
```

**Broadcasts**: `trip:approaching` to all parents

---

### 8. Unsubscribe from Trip

**Event**: `driver:unsubscribe_trip`

```javascript
socket.emit("driver:unsubscribe_trip", "trip_123");
```

**What it does**: Leaves the `trip:{tripId}` room and cleans up rate limiting

---

## Parent Events

### 1. Subscribe to Trip

**Event**: `parent:subscribe_trip`

**Authorization**: ✅ Server verifies parent has a student on the trip

```javascript
socket.emit("parent:subscribe_trip", "trip_123", (success) => {
  if (success) {
    console.log("✓ Subscribed to trip tracking");
  } else {
    console.log("✗ Failed - check socket:error event");
  }
});
```

**What it does**:

1. Finds parent record by `user_id`
2. Gets all students belonging to this parent
3. Checks if any student is in `trip_students` for this trip
4. If authorized, joins `trip:{tripId}` room (shared with driver)

**Error Cases**:

- `socket:error` with message "Only parents can subscribe as parent" - Wrong role
- `socket:error` with message "Not authorized to track this trip" - No children on trip

---

### 2. Unsubscribe from Trip

**Event**: `parent:unsubscribe_trip`

```javascript
socket.emit("parent:unsubscribe_trip", "trip_123");
```

---

### 3. Listen for All Trip Events

```javascript
// Position updates (every 5-15 seconds)
socket.on("trip:position_update", (data) => {
  console.log(`Driver at: ${data.latitude}, ${data.longitude}`);
  console.log(`Speed: ${data.speed} km/h`);
  updateMapMarker(data);
});

// Trip lifecycle
socket.on("trip:started", (data) => {
  showNotification("🚗 Trip has started!");
});

socket.on("trip:completed", (data) => {
  showNotification("✅ Trip completed");
});

// Route updates
socket.on("trip:route_calculated", (data) => {
  updateRouteOnMap(data.routeData);
});

// Student events (broadcast to ALL parents on trip)
socket.on("trip:approaching", (data) => {
  showNotification(`📍 Driver arriving in ${data.eta} seconds`);
});

socket.on("trip:student_picked", (data) => {
  showNotification("✓ A child has been picked up");
});

socket.on("trip:student_dropped", (data) => {
  showNotification("✓ A child has been dropped off");
});

// ============================================
// PARENT-SPECIFIC EVENTS (only YOUR child)
// These are sent only to you, not all parents
// Auto-triggered when driver records pickup/drop via REST API
// ============================================

socket.on("parent:my_student_picked", (data) => {
  // data: { tripId, studentId, studentName, driverId, message, timestamp }
  showNotification(`✓ ${data.studentName} has been picked up!`);
  playSound("pickup_chime");
});

socket.on("parent:my_student_dropped", (data) => {
  // data: { tripId, studentId, studentName, driverId, message, timestamp }
  showNotification(`✓ ${data.studentName} has been dropped off!`);
  playSound("dropoff_chime");
});

socket.on("parent:my_student_approaching", (data) => {
  // data: { tripId, studentId, studentName, eta, driverId, message, timestamp }
  showNotification(
    `📍 Driver arriving for ${data.studentName} - ETA ${Math.ceil(data.eta / 60)} min`,
  );
});

// Error handling
socket.on("socket:error", (data) => {
  console.error("Socket error:", data.message);
});
```

---

## Admin Events

Admins can connect and monitor all trips. Admin connections are verified by `role: "admin"` in the JWT token.

### Admin Connection

```javascript
const socket = io("http://localhost:3000", {
  auth: {
    token: "admin_jwt_token",
    userId: "admin_123",
    role: "admin",
  },
});
```

### Server-Side Broadcasting (TrackingSocketService)

Admins and backend services can use `TrackingSocketService` to broadcast events:

```typescript
import { TrackingSocketService } from "@modules/tracking/tracking.socket.service";

// Broadcast trip started
TrackingSocketService.broadcastTripStarted(tripId, driverId);

// Broadcast position update
TrackingSocketService.broadcastPositionUpdate(tripId, {
  latitude: 12.9716,
  longitude: 77.5946,
  speed: 45,
  heading: 180,
  accuracy: 10,
});

// Broadcast student events (to ALL parents on the trip)
TrackingSocketService.broadcastStudentPicked(tripId, driverId, studentId);
TrackingSocketService.broadcastStudentDropped(tripId, driverId, studentId);
TrackingSocketService.broadcastApproachingWaypoint(
  tripId,
  driverId,
  studentId,
  eta,
);

// Broadcast route calculated
TrackingSocketService.broadcastRouteCalculated(tripId, routeData);

// Broadcast trip completed
TrackingSocketService.broadcastTripCompleted(tripId, driverId);

// Notify driver directly
TrackingSocketService.notifyDriverEvent(tripId, "custom:event", { data });

// ============================================
// PARENT-SPECIFIC NOTIFICATIONS
// Send to specific parent only (their child's events)
// ============================================

// Notify specific parent their student was picked up (from home)
TrackingSocketService.notifyParentStudentPicked(
  parentId, // MongoDB _id from parents collection
  tripId,
  studentId,
  studentName, // e.g., "John"
  driverId, // optional
);

// Notify specific parent their student was dropped off (at home)
TrackingSocketService.notifyParentStudentDropped(
  parentId,
  tripId,
  studentId,
  studentName,
  driverId,
);

// Notify specific parent driver is approaching their child's location
TrackingSocketService.notifyParentApproaching(
  parentId,
  tripId,
  studentId,
  studentName,
  eta, // seconds until arrival
  driverId,
);
```

> **Note**: Parent-specific notifications (`notifyParent*`) are automatically called when using the REST API endpoints:
>
> - `PATCH /api/trip-students/:tripId/:studentId/pickup` triggers `notifyParentStudentPicked`
> - `PATCH /api/trip-students/:tripId/:studentId/drop` triggers `notifyParentStudentDropped`

---

## Event Reference

### Driver Events (Client → Server)

| Event                         | Payload                                                      | Authorization     | Broadcast              |
| ----------------------------- | ------------------------------------------------------------ | ----------------- | ---------------------- |
| `driver:subscribe_trip`       | `tripId: string`                                             | ✅ Must own trip  | Joins room             |
| `driver:unsubscribe_trip`     | `tripId: string`                                             | —                 | Leaves room            |
| `driver:update_position`      | `{tripId, latitude, longitude, speed?, heading?, accuracy?}` | Rate limited (5s) | `trip:position_update` |
| `driver:trip_started`         | `tripId: string`                                             | Driver role       | `trip:started`         |
| `driver:trip_completed`       | `tripId: string`                                             | Driver role       | `trip:completed`       |
| `driver:student_picked`       | `{tripId, studentId}`                                        | Driver role       | `trip:student_picked`  |
| `driver:student_dropped`      | `{tripId, studentId}`                                        | Driver role       | `trip:student_dropped` |
| `driver:approaching_waypoint` | `{tripId, studentId, eta}`                                   | Driver role       | `trip:approaching`     |

### Parent Events (Client → Server)

| Event                     | Payload          | Authorization              | Result      |
| ------------------------- | ---------------- | -------------------------- | ----------- |
| `parent:subscribe_trip`   | `tripId: string` | ✅ Must have child on trip | Joins room  |
| `parent:unsubscribe_trip` | `tripId: string` | —                          | Leaves room |

### Broadcast Events (Server → Client)

| Event                   | When                           | Data                                                                |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------- |
| `trip:position_update`  | Driver sends position          | `{tripId, driverId, lat, lng, speed, heading, accuracy, timestamp}` |
| `trip:started`          | Trip begins                    | `{tripId, driverId, timestamp}`                                     |
| `trip:completed`        | Trip ends                      | `{tripId, driverId, timestamp}`                                     |
| `trip:route_calculated` | Route calculated/recalculated  | `{tripId, routeData, timestamp}`                                    |
| `trip:approaching`      | Driver near waypoint           | `{tripId, driverId, studentId, eta, timestamp}`                     |
| `trip:student_picked`   | Student picked up              | `{tripId, driverId, studentId, timestamp}`                          |
| `trip:student_dropped`  | Student dropped off            | `{tripId, driverId, studentId, timestamp}`                          |
| `socket:error`          | Authorization/validation error | `{message: string}`                                                 |

### Parent-Specific Notification Events (Server → Specific Parent)

These events are sent **only to the specific parent** of a student via their personal room `parent:{parentId}`.
They are automatically triggered when pickup/drop is recorded via REST API.

| Event                           | When                            | Data                                                                  |
| ------------------------------- | ------------------------------- | --------------------------------------------------------------------- |
| `parent:my_student_picked`      | Their child picked up from home | `{tripId, studentId, studentName, driverId, message, timestamp}`      |
| `parent:my_student_dropped`     | Their child dropped off at home | `{tripId, studentId, studentName, driverId, message, timestamp}`      |
| `parent:my_student_approaching` | Driver approaching their child  | `{tripId, studentId, studentName, eta, driverId, message, timestamp}` |

---

## Room Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SOCKET.IO ROOMS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  trip:TRP-123456             ← Shared trip room              │
│     ├── driver_socket_abc    (driver of this trip)          │
│     ├── parent_socket_def    (parent with child on trip)    │
│     ├── parent_socket_ghi    (parent with child on trip)    │
│     └── parent_socket_jkl    (parent with child on trip)    │
│                                                              │
│  parent:PAR-111111           ← Parent's personal room       │
│     └── parent_socket_def    (for direct notifications)     │
│                                                              │
│  parent:PAR-222222           ← Another parent's room        │
│     └── parent_socket_ghi                                    │
│                                                              │
│  trip:TRP-789012             ← Another trip room             │
│     ├── driver_socket_xyz                                    │
│     └── parent_socket_mno                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Room Types**:

| Room Pattern        | Purpose                                       | Who Joins                    |
| ------------------- | --------------------------------------------- | ---------------------------- |
| `trip:{tripId}`     | Shared trip room for all events               | Driver + all parents on trip |
| `parent:{parentId}` | Parent's personal room (direct notifications) | Auto-joined on connect       |

**Benefits**:

- ✅ **Scalable**: One room per trip, can handle thousands of trips
- ✅ **Isolated**: Trip data doesn't leak to other trips
- ✅ **Efficient**: Only send to interested parties
- ✅ **Secure**: Authorization checked before joining rooms

---

## Rate Limiting

Position updates are rate-limited to prevent abuse:

| Setting              | Value                        | Purpose                     |
| -------------------- | ---------------------------- | --------------------------- |
| **Minimum interval** | 5 seconds                    | Prevents spam               |
| **Per trip**         | Yes                          | Each trip has its own limit |
| **Auto-cleanup**     | On trip complete/unsubscribe | Memory management           |

**Client handling**:

```javascript
// If callback returns false, update was rate-limited
socket.emit("driver:update_position", positionData, (success) => {
  if (!success) {
    // Either rate limited or invalid coordinates
    // Wait and retry
  }
});
```

---

## Best Practices

### Driver App

1. **Use callbacks** to confirm events were accepted
2. **Respect rate limiting** - don't send positions faster than every 5 seconds
3. **Handle reconnection** - Socket.IO auto-reconnects
4. **Subscribe immediately** after connection

```javascript
const socket = io(url, { auth: { token, userId, role: "driver" } });

socket.on("connect", () => {
  socket.emit("driver:subscribe_trip", tripId, (success) => {
    if (success) startPositionStreaming();
  });
});

socket.on("socket:error", (data) => {
  console.error("Authorization error:", data.message);
});
```

### Parent App

1. **Subscribe early** - before trip starts if possible
2. **Listen for all events** - don't miss important updates
3. **Handle multiple trips** - subscribe to each child's trip

```javascript
const socket = io(url, { auth: { token, userId, role: "parent" } });

socket.on("connect", () => {
  myChildren.forEach((child) => {
    socket.emit("parent:subscribe_trip", child.tripId, (success) => {
      if (!success) console.log(`Cannot track trip ${child.tripId}`);
    });
  });
});

socket.on("trip:position_update", updateAllMaps);
socket.on("trip:student_picked", showPickupNotification);
```

---

## Troubleshooting

| Issue                                    | Cause                        | Solution                                             |
| ---------------------------------------- | ---------------------------- | ---------------------------------------------------- |
| **"Missing authentication credentials"** | Token/userId/role missing    | Ensure all three auth fields provided                |
| **"Invalid role"**                       | Role not driver/parent/admin | Check role is exactly 'driver', 'parent', or 'admin' |
| **"User ID mismatch"**                   | userId doesn't match token   | Use same userId from JWT payload                     |
| **"Role mismatch"**                      | Role doesn't match token     | Use role from JWT payload                            |
| **"Invalid or expired token"**           | JWT expired or invalid       | Refresh token and reconnect                          |
| **"Not authorized to access this trip"** | Driver doesn't own trip      | Check trip's driver_id matches                       |
| **"Not authorized to track this trip"**  | Parent has no child on trip  | Check trip_students has parent's child               |
| **"Invalid coordinates"**                | lat/lng out of range         | Latitude: -90 to 90, Longitude: -180 to 180          |
| **Position updates ignored**             | Rate limited                 | Wait 5 seconds between updates                       |
| **Events not received**                  | Not subscribed to trip       | Call subscribe_trip before expecting events          |

---

## Quick Code Examples

### Complete Driver Implementation

```javascript
const socket = io("http://localhost:3000", {
  auth: { token, userId, role: "driver" },
});

let positionInterval;

socket.on("connect", () => {
  console.log("✓ Connected as driver");

  // Subscribe to trip with callback
  socket.emit("driver:subscribe_trip", tripId, (success) => {
    if (success) {
      // Start trip
      socket.emit("driver:trip_started", tripId);

      // Begin position streaming (every 10 seconds)
      positionInterval = setInterval(() => {
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
      }, 10000);
    }
  });
});

// Pickup student
function pickupStudent(studentId) {
  socket.emit("driver:student_picked", { tripId, studentId });
}

// Complete trip
function completeTrip() {
  clearInterval(positionInterval);
  socket.emit("driver:trip_completed", tripId);
  socket.emit("driver:unsubscribe_trip", tripId);
}

socket.on("socket:error", (data) => {
  console.error("Error:", data.message);
});
```

### Complete Parent Implementation

```javascript
const socket = io("http://localhost:3000", {
  auth: { token, userId, role: "parent" },
});

socket.on("connect", () => {
  console.log("✓ Connected as parent");

  socket.emit("parent:subscribe_trip", tripId, (success) => {
    if (success) {
      console.log("✓ Now tracking trip");
    } else {
      console.log("✗ Cannot track this trip");
    }
  });
});

// Track driver position
socket.on("trip:position_update", (data) => {
  updateMapMarker(data.latitude, data.longitude);
  updateSpeedDisplay(data.speed);
});

// Trip events (broadcast to all parents)
socket.on("trip:started", () => showNotification("🚗 Trip started!"));
socket.on("trip:approaching", (data) =>
  showNotification(`📍 Arriving in ${data.eta}s`),
);
socket.on("trip:student_picked", () => showNotification("✓ A child picked up"));
socket.on("trip:student_dropped", () =>
  showNotification("✓ A child dropped off"),
);
socket.on("trip:completed", () => {
  showNotification("✅ Trip completed");
  socket.emit("parent:unsubscribe_trip", tripId);
});

// Parent-specific events (only YOUR child - auto-triggered by REST API)
socket.on("parent:my_student_picked", (data) => {
  showNotification(`✓ ${data.studentName} picked up!`);
});
socket.on("parent:my_student_dropped", (data) => {
  showNotification(`✓ ${data.studentName} dropped off!`);
});
socket.on("parent:my_student_approaching", (data) => {
  showNotification(`📍 Driver arriving for ${data.studentName}`);
});

// Route updates
socket.on("trip:route_calculated", (data) => {
  drawRouteOnMap(data.routeData);
});

// Error handling
socket.on("socket:error", (data) => {
  console.error("Socket error:", data.message);
});
```

---

**Status**: ✅ Production Ready  
**Last Updated**: February 10, 2026  
**Version**: 3.3.0

**Changes in v3.3.0**:

- Simplified room architecture: single `trip:{tripId}` room for both driver and parents
- Removed separate `:driver` and `:tracking` suffixes
- Driver and parents now share the same trip room
- Updated `SocketRoom` enum to reflect simplified architecture
- Improved broadcast efficiency with unified room

**Changes in v3.2.0**:

- Added Quick Reference section for event decision matrix
- Added Driver/Parent event tables with clear guidance
- Documented REST API + Socket event flow

**Changes in v3.1.0**:

- Added parent-specific notification events (`parent:my_student_picked`, `parent:my_student_dropped`, `parent:my_student_approaching`)
- Parents now auto-join personal room `parent:{parentId}` on connect
- REST API pickup/drop endpoints now automatically emit parent-specific notifications
- Added `ParentNotificationEvent` enum for parent-specific events
- Added `TrackingSocketService.notifyParentStudentPicked()`, `notifyParentStudentDropped()`, `notifyParentApproaching()`
- Updated room architecture documentation

**Changes in v3.0.0**:

- Added JWT token verification
- Added trip authorization checks (driver/parent)
- Added rate limiting for position updates (5 seconds)
- Using centralized event enums
- Using centralized error messages
- Added `socket:error` event for authorization failures
- Improved documentation with complete code examples
