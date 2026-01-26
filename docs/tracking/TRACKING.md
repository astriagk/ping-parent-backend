# Tracking Module - Complete Implementation Guide

Real-time driver tracking and route optimization with TomTom Maps API integration.

## Quick Overview

The Tracking module enables:

- **Route Optimization**: Calculates optimal pickup/drop sequence using TomTom API
- **Real-time Tracking**: Stores and retrieves driver positions during trips
- **Parent Visibility**: Parents can track assigned drivers in real-time
- **ETA Calculation**: Auto-calculates estimated arrival time for each student

---

## Setup (5 minutes)

### 1. Environment Configuration

```bash
# Add to .env file:
TOMTOM_API_KEY=your_api_key_here
```

Get API key from: https://developer.tomtom.com/

### 2. Verify Installation

```bash
# Check module files exist
ls src/modules/tracking/

# Check TomTom service
ls src/shared/services/tomtom.service.ts
```

### 3. Start Server

```bash
npm install
npm start
```

---

## API Endpoints

### 1️⃣ Calculate Optimal Route

**POST** `/api/tracking/calculate`

Calculate the best route sequence for a trip.

**Authentication**: Driver token required

**Request**:

```json
{
  "trip_id": "TRP-ABC123",
  "current_latitude": 28.6139,
  "current_longitude": 77.209,
  "pickup_points": [
    {
      "latitude": 28.5721,
      "longitude": 77.2068,
      "student_id": "STU-001"
    }
  ]
}
```

**Response (201)**:

```json
{
  "success": true,
  "data": {
    "trip_id": "TRP-ABC123",
    "total_distance": 15.8,
    "total_duration": 1200,
    "waypoints_optimized": [
      {
        "latitude": 28.5721,
        "longitude": 77.2068,
        "student_id": "STU-001",
        "sequence_order": 1,
        "estimated_arrival_time": "2024-01-26T10:35:00Z",
        "distance_from_previous": 2.5,
        "duration_from_previous": 450
      }
    ],
    "route_geometry": {
      "coordinates": [[28.6139, 77.209], [28.5721, 77.2068], ...],
      "total_distance": 15.8,
      "total_duration": 1200
    },
    "trip_students_updated": 2
  },
  "message": "Route calculated and optimized successfully"
}
```

**What it does**:

1. Fetches all students assigned to the trip
2. Gets their home addresses from database
3. Calls TomTom Matrix API to find optimal sequence
4. Calls TomTom Routing API to get turn-by-turn coordinates
5. Calculates ETA for each student
6. Saves route to trips.optimized_route_data
7. Updates trip_students with sequence_order and estimated_arrival_time

---

### 2️⃣ Update Driver Position

**PATCH** `/api/tracking/{tripId}/position`

Send current driver position (called every 10-30 seconds from driver app).

**Authentication**: Driver token required

**Request**:

```json
{
  "latitude": 28.5735,
  "longitude": 77.2055,
  "speed": 45.5,
  "heading": 225.5,
  "accuracy": 10.2
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "tracking_id": "LOC-ABC123",
    "trip_id": "TRP-ABC123",
    "driver_id": "DRIV-001",
    "latitude": 28.5735,
    "longitude": 77.2055,
    "speed": 45.5,
    "timestamp": "2024-01-26T10:30:45Z"
  },
  "message": "Position updated successfully"
}
```

**What it does**:

1. Validates position is within route corridor (±200m buffer)
2. Creates location_tracking record
3. Stores in location_tracking collection
4. Parents can then fetch this via polling/WebSocket

---

### 3️⃣ Get Tracking History

**GET** `/api/tracking/{tripId}/tracking`

Get all position updates for a trip (no authentication needed).

**Query Parameters**:

