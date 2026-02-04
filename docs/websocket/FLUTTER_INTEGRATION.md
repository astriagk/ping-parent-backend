# Flutter Integration Guide - Step-by-Step Implementation

**Version**: 3.0.0  
**Last Updated**: February 3, 2026  
**Framework**: Flutter / Dart  
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Driver App - Step-by-Step](#driver-app---step-by-step)
4. [Parent App - Step-by-Step](#parent-app---step-by-step)
5. [API Reference](#api-reference)
6. [Quick Code Reference](#quick-code-reference)

---

## Overview

This guide teaches you how to integrate real-time tracking in your Flutter app using three systems:

| System                  | Use Case                                                     | When                                                  |
| ----------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| **REST API - Trips**    | Start/end trips, pickup/dropoff students                     | Immediately (direct action)                           |
| **REST API - Tracking** | Calculate route, update position                             | When starting trip or every 15s                       |
| **WebSocket**           | Real-time position streaming to parents, event notifications | Background, continuous (driver) or listening (parent) |

---

## Architecture

### How the Three Systems Work Together

```
┌─────────────────────────────────────────────────────────┐
│                    DRIVER APP                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Start Trip (REST API)                              │
│     PATCH /api/trips/{tripId}/start                    │
│                                                          │
│  2. Calculate Route (REST API)                         │
│     POST /api/tracking/calculate                       │
│     or POST /api/tracking/tomtom                       │
│                                                          │
│  3. Stream Position (WebSocket + REST Backup)          │
│     Every 15 seconds:                                  │
│     - emit('driver:update_position') → WebSocket      │
│     - PATCH /api/tracking/{tripId}/position → REST    │
│                                                          │
│  4. Pickup/Dropoff Student (WebSocket + REST)          │
│     - emit('driver:student_picked') → WebSocket       │
│     - PATCH /api/trips/{tripId}/students/{id}/pickup → │
│                                                          │
│  5. End Trip (REST API)                                │
│     PATCH /api/trips/{tripId}/end                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌───────────────────────────────────┐
        │   WebSocket + REST APIs           │
        │   (Backend Server)                │
        └───────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   PARENT APP                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Get Initial Route (REST API)                       │
│     GET /api/tracking/{tripId}/details                 │
│                                                          │
│  2. Subscribe to Trip (WebSocket)                      │
│     emit('parent:subscribe_trip', {tripId})            │
│                                                          │
│  3. Listen to Events (WebSocket)                       │
│     - trip:position_update (every 15s)                 │
│     - student:picked_up                                │
│     - student:dropped_off                              │
│     - trip:route_updated                               │
│     - trip:completed                                   │
│                                                          │
│  4. Manual Check (Optional REST API)                   │
│     GET /api/tracking/{tripId}/current-position        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Independent WebSocket Events (Separate from REST APIs)

### Keeping REST & WebSocket Separate

If your REST APIs and WebSocket are **completely separate** (recommended for clean architecture):

```
Architecture:
┌──────────────────────────────┐
│     REST APIs (Database)     │  ← Persists data
│  PATCH /api/trips/{id}/start │
│  POST /api/trips/{id}/pickup │
└──────────────────────────────┘
           (separate)
┌──────────────────────────────┐
│   WebSocket Events (Real-time)│  ← Notifies subscribers
│  emit('driver:trip_started')  │
│  emit('driver:student_picked')│
└──────────────────────────────┘
```

### Driver App: WebSocket-Only Approach

**Example 1: Emit trip started WITHOUT REST call**

```dart
// Option A: WebSocket only (no REST API)
void startTripViaWebSocket(String tripId) {
  socket.emit('driver:trip_started', {
    'tripId': tripId,
  }, (response) {
    print('✓ Trip started broadcasted to parents');
    // Parents notified immediately
    // Database update happens separately (via REST or other system)
  });
}
```

**Example 2: REST call separate, WebSocket separate**

```dart
// Step 1: Update database via REST
Future<void> updateTripStatusToStarted(String tripId) async {
  await http.patch(
    Uri.parse('$baseUrl/api/trips/$tripId/status'),
    headers: {'Authorization': 'Bearer $token'},
    body: jsonEncode({'trip_status': 'STARTED'}),
  );
  // Database updated, but no parents notified yet
}

// Step 2: Notify parents via WebSocket (completely separate)
void notifyParentsTripStarted(String tripId) {
  socket.emit('driver:trip_started', {'tripId': tripId});
  // Now parents are notified
}

// Use together but separately:
Future<void> startTrip(String tripId) async {
  // Update database
  await updateTripStatusToStarted(tripId);

  // Then notify (separate step)
  notifyParentsTripStarted(tripId);
}
```

**Example 3: Independent position streaming (WebSocket only)**

```dart
// Stream position WITHOUT saving to database
// (saving to database happens via separate REST endpoint)
Future<void> streamPositionViaWebSocket(String tripId) async {
  final positionStream = Geolocator.getPositionStream(
    locationSettings: LocationSettings(
      accuracy: LocationAccuracy.best,
      distanceFilter: 10, // 10 meters
    ),
  );

  positionStream.listen((Position position) {
    // Send to WebSocket only (real-time to parents)
    socket.emit('driver:update_position', {
      'tripId': tripId,
      'latitude': position.latitude,
      'longitude': position.longitude,
      'speed': position.speed ?? 0,
      'heading': position.heading ?? 0,
      'accuracy': position.accuracy ?? 0,
    });
    // Database save is SEPARATE (via background REST call or scheduled job)
  });
}

// Database save happens separately:
Future<void> savePositionToDatabase(String tripId, Position pos) async {
  // This is independent - called separately, maybe every 30 seconds
  await http.patch(
    Uri.parse('$baseUrl/api/tracking/$tripId/position'),
    body: jsonEncode({
      'latitude': pos.latitude,
      'longitude': pos.longitude,
      'speed': pos.speed,
      'heading': pos.heading,
      'accuracy': pos.accuracy,
    }),
  );
}
```

### Parent App: WebSocket-Only Approach

**Example: Listen to WebSocket WITHOUT making REST calls**

```dart
void setupParentTracking(String tripId) {
  // Just subscribe and listen
  socket.emit('parent:subscribe_trip', {'tripId': tripId});

  // Listen to position updates (WebSocket only)
  socket.on('trip:position_update', (data) {
    print('✓ Driver position: ${data['latitude']}, ${data['longitude']}');
    updateMapMarker(data);
    // No REST API call needed
  });

  // Listen to pickup events (WebSocket only)
  socket.on('student:picked_up', (data) {
    print('✓ Student ${data['studentId']} picked up');
    updateWaypointMarker(data['studentId'], 'PICKED_UP');
    // No REST API call needed
  });

  // Listen to trip completion (WebSocket only)
  socket.on('trip:completed', (data) {
    print('✓ Trip completed');
    showCompletionScreen(data);
    // If you need full details, THEN make REST call
    fetchTripSummary(tripId); // Optional: separate REST call if needed
  });
}
```

### Backend: Broadcast WebSocket Events Separately

**Create separate broadcast endpoints** that DON'T update database:

```dart
// In your backend (Dart/Flutter isn't used for backend, but concept applies)
// This would be in your Node.js/Express backend

// POST /api/broadcast/trip-started (WebSocket only, no DB update)
// POST /api/broadcast/student-pickup (WebSocket only, no DB update)
// POST /api/broadcast/position-update (WebSocket only, no DB update)

// These endpoints ONLY emit WebSocket events
// Database updates are handled by SEPARATE endpoints:
// PATCH /api/trips/{id}/status (DB update only, no WebSocket)
// PATCH /api/trips/{id}/students/{id}/pickup (DB update only, no WebSocket)
```

Then in your Flutter app, you can call them separately:

```dart
Future<void> syncTripStarted(String tripId, String driverId) async {
  // Step 1: Update database
  await http.patch(
    Uri.parse('$baseUrl/api/trips/$tripId/status'),
    body: jsonEncode({'trip_status': 'STARTED'}),
  );

  // Step 2: Broadcast to parents (separate call)
  await http.post(
    Uri.parse('$baseUrl/api/broadcast/trip-started'),
    body: jsonEncode({'tripId': tripId, 'driverId': driverId}),
  );
}

Future<void> syncStudentPickup(String tripId, String studentId, String driverId) async {
  // Step 1: Update database
  await http.patch(
    Uri.parse('$baseUrl/api/trips/$tripId/students/$studentId/pickup'),
    body: jsonEncode({'picked_up_timestamp': DateTime.now().toIso8601String()}),
  );

  // Step 2: Broadcast to parents (separate call)
  await http.post(
    Uri.parse('$baseUrl/api/broadcast/student-pickup'),
    body: jsonEncode({'tripId': tripId, 'studentId': studentId, 'driverId': driverId}),
  );
}
```

### Summary: Independent Calling Patterns

| Pattern            | When                    | How                                 |
| ------------------ | ----------------------- | ----------------------------------- |
| **WebSocket Only** | Real-time notifications | `socket.emit('driver:...')`         |
| **REST Only**      | Database updates        | `http.patch('/api/trips/...')`      |
| **Separate Calls** | Both DB + notify        | Call REST, then call broadcast API  |
| **Async Separate** | Decouple operations     | Emit WebSocket first, save DB later |

---

## Driver App - Step-by-Step

### Step 1: Setup (One Time)

**What you need to install:**

```yaml
dependencies:
  socket_io_client: ^1.0.2
  http: ^0.13.5
  geolocator: ^9.0.2
  google_maps_flutter: ^2.5.0
  provider: ^6.0.5
```

**Permissions needed:**

- Android: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- iOS: `NSLocationWhenInUseUsageDescription`

**Initialize WebSocket once when app starts:**

```dart
// main.dart or app.dart
void initializeTracking() {
  final socket = IO.io('https://your-server.com', IO.OptionBuilder()
    .setAuth({'token': userToken, 'userId': userId, 'role': 'driver'})
    .enableAutoConnect()
    .build());

  socket.onConnect((_) => print('✓ Connected to tracking'));
  socket.onDisconnect((_) => print('✗ Disconnected'));
}
```

---

### Step 2: Start Trip

**When: Driver clicks "Start Trip" button**

**What to do:**

1. Call REST API to start trip (persists to database)
2. Subscribe to trip via WebSocket (joins room)
3. Start getting location permissions

**Code outline:**

```dart
Future<void> startTrip(String tripId) async {
  try {
    // Step 1: REST API - Start trip
    final response = await http.patch(
      Uri.parse('$baseUrl/api/trips/$tripId/start'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to start trip');
    }

    // Step 2: WebSocket - Subscribe to trip
    socket.emit('driver:subscribe_trip', {'tripId': tripId}, (ack) {
      if (ack != null && ack['success'] == true) {
        print('✓ Subscribed to trip via WebSocket');
      }
    });

    // Step 3: Request location permissions
    final permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied) {
      throw Exception('Location permission denied');
    }

  } catch (e) {
    showError('Failed to start trip: $e');
  }
}
```

---

### Step 3: Calculate Route

**When: Immediately after starting trip**

**What to do:**

1. Get list of students to pick up
2. Call ONE of two route calculation APIs
3. Display route on map with waypoints

**Choose your method:**

| Method        | Speed  | Accuracy | Cost     | When to Use   |
| ------------- | ------ | -------- | -------- | ------------- |
| **Haversine** | <100ms | Lower    | Free     | Quick preview |
| **TomTom**    | 1-3s   | Higher   | API cost | Production    |

**Code outline - Haversine (Fast):**

```dart
Future<Map<String, dynamic>> calculateHaversineRoute(
  String tripId,
  List<Student> students,
) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/tracking/calculate'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'tripId': tripId,
      'students': students.map((s) => {
        'id': s.id,
        'pickupLat': s.pickupLatitude,
        'pickupLng': s.pickupLongitude,
      }).toList(),
    }),
  );

  if (response.statusCode == 201) {
    final data = jsonDecode(response.body);
    return data['data']; // Returns: routeGeometry, waypoints, estimatedDistance
  }
  throw Exception('Failed to calculate route');
}
```

**Code outline - TomTom (Accurate):**

```dart
Future<Map<String, dynamic>> calculateTomTomRoute(
  String tripId,
  List<Student> students,
) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/tracking/tomtom'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'tripId': tripId,
      'students': students.map((s) => {
        'id': s.id,
        'pickupLat': s.pickupLatitude,
        'pickupLng': s.pickupLongitude,
      }).toList(),
    }),
  );

  if (response.statusCode == 201) {
    final data = jsonDecode(response.body);
    return data['data'];
  }
  throw Exception('Failed to calculate TomTom route');
}
```

**Response format (from both methods):**

```dart
{
  "routeGeometry": [
    {"latitude": 12.9716, "longitude": 77.5946},
    {"latitude": 12.9720, "longitude": 77.5950},
    // ... more points
  ],
  "waypoints": [
    {
      "id": "student_1",
      "studentName": "John",
      "latitude": 12.98,
      "longitude": 77.60,
      "eta": "10 mins",
      "address": "Home Address"
    },
    // ... more students
  ],
  "estimatedDistance": 15.5,
  "estimatedDuration": 1800
}
```

---

### Step 4: Display Route on Map

**When: After receiving route response**

**What to do:**

1. Draw blue polyline for route
2. Add numbered markers for each student (sequence)
3. Update map view to show entire route

**Code outline:**

```dart
void displayRoute(Map<String, dynamic> route) {
  // 1. Extract data
  final routePoints = route['routeGeometry'] as List;
  final waypoints = route['waypoints'] as List;

  // 2. Convert to LatLng for map
  final routePath = routePoints.map<LatLng>((p) {
    return LatLng(
      (p['latitude'] as num).toDouble(),
      (p['longitude'] as num).toDouble(),
    );
  }).toList();

  // 3. Draw polyline (blue line)
  setState(() {
    polylines.add(Polyline(
      polylineId: PolylineId('route'),
      points: routePath,
      color: Colors.blue,
      width: 3,
    ));
  });

  // 4. Add waypoint markers (with numbers 1, 2, 3...)
  waypoints.asMap().forEach((index, waypoint) {
    final marker = Marker(
      markerId: MarkerId('waypoint_${waypoint['id']}'),
      position: LatLng(
        (waypoint['latitude'] as num).toDouble(),
        (waypoint['longitude'] as num).toDouble(),
      ),
      infoWindow: InfoWindow(
        title: waypoint['studentName'],
        snippet: 'ETA: ${waypoint['eta']}',
      ),
      icon: BitmapDescriptor.defaultMarkerWithHue(
        BitmapDescriptor.hueBlue,
      ),
    );

    setState(() {
      markers.add(marker);
    });
  });

  // 5. Fit map to show entire route
  final bounds = LatLngBounds(
    southwest: LatLng(
      routePath.map((p) => p.latitude).reduce((a, b) => a < b ? a : b),
      routePath.map((p) => p.longitude).reduce((a, b) => a < b ? a : b),
    ),
    northeast: LatLng(
      routePath.map((p) => p.latitude).reduce((a, b) => a > b ? a : b),
      routePath.map((p) => p.longitude).reduce((a, b) => a > b ? a : b),
    ),
  );

  mapController.animateCamera(CameraUpdateOptions(bounds: bounds));
}
```

---

### Step 5: Stream Position (Background)

**When: After displaying route, runs continuously**

**What to do:**

1. Get device location every 10-30 seconds
2. Send via WebSocket (real-time to parents)
3. Also send via REST API (backup to database)
4. Continue until trip ends

**Code outline:**

```dart
Future<void> startPositionStreaming(String tripId) async {
  // Stream location every 10 meters OR every 30 seconds
  final positionStream = Geolocator.getPositionStream(
    locationSettings: LocationSettings(
      accuracy: LocationAccuracy.bestForNavigation,
      distanceFilter: 10, // Update every 10 meters
      timeLimit: Duration(seconds: 30), // Or max 30 seconds
    ),
  );

  positionStream.listen((Position position) async {
    try {
      // WebSocket: Real-time to parents
      socket.emit('driver:update_position', {
        'tripId': tripId,
        'latitude': position.latitude,
        'longitude': position.longitude,
        'speed': position.speed,
        'heading': position.heading,
        'accuracy': position.accuracy,
      });

      // REST API: Backup to database (in background, don't wait)
      _updatePositionViaRest(tripId, position);

    } catch (e) {
      print('Error updating position: $e');
    }
  });
}

