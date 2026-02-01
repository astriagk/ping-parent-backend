# WebSocket Real-Time Tracking Documentation

**Version**: 2.0.0  
**Last Updated**: January 26, 2026  
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Connection Setup](#connection-setup)
3. [Driver Events](#driver-events)
4. [Parent Events](#parent-events)
5. [Event Reference](#event-reference)
6. [Room Architecture](#room-architecture)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

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