- `limit` (optional, default: 100): Max number of records to return

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "tracking_id": "LOC-ABC123",
      "trip_id": "TRP-ABC123",
      "driver_id": "DRIV-001",
      "latitude": 28.5735,
      "longitude": 77.2055,
      "speed": 45.5,
      "heading": 225.5,
      "accuracy": 10.2,
      "timestamp": "2024-01-26T10:30:45Z"
    },
    {
      "tracking_id": "LOC-ABC124",
      "trip_id": "TRP-ABC123",
      "driver_id": "DRIV-001",
      "latitude": 28.574,
      "longitude": 77.206,
      "speed": 48.2,
      "heading": 225.8,
      "accuracy": 10.5,
      "timestamp": "2024-01-26T10:31:00Z"
    }
  ],
  "count": 45,
  "message": "Tracking data retrieved successfully"
}
```

**Perfect for**: Trip replay, analyzing driver behavior, or showing full journey history.

---

### 4️⃣ Get Current Driver Position

**GET** `/api/tracking/{tripId}/current-position`

Get the latest driver position for a trip (no authentication needed).

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "tracking_id": "LOC-ABC123",
    "trip_id": "TRP-ABC123",
    "driver_id": "DRIV-001",
    "latitude": 28.5735,
    "longitude": 77.2055,
    "speed": 45.5,
    "heading": 225.5,
    "accuracy": 10.2,
    "timestamp": "2024-01-26T10:30:45Z"
  },
  "message": "Current position retrieved successfully"
}
```

---

### 5️⃣ Get Route Details

**GET** `/api/tracking/{tripId}/details`

Get complete route with geometry, waypoints, and current position (no authentication needed).

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "trip_id": "TRP-ABC123",
    "trip_type": "pickup",
    "trip_status": "in_progress",
    "trip_date": "2024-01-26",
    "total_distance": 15.8,
    "optimized_route_data": {
      "waypoints": [
        {
          "latitude": 28.5721,
          "longitude": 77.2068,
          "address": "Student Home 1, Delhi",
          "student_id": "STU-001",
          "distance_from_previous": 2.5,
          "duration_from_previous": 450,
          "estimated_arrival_time": "2024-01-26T10:35:00Z"
        }
      ],
      "coordinates": [[28.6139, 77.209], [28.5721, 77.2068], ...],
      "total_distance": 15.8,
      "total_duration": 1200
    },
    "current_position": {
      "tracking_id": "LOC-ABC123",
      "trip_id": "TRP-ABC123",
      "driver_id": "DRIV-001",
      "latitude": 28.5735,
      "longitude": 77.2055,
      "speed": 45.5,
      "heading": 225.5,
      "accuracy": 10.2,
      "timestamp": "2024-01-26T10:30:45Z"
    },
    "trip_students": [
      {
        "trip_student_id": "TPS-001",
        "student_id": "STU-001",
        "sequence_order": 1,
        "estimated_arrival_time": "2024-01-26T10:35:00Z"
      }
    ]
  },
  "message": "Route details retrieved successfully"
}
```

**Perfect for**: Displaying full route on map with all waypoints and current position.

---

### 5️⃣ Get Tracking History

**GET** `/api/tracking/{tripId}/tracking`

Get all position updates for a trip (no authentication needed).

**Query Parameters**:

- `limit` (optional, default: 100): Max number of records to return

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "tracking_id": "LOC-ABC123",
      "trip_id": "TRP-ABC123",
      "driver_id": "DRIV-001",
      "latitude": 28.5735,
      "longitude": 77.2055,
      "speed": 45.5,
      "heading": 225.5,
      "accuracy": 10.2,
      "timestamp": "2024-01-26T10:30:45Z"
    },
    {
      "tracking_id": "LOC-ABC124",
      "trip_id": "TRP-ABC123",
      "driver_id": "DRIV-001",
      "latitude": 28.574,
      "longitude": 77.206,
      "speed": 48.2,
      "heading": 225.8,
      "accuracy": 10.5,
      "timestamp": "2024-01-26T10:31:00Z"
    }
  ],
  "count": 45,
  "message": "Tracking data retrieved successfully"
}
```

**Perfect for**: Trip replay, analyzing driver behavior, or showing full journey history.

---

## Authentication & Authorization

## Authentication & Authorization

### Driver Routes

- **POST** `/api/tracking/calculate` - Requires `verifyDriverToken`
  - Driver can only calculate routes for their own trips
  - Validates `trip.driver_id` matches authenticated driver