Future<void> _updatePositionViaRest(String tripId, Position pos) async {
  try {
    await http.patch(
      Uri.parse('$baseUrl/api/tracking/$tripId/position'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'latitude': pos.latitude,
        'longitude': pos.longitude,
        'speed': pos.speed,
        'heading': pos.heading,
        'accuracy': pos.accuracy,
      }),
    );
  } catch (e) {
    print('Failed to update position via REST: $e');
  }
}
```

---

### Step 6: Handle Student Pickup

**When: Driver arrives at first waypoint and taps "Pickup" button**

**What to do:**

1. Send WebSocket event (real-time notification to parents)
2. Send REST API call (persist pickup time)
3. Update UI (mark student as picked up)

**Code outline:**

```dart
Future<void> pickupStudent(String tripId, String studentId) async {
  try {
    // 1. WebSocket notification (parents see immediately)
    socket.emit('driver:student_picked', {
      'tripId': tripId,
      'studentId': studentId,
    });

    // 2. REST API call (save to database)
    final response = await http.patch(
      Uri.parse('$baseUrl/api/trips/$tripId/students/$studentId/pickup'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'picked_up_timestamp': DateTime.now().toIso8601String(),
      }),
    );

    if (response.statusCode == 200) {
      // 3. Update UI
      setState(() {
        // Mark student as picked up in your UI
        _updateStudentStatus(studentId, 'PICKED_UP');
      });

      showNotification('Student ${studentId} picked up');
    }
  } catch (e) {
    showError('Failed to pickup student: $e');
  }
}
```

---

### Step 7: Handle Student Dropoff

**When: Driver arrives at destination and taps "Dropoff" button**

**Similar to pickup - same pattern:**

```dart
Future<void> dropoffStudent(String tripId, String studentId) async {
  try {
    // 1. WebSocket
    socket.emit('driver:student_dropped', {
      'tripId': tripId,
      'studentId': studentId,
    });

    // 2. REST API
    await http.patch(
      Uri.parse('$baseUrl/api/trips/$tripId/students/$studentId/dropoff'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'dropped_off_timestamp': DateTime.now().toIso8601String(),
      }),
    );

    // 3. Update UI
    _updateStudentStatus(studentId, 'DROPPED_OFF');
    showNotification('Student ${studentId} dropped off');

  } catch (e) {
    showError('Failed to dropoff student: $e');
  }
}
```

---

### Step 8: Recalculate Route (When Needed)

**When: Driver takes a different route (accident, traffic, etc.)**

**What to do:**

1. Get list of remaining students (not yet picked up)
2. Call route calculation API again
3. Update map with new route

**Code outline:**

```dart
Future<void> recalculateRoute(String tripId) async {
  try {
    // 1. Get remaining students
    final remaining = _getRemainingStudents(); // Your logic

    // 2. Call API (same as Step 3, but with remaining students only)
    final response = await http.post(
      Uri.parse('$baseUrl/api/tracking/$tripId/recalculate'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'students': remaining.map((s) => {
          'id': s.id,
          'pickupLat': s.pickupLatitude,
          'pickupLng': s.pickupLongitude,
        }).toList(),
      }),
    );

    if (response.statusCode == 200) {
      final newRoute = jsonDecode(response.body)['data'];

      // 3. Update map
      displayRoute(newRoute);

      showNotification('Route recalculated');
    }
  } catch (e) {
    showError('Failed to recalculate route: $e');
  }
}
```

---

### Step 9: End Trip

**When: All students dropped off, driver clicks "Complete Trip"**

**What to do:**

1. Stop position streaming
2. Send completion event via WebSocket
3. End trip via REST API
4. Show summary

**Code outline:**

```dart
Future<void> endTrip(String tripId) async {
  try {
    // 1. Stop position streaming
    _positionStreamSubscription?.cancel();

    // 2. WebSocket notification
    socket.emit('driver:trip_completed', {'tripId': tripId});

    // 3. REST API
    final response = await http.patch(
      Uri.parse('$baseUrl/api/trips/$tripId/end'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      final tripSummary = jsonDecode(response.body)['data'];

      // 4. Show summary
      showTripSummary(tripSummary);
      // Shows: actualDistance, actualDuration, allPickupDropoffTimes
    }
  } catch (e) {
    showError('Failed to end trip: $e');
  }
}
```

---

## Parent App - Step-by-Step

### Step 1: Setup (One Time)

**Initialize WebSocket once when app starts:**

```dart
void initializeParentTracking() {
  final socket = IO.io('https://your-server.com', IO.OptionBuilder()
    .setAuth({'token': userToken, 'userId': userId, 'role': 'parent'})
    .enableAutoConnect()
    .build());

  socket.onConnect((_) => print('✓ Connected to tracking'));
}
```

---

### Step 2: Load Initial Route

**When: Parent clicks on an active trip to track**

**What to do:**

1. Fetch route details via REST API
2. Display route on map
3. Then subscribe to WebSocket for real-time updates

**Code outline:**

```dart
Future<void> loadTripRoute(String tripId) async {
  try {
    // 1. Get initial route data
    final response = await http.get(
      Uri.parse('$baseUrl/api/tracking/$tripId/details'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      final tripDetails = jsonDecode(response.body)['data'];

      // 2. Display route
      displayRoute(tripDetails['route'], tripDetails['waypoints']);

      // 3. Show initial driver position
      if (tripDetails['currentPosition'] != null) {
        showDriverMarker(tripDetails['currentPosition']);
      }
    }
  } catch (e) {
    showError('Failed to load route: $e');
  }
}

void displayRoute(Map<String, dynamic> route, List<dynamic> waypoints) {
  // Draw blue polyline
  final coordinates = route['coordinates'] as List;
  final points = coordinates.map<LatLng>((c) {
    return LatLng(
      (c['latitude'] as num).toDouble(),
      (c['longitude'] as num).toDouble(),
    );
  }).toList();

  setState(() {
    polylines.add(Polyline(
      polylineId: PolylineId('route'),
      points: points,
      color: Colors.blue,
      width: 2,
    ));
  });

  // Add waypoint markers (blue = pending, yellow = picked, green = dropped)
  waypoints.forEach((waypoint) {
    final color = waypoint['status'] == 'DROPPED_OFF'
        ? Colors.green
        : waypoint['status'] == 'PICKED_UP'
            ? Colors.yellow
            : Colors.blue;

    setState(() {
      markers.add(Marker(
        markerId: MarkerId('waypoint_${waypoint['id']}'),
        position: LatLng(
          (waypoint['latitude'] as num).toDouble(),
          (waypoint['longitude'] as num).toDouble(),
        ),
        infoWindow: InfoWindow(
          title: waypoint['studentName'],
          snippet: 'Status: ${waypoint['status']}',
        ),
        icon: BitmapDescriptor.defaultMarkerWithHue(
          color == Colors.green
              ? BitmapDescriptor.hueGreen
              : color == Colors.yellow
                  ? BitmapDescriptor.hueYellow
                  : BitmapDescriptor.hueBlue,
        ),
      ));
    });
  });
}
```

---

### Step 3: Subscribe to Trip via WebSocket

**When: After loading initial route**

**What to do:**

1. Subscribe to trip (join WebSocket room)
2. Setup event listeners
3. Ready to receive real-time updates

**Code outline:**

```dart
void subscribeToDri Trip(String tripId) {
  // Subscribe to trip
  socket.emit('parent:subscribe_trip', {'tripId': tripId}, (response) {
    if (response != null && response['success'] == true) {
      print('✓ Subscribed to trip via WebSocket');

      // Setup listeners
      setupEventListeners(tripId);
    }
  });
}

void setupEventListeners(String tripId) {
  // Position update every 15 seconds
  socket.on('trip:position_update', (data) {
    if (data['tripId'] == tripId) {
      updateDriverMarker(data);
    }
  });

  // Student picked up
  socket.on('student:picked_up', (data) {
    if (data['tripId'] == tripId) {
      updateWaypointMarker(data['studentId'], 'PICKED_UP');
      showNotification('✓ ${data['studentName']} picked up!');
    }
  });

  // Student dropped off
  socket.on('student:dropped_off', (data) {
    if (data['tripId'] == tripId) {
      updateWaypointMarker(data['studentId'], 'DROPPED_OFF');
      showNotification('✓ ${data['studentName']} dropped off!');
    }
  });

  // Trip completed
  socket.on('trip:completed', (data) {
    if (data['tripId'] == tripId) {
      showNotification('✓ Trip completed!');
      showTripSummary(data); // Shows total distance, time, etc.
      unsubscribeFromTrip(tripId);
    }
  });

  // Route recalculated (if driver takes different route)
  socket.on('trip:route_updated', (data) {
    if (data['tripId'] == tripId) {
      // Update map with new route
      displayRoute(data['routeGeometry'], data['waypoints']);
      showNotification('Route updated');
    }
  });

  // Driver approaching waypoint
  socket.on('waypoint:approaching', (data) {
    if (data['tripId'] == tripId) {
      showNotification(
        '📍 Driver is ${data['distance']}m away - ETA: ${data['eta']}'
      );
    }
  });
}
```

---

### Step 4: Handle Real-Time Updates

**When: WebSocket events arrive (every 15 seconds for position)**

**Update driver marker on map (position_update event):**

```dart
void updateDriverMarker(Map<String, dynamic> positionData) {
  final position = LatLng(
    (positionData['latitude'] as num).toDouble(),
    (positionData['longitude'] as num).toDouble(),
  );

  setState(() {
    markers.removeWhere((m) => m.markerId.value == 'driver');

    markers.add(Marker(
      markerId: MarkerId('driver'),
      position: position,
      infoWindow: InfoWindow(
        title: 'Driver',
        snippet: 'Speed: ${positionData['speed']} m/s',
      ),
      icon: BitmapDescriptor.defaultMarkerWithHue(
        BitmapDescriptor.hueGreen,
      ),
    ));
  });

  // Auto-center on driver (optional)
  mapController.animateCamera(
    CameraUpdateOptions(target: position),
  );
}

// Update waypoint marker when student picked up or dropped off
void updateWaypointMarker(String studentId, String newStatus) {
  setState(() {
    markers = markers.map((marker) {
      if (marker.markerId.value == 'waypoint_$studentId') {
        final color = newStatus == 'DROPPED_OFF'
            ? BitmapDescriptor.hueGreen
            : BitmapDescriptor.hueYellow;

        return marker.copyWith(
          iconParam: BitmapDescriptor.defaultMarkerWithHue(color),
          infoWindowParam: InfoWindow(
            title: marker.infoWindow.title,
            snippet: 'Status: $newStatus',
          ),
        );
      }
      return marker;
    }).toList();
  });
}
```

---

### Step 5: Manual Checks (Optional)

**When: Parent wants to manually check current driver position or history**

**Get current driver position:**

```dart
Future<void> checkCurrentPosition(String tripId) async {
  try {
    final response = await http.get(
      Uri.parse('$baseUrl/api/tracking/$tripId/current-position'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      final position = jsonDecode(response.body)['data'];
      print('Current position: ${position['latitude']}, ${position['longitude']}');
    }
  } catch (e) {
    showError('Failed to get position: $e');
  }
}
```

**Get full tracking history (after trip completes):**

```dart
Future<void> getTripHistory(String tripId) async {
  try {
    final response = await http.get(
      Uri.parse('$baseUrl/api/tracking/$tripId/tracking?limit=100'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      final history = jsonDecode(response.body)['data'] as List;
      // Show replay or full journey
      replayTripPath(history);
    }
  } catch (e) {
    showError('Failed to get history: $e');
  }
}
```

---

### Step 6: Unsubscribe from Trip

**When: Trip completes or parent exits tracking screen**

**Code outline:**

```dart
void unsubscribeFromTrip(String tripId) {
  socket.emit('parent:unsubscribe_trip', {'tripId': tripId}, (response) {
    if (response != null && response['success'] == true) {
      print('✓ Unsubscribed from trip');
    }
  });

  // Cleanup
  setState(() {
    markers.clear();
    polylines.clear();
  });
}
```

---

## API Reference

### Trip Management (REST APIs)

| Endpoint                                           | Method | When            | Request                   | Response                                                        |
| -------------------------------------------------- | ------ | --------------- | ------------------------- | --------------------------------------------------------------- |
| `/api/trips/{tripId}/start`                        | PATCH  | Start trip      | empty                     | `{tripId, status: "STARTED"}`                                   |
| `/api/trips/{tripId}/end`                          | PATCH  | Complete trip   | empty                     | `{tripId, status: "COMPLETED", actualDistance, actualDuration}` |
| `/api/trips/{tripId}/students/{studentId}/pickup`  | PATCH  | Pickup student  | `{picked_up_timestamp}`   | `{studentId, status: "PICKED_UP"}`                              |
| `/api/trips/{tripId}/students/{studentId}/dropoff` | PATCH  | Dropoff student | `{dropped_off_timestamp}` | `{studentId, status: "DROPPED_OFF"}`                            |

### Tracking - Route Calculation (REST APIs)

| Endpoint                             | Method | When                                | Speed   | Request                                            | Response                                                           |
| ------------------------------------ | ------ | ----------------------------------- | ------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| `/api/tracking/calculate`            | POST   | Calculate fast route                | <100ms  | `{tripId, students: [{id, pickupLat, pickupLng}]}` | `{routeGeometry, waypoints, estimatedDistance, estimatedDuration}` |
| `/api/tracking/tomtom`               | POST   | Calculate accurate route            | 1-3s    | Same as above                                      | Same as above                                                      |
| `/api/tracking/{tripId}/recalculate` | POST   | Recalculate with remaining students | Depends | Same body                                          | Same response                                                      |

### Tracking - Position & Details (REST APIs)

| Endpoint                                  | Method | Who    | Response                                                            |
| ----------------------------------------- | ------ | ------ | ------------------------------------------------------------------- |
| `/api/tracking/{tripId}/position`         | PATCH  | Driver | Save current position                                               |
| `/api/tracking/{tripId}/details`          | GET    | Parent | `{route, waypoints, currentPosition, totalDistance, totalDuration}` |
| `/api/tracking/{tripId}/current-position` | GET    | Parent | `{latitude, longitude, speed, heading, timestamp}`                  |
| `/api/tracking/{tripId}/tracking`         | GET    | Parent | `[{latitude, longitude, speed, timestamp}, ...]`                    |

### WebSocket Events

**Driver emits:**

- `driver:subscribe_trip` → Subscribe to trip room
- `driver:update_position` → Send position (every 15s)
- `driver:student_picked` → Student picked up
- `driver:student_dropped` → Student dropped off
- `driver:trip_completed` → Trip finished

**Parent listens:**

- `trip:position_update` → Driver position (every 15s)
- `student:picked_up` → Student picked up event
- `student:dropped_off` → Student dropped off event
- `trip:completed` → Trip finished
- `trip:route_updated` → Route recalculated
- `waypoint:approaching` → Driver approaching waypoint

---

## Quick Code Reference

### Minimal Driver Example

```dart
class DriverApp {
  final socket = IO.io('https://server.com',
    IO.OptionBuilder()
      .setAuth({'token': token, 'role': 'driver'})
      .build());

  void startTracking(String tripId) async {
    // 1. Start trip
    await http.patch('/api/trips/$tripId/start');
    socket.emit('driver:subscribe_trip', {'tripId': tripId});

    // 2. Get route
    final route = await http.post('/api/tracking/calculate', ...);
    displayRoute(route);

    // 3. Stream position
    Geolocator.getPositionStream(...).listen((pos) {
      socket.emit('driver:update_position', {
        'tripId': tripId,
        'latitude': pos.latitude,
        'longitude': pos.longitude,
      });
    });

    // 4. Pickup/Dropoff
    socket.emit('driver:student_picked', {'tripId': tripId, 'studentId': sid});

    // 5. End
    await http.patch('/api/trips/$tripId/end');
  }
}
```

### Minimal Parent Example

```dart
class ParentApp {
  final socket = IO.io('https://server.com',
    IO.OptionBuilder()
      .setAuth({'token': token, 'role': 'parent'})
      .build());

  void watchTrip(String tripId) async {
    // 1. Load initial route
    final route = await http.get('/api/tracking/$tripId/details');
    displayRoute(route);

    // 2. Subscribe
    socket.emit('parent:subscribe_trip', {'tripId': tripId});

    // 3. Listen to updates
    socket.on('trip:position_update', (data) {
      updateDriverMarker(data);
    });

    socket.on('student:picked_up', (data) {
      showNotification('Student picked up!');
    });

    socket.on('trip:completed', (data) {
      unsubscribeFromTrip(tripId);
    });
  }
}
```

---

**Status**: ✅ Production Ready  
**Last Updated**: February 3, 2026  
**Version**: 3.0.0