- **PATCH** `/api/tracking/{tripId}/position` - Requires `verifyDriverToken`
  - Driver can only update positions for their own trips
  - Validates `trip.driver_id` matches authenticated driver

### Public/Parent Routes

- **GET** `/api/tracking/{tripId}/current-position` - No authentication required
  - Any user can fetch current driver position for a trip (for parents tracking their child's trip)
- **GET** `/api/tracking/{tripId}/details` - No authentication required
  - Any user can fetch complete route details
- **GET** `/api/tracking/{tripId}/tracking` - No authentication required
  - Any user can fetch tracking history for a trip

---

### Import Collection

- Open Postman
- Click "Import"
- Select: `docs/api/postman/Ping_Parent_Routes_Tracking.postman_collection.json`
- Set variables:
  ```
  base_url: http://localhost:3000/api
  driver_token: [your JWT]
  parent_token: [your JWT]
  ```

### Test Flow

1. Create a trip (POST /api/trips)
2. Calculate route (POST /api/tracking/calculate)
3. Update position 5 times (PATCH /api/tracking/{tripId}/position)
4. Get current position (GET /api/tracking/{tripId}/current-position)
5. Get route details (GET /api/tracking/{tripId}/details)
6. Get tracking history (GET /api/tracking/{tripId}/tracking)

---

## Frontend Integration

### Driver App - Calculate Route

```javascript
// When trip starts
const response = await fetch("http://localhost:3000/api/tracking/calculate", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${driverToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    trip_id: activeTripId,
    current_latitude: position.latitude,
    current_longitude: position.longitude,
    pickup_points: studentAddresses.map((s) => ({
      latitude: s.latitude,
      longitude: s.longitude,
      student_id: s.id,
    })),
  }),
});

const { data } = await response.json();
console.log("Route calculated:", data.waypoints_optimized);
```

### Driver App - Send Position Updates

```javascript
// Every 10-30 seconds
setInterval(async () => {
  const location = await getCurrentDeviceLocation();

  await fetch(`http://localhost:3000/api/tracking/${tripId}/position`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${driverToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      latitude: location.latitude,
      longitude: location.longitude,
      speed: location.speed,
      heading: location.heading,
      accuracy: location.accuracy,
    }),
  });
}, 15000);
```

### Parent App - Display Route

```javascript
// Get route details once
const routeRes = await fetch(
  `http://localhost:3000/api/tracking/${tripId}/details`,
);
const { data } = await routeRes.json();

// Display route on map
const polylineCoordinates = data.optimized_route_data.coordinates.map(
  ([lat, lng]) => ({
    latitude: lat,
    longitude: lng,
  }),
);

// Add markers for students
data.trip_students.forEach((student) => {
  addMarker({
    latitude: student.latitude,
    longitude: student.longitude,
    title: `Student: ${student.name}`,
    subtitle: `ETA: ${student.estimated_arrival_time}`,
  });
});
```

### Parent App - Track Driver in Real-time

```javascript
// Poll every 5-10 seconds
setInterval(async () => {
  const posRes = await fetch(
    `http://localhost:3000/api/tracking/${tripId}/current-position`,
  );
  const { data } = await posRes.json();

  // Update driver marker on map
  updateMarker({
    id: "driver",
    latitude: data.latitude,
    longitude: data.longitude,
    speed: data.speed,
    timestamp: data.timestamp,
  });
}, 5000);
```

---

## Database Schema

### location_tracking Collection

Stores all driver position updates.

```json
{
  "_id": ObjectId,
  "tracking_id": "LOC-ABC123",
  "trip_id": "TRP-ABC123",
  "driver_id": "DRIV-001",
  "latitude": 28.5735,
  "longitude": 77.2055,
  "speed": 45.5,
  "heading": 225.5,
  "accuracy": 10.2,
  "timestamp": "2024-01-26T10:30:45Z"
}
```

**Indexes**:

```javascript
db.location_tracking.createIndex({ trip_id: 1, timestamp: -1 });
db.location_tracking.createIndex({ driver_id: 1, timestamp: -1 });
```

### trips Collection (Enhanced)

Added fields for route optimization:

```json
{
  "trip_id": "TRP-ABC123",
  "driver_id": "DRIV-001",
  "trip_type": "pickup|dropoff",
  "trip_status": "pending|in_progress|completed",
  "trip_date": "2024-01-26",
  "school_id": "SCH-001",
  "total_distance": 15.8,
  "optimized_route_data": {
    "waypoints": [
      {
        "latitude": 28.5721,
        "longitude": 77.2068,
        "address": "Student Home 1, Delhi",
        "student_id": "STU-001",
        "distance_from_previous": 2.5,
        "duration_from_previous": 450,
        "estimated_arrival_time": "2024-01-26T10:35:00Z"
      }
    ],
    "coordinates": [[28.6139, 77.209], [28.5721, 77.2068], ...],
    "total_distance": 15.8,
    "total_duration": 1200
  }
}
```

### trip_students Collection (Enhanced)

Updated with sequence and ETA:

```json
{
  "trip_student_id": "TPS-001",
  "trip_id": "TRP-ABC123",
  "student_id": "STU-001",
  "sequence_order": 1,
  "estimated_arrival_time": "2024-01-26T10:35:00Z"
}
```

---

## Module Structure

```
src/modules/tracking/
├── tracking.type.ts          → TypeScript interfaces
├── tracking.validation.ts    → Joi validation schemas
├── tracking.repository.ts    → Database queries
├── tracking.service.ts       → Business logic
├── tracking.controller.ts    → HTTP handlers
├── tracking.routes.ts        → Express routes
└── index.ts                 → Module exports

src/shared/services/
└── tomtom.service.ts        → TomTom API integration
```

---

## How It Works

### 1. Route Calculation Algorithm

```
Input: Current driver position + Student home addresses
    ↓
1. Fetch all students assigned to trip from trip_students
2. Get each student's pickup address from parent_addresses
3. Fetch school location from schools collection
4. Call TomTom calculateOptimalSequence API:
   - Uses greedy algorithm to find optimal visit order
   - Calculates nearest unvisited waypoint at each step
5. Call TomTom getRouteGeometry API:
   - Gets turn-by-turn coordinates for optimized sequence
   - Returns distance and duration per leg
6. Calculate cumulative ETA:
   - Sum leg durations to get ETA for each student
   - Add time offset to current timestamp
7. Store route geometry in trips.optimized_route_data
8. Update trip_students with sequence_order and estimated_arrival_time
    ↓
Output: Optimized waypoints + route coordinates + ETAs + trip updated
```

**Key Behaviors**:

- Sequence order starts from 1 (first pickup)
- School is always the final destination (not in trip_students sequence)
- Each waypoint includes distance and duration from previous waypoint
- ETAs are calculated based on current time + cumulative duration

### 2. Position Tracking Flow

```
Driver sends position every 10-30 seconds
    ↓
Service validates:
- Trip exists
- Trip belongs to authenticated driver
- Position is valid (valid lat/lng)
- Position is within route corridor (±200m buffer) - warns if not
    ↓
Create location_tracking record with:
- tracking_id (auto-generated unique code)
- trip_id, driver_id
- latitude, longitude
- speed, heading, accuracy
- timestamp (current time)
    ↓
Return created tracking record to driver app
    ↓
Parent App polls every 5-10 seconds
    ↓
Get latest position from location_tracking
    ↓
Update map marker + show current speed/heading/timestamp
```

---

## Common Issues & Solutions

| Issue                            | Solution                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **TomTom API 401 error**         | Verify TOMTOM_API_KEY in .env is correct                                                                               |
| **"Trip not found"**             | Check trip_id is valid and exists in trips collection                                                                  |
| **"No students assigned"**       | Create driver-student assignments first via trip_students                                                              |
| **"You do not have permission"** | Verify authenticated driver owns the trip (trip.driver_id)                                                             |
| **Position not saving**          | Verify trip belongs to authenticated driver making the request                                                         |
| **Route not showing on map**     | Ensure route was calculated first (POST /calculate must succeed)                                                       |
| **ETA always same**              | Route ETAs are calculated once at route calculation time. Recalculate route when driver location significantly changes |
| **Position outside corridor**    | Driver deviated from route. Service logs warning but doesn't reject update                                             |

---

## Endpoint Summary

| Method    | Endpoint                                  | Auth         | Purpose                                     |
| --------- | ----------------------------------------- | ------------ | ------------------------------------------- |
| **POST**  | `/api/tracking/calculate`                 | Driver Token | Calculate optimized route for trip          |
| **PATCH** | `/api/tracking/{tripId}/position`         | Driver Token | Update driver's current position            |
| **GET**   | `/api/tracking/{tripId}/current-position` | None         | Get latest driver position                  |
| **GET**   | `/api/tracking/{tripId}/details`          | None         | Get complete route with all details         |
| **GET**   | `/api/tracking/{tripId}/tracking`         | None         | Get tracking history (all position updates) |

---

## Endpoint Summary

## Performance Tips

1. **Cache routes**: Don't recalculate same trip within 1 hour
2. **Rate limit**: Position updates max once per 5 seconds
3. **Clean old data**: Delete location_tracking records >30 days old
4. **Use indexes**: Ensures fast queries on (trip_id, timestamp)

---

## File Organization in Project

```
Backend Root
├── src/
│   ├── modules/
│   │   └── tracking/              ← Tracking module
│   │       ├── tracking.*.ts      ← All tracking files
│   │       └── index.ts
│   ├── shared/
│   │   ├── services/
│   │   │   └── tomtom.service.ts ← TomTom API
│   │   └── constants/
│   │       └── collections.ts     ← LOCATION_TRACKING added
│   └── routes/
│       └── index.ts               ← Mounts /api/tracking
│
├── docs/
│   ├── api/
│   │   └── postman/
│   │       └── Ping_Parent_Routes_Tracking.postman_collection.json
│   └── tracking/
│       └── TRACKING.md            ← This file
│
└── .env                           ← Add TOMTOM_API_KEY
```

---

## TomTom Service Methods

### calculateOptimalSequence(startPoint, waypoints)

Finds the best order to visit waypoints.

- **Input**: Current position + list of student addresses
- **Output**: Array of indices in optimal order
- **Uses**: Greedy algorithm for speed

### getRouteGeometry(startPoint, waypoints)

Gets detailed route with coordinates and distances.

- **Input**: Start position + waypoints in order
- **Output**: Coordinates array + distance/duration per leg
- **Uses**: TomTom Routing API

### isPointWithinRouteCorridor(point, routeCoordinates, buffer)

Validates driver stays on route.

- **Input**: Current position + route coordinates
- **Output**: True if within buffer (default 200m)
- **Uses**: Haversine distance calculation

---

## Next Steps

✅ Setup TOMTOM_API_KEY in .env
✅ Run `npm install` and `npm start`
✅ Import Postman collection
✅ Test calculate route endpoint
✅ Test position update endpoint
✅ Integrate with driver app
✅ Integrate with parent app
✅ Deploy to production

---

## Environment Variables

```env
# Required
TOMTOM_API_KEY=your_api_key_here

# Optional (for production)
NODE_ENV=production
TRACKING_DATA_RETENTION_DAYS=30  # Clean records older than this
```

---

## Security

- **Driver Auth**: Only drivers can calculate/update routes for their own trips
- **Position Privacy**: Positions linked to trips, not individuals
- **Rate Limiting**: Recommended min 5 seconds between updates
- **Data Retention**: Auto-delete records older than 30 days

---

## Support & Documentation

- **Postman Collection**: Ready to use in `docs/api/postman/`
- **TomTom Docs**: https://developer.tomtom.com/routing-api
- **Database Schema**: See `Database/ping_parent_dbdiagram.dbml`
- **Architecture**: See `docs/ARCHITECTURE.md`

---

**Module Status**: ✅ Production Ready
**Last Updated**: January 26, 2026
**Version**: 1.0.0
