# Tracking Module - REST API Documentation

**Version**: 2.0.0  
**Last Updated**: February 3, 2026  
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Quick Overview](#quick-overview)
2. [Setup](#setup)
3. [Route Calculation Methods](#route-calculation-methods)
4. [REST API Endpoints](#rest-api-endpoints)
5. [Authentication](#authentication)
6. [Database Schema](#database-schema)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [References](#references)

---

## Quick Overview

The Tracking module provides REST APIs for:

- **Route Optimization**: Two calculation methods - Haversine (fast, simple) or TomTom (accurate, API-based)
- **Position Tracking**: Store driver positions during trips with route corridor validation
- **Trip Details**: Get complete route information with waypoints, detailed geometry, and real-time position
- **Tracking History**: Retrieve all position updates for a trip with pagination
- **Route Recalculation**: Recalculate optimal sequence when driver changes route
- **Data Cleanup**: Delete old tracking records (admin only)
- **WebSocket Real-time**: See `docs/websocket/WEBSOCKET.md` for live updates

---

## Setup

### 1. Environment Configuration

```bash
# Add to environment/default.env:
TOMTOM_API_KEY=your_api_key_here
```

Get API key from: https://developer.tomtom.com/

### 2. Start Server

```bash
npm install
npm start
```

---

## Route Calculation Methods

### Haversine Method (Fast, Simple)

**What it does**: Uses simple Haversine formula to calculate straight-line distances between waypoints without external API calls.

**How it works**:

- Calculates direct distance between pickup points using geodesic math
- Estimates travel duration based on 40 km/h average urban speed
- Generates 10+ smooth coordinate points per segment using Spherical Linear Interpolation (SLERP)
- Orders waypoints greedily (nearest neighbor algorithm)
- No external API dependency - very fast response time

**Best for**:

- Quick route estimation without API costs
- Trips with few students (< 10)
- Areas with simple road networks
- Development and testing

**Output**: Route with all intermediate coordinates for smooth map visualization, but distances are as-the-crow-flies, not actual road distances.

---

### TomTom Method (Accurate, Premium)

**What it does**: Uses TomTom's Matrix and Routing APIs for real road-based calculations.

**How it works**:

- Calculates actual road distances using TomTom's routing engine
- Optimizes sequence based on real travel times (traffic-aware)
- Retrieves detailed route geometry with precise coordinates
- Validates against actual road networks
- Orders waypoints using optimization matrix

**Best for**:

- Production use with accurate ETAs
- Trips with many students (10+)
- Complex road networks (highways, congested areas)
- Minimizing actual travel time and distance

**Output**: Highly accurate route with real road distances, traffic-aware durations, and detailed routing geometry matching navigation apps.

---

## REST API Endpoints

### 1️⃣ Calculate Optimal Route (Haversine)

**POST** `/api/tracking/calculate`

Calculate the best route sequence using simple distance-based optimization. Provides quick results without external API dependency.

**Authentication**: ✅ Driver token required

**What happens**:

1. Validates driver owns the trip
2. Fetches all assigned students and their pickup addresses
3. Calculates distances between all combinations using Haversine formula
4. Orders waypoints using nearest-neighbor greedy algorithm
5. Generates 10+ smooth intermediate coordinates per segment using SLERP
6. Calculates estimated arrival time for each student
7. Saves route data and sequence order to database
8. Broadcasts updated route to all parents watching this trip via WebSocket

**Outcome**: Route optimization completes in milliseconds. Parents see the route on their map with smooth curves between pickup points. Driver gets the optimized sequence to follow.

---

### 2️⃣ Calculate Optimal Route (TomTom)

**POST** `/api/tracking/tomtom`

Calculate the most accurate route using TomTom's real-world routing data. Takes longer but provides traffic-aware ETAs and actual road distances.

**Authentication**: ✅ Driver token required

**What happens**:

1. Validates driver owns the trip
2. Fetches all assigned students and their pickup addresses
3. Calls TomTom Matrix API to calculate distances between all point combinations
4. Uses matrix results to find optimal sequence minimizing total distance
5. Retrieves detailed routing geometry from TomTom for the optimized path
6. Generates estimated arrival times based on actual road speeds
7. Saves route data with precise geometry to database
8. Updates trip students with correct sequence order and ETA
9. Broadcasts updated route to all parents via WebSocket

**Outcome**: After 1-3 seconds, the system returns the truly optimal route with accurate distances and traffic-aware ETAs. Parents see the exact road-based route on their map. Driver follows navigation-quality directions.

---

### 3️⃣ Recalculate Route

**POST** `/api/tracking/{tripId}/recalculate`

Recalculate the optimal route from the driver's current position. Use when driver needs to change the route or finds an error in the sequence.

**Authentication**: ✅ Driver token required

**What happens**:

1. Validates driver owns the trip
2. Fetches currently assigned students
3. Uses driver's current location as new starting point (instead of original start)
4. Recalculates optimal sequence from current position using TomTom's matrix optimization
5. Generates new route geometry from current location
6. Updates database with new sequence order and recalculated ETAs
7. Broadcasts the recalculation event and new route to all parents via WebSocket

**Outcome**: Parents see the route update in real-time with new ETAs based on current position. The driver can continue following the new optimized sequence without starting over.

---

### 4️⃣ Update Driver Position

**PATCH** `/api/tracking/{tripId}/position`

Send current driver position during the trip. Should be called every 10-30 seconds for real-time tracking.

**Authentication**: ✅ Driver token required

**What happens**:

1. Validates driver owns the trip and position is valid
2. Checks if position is within 200 meters of the calculated route (corridor validation)
3. If outside corridor, logs warning but still accepts the position
4. Creates location tracking record with timestamp
5. Saves position to database
6. Immediately broadcasts new position to all parents watching this trip via WebSocket

**Outcome**: Parents see the driver's real-time location updating on their map. The system maintains a full history of driver positions throughout the trip.

---

### 5️⃣ Get Current Driver Position

**GET** `/api/tracking/{tripId}/current-position`

Get the latest known position of the driver for a trip.

**Authentication**: ❌ None required (public tracking)

**What happens**:

1. Fetches the most recent position record from the location_tracking collection
2. Returns the latest position with timestamp

**Outcome**: Parents can check where the driver currently is at any time. If no position exists yet (trip not started), returns null.

---

### 6️⃣ Get Route Details

**GET** `/api/tracking/{tripId}/details`

Get the complete trip information including the optimized route, all waypoints with ETAs, full route geometry, and current driver position.

**Authentication**: ❌ None required (public tracking)

**What happens**:

1. Fetches the trip record including stored route geometry
2. Fetches all assigned students with their waypoint details
3. Retrieves the latest driver position
4. Assembles complete picture with route coordinates, waypoint sequence, and live position

**Outcome**: Parents see the full route with all waypoints labeled with addresses and student names, current driver position, total distance and duration, and each student's estimated arrival time.

---

### 7️⃣ Get Tracking History

**GET** `/api/tracking/{tripId}/tracking?limit=100`

Get all position updates recorded during this trip.

**Authentication**: ❌ None required (public tracking)

**What happens**:

1. Fetches all position records for the trip sorted by most recent first
2. Limits results to the specified amount (default 100)
3. Returns full position history

**Outcome**: Parents can see the complete journey map showing where the driver has been throughout the trip. Useful for analysis, playback, or investigating any issues.

---

### 8️⃣ Delete Old Tracking Data (Admin)

**POST** `/api/tracking/admin/cleanup`

Remove tracking records older than a specified number of days. Helps manage database size and complies with data retention policies.

**Authentication**: ✅ Admin token required

**What happens**:

1. Validates user has admin role
2. Finds all tracking records older than the specified days
3. Deletes them from the database
4. Returns count of deleted records

**Outcome**: Database storage is reduced by removing stale tracking data. System remains performant with manageable data volume.

---

## Authentication

| Endpoint                         | Auth Required | Who Can Use                           |
| -------------------------------- | ------------- | ------------------------------------- |
| POST `/calculate`                | ✅ Driver JWT | Drivers only (for their trips)        |
| POST `/tomtom`                   | ✅ Driver JWT | Drivers only (for their trips)        |
| POST `/{tripId}/recalculate`     | ✅ Driver JWT | Drivers only (for their trips)        |
| PATCH `/{tripId}/position`       | ✅ Driver JWT | Drivers only (for their trips)        |
| GET `/{tripId}/current-position` | ❌ None       | Anyone (public - for parent tracking) |
| GET `/{tripId}/details`          | ❌ None       | Anyone (public - for parent tracking) |
| GET `/{tripId}/tracking`         | ❌ None       | Anyone (public - view history)        |
| POST `/admin/cleanup`            | ✅ Admin JWT  | Admins only                           |

---

## Database Schema

### location_tracking Collection

Stores every driver position update during a trip.

**Fields**:

- `tracking_id`: Unique identifier for this tracking record
- `trip_id`: Which trip this position belongs to
- `driver_id`: Which driver sent this position
- `latitude` & `longitude`: Position coordinates
- `speed`: Current speed in km/h
- `heading`: Direction in degrees (0-360)
- `accuracy`: GPS accuracy in meters
- `timestamp`: When this position was recorded

**Indexes**:

- Composite index on `trip_id` and `timestamp` for fast trip lookups
- Separate index on `driver_id` and `timestamp` for driver history
- TTL (Time-To-Live) index: Auto-delete records older than 30 days

---

## Common Issues & Solutions

| Issue                              | Cause                      | Solution                                              |
| ---------------------------------- | -------------------------- | ----------------------------------------------------- |
| **TomTom API 401 error**           | Invalid or missing API key | Verify TOMTOM_API_KEY in environment file             |
| **Trip not found**                 | Wrong trip_id provided     | Check trip exists and tripId is correct               |
| **Permission denied**              | Driver doesn't own trip    | Drivers can only calculate/update own trips           |
| **No students assigned**           | Empty trip_students list   | Assign students to trip before calculating route      |
| **Position outside corridor**      | Driver deviated from route | Service logs warning but still records position       |
| **No position data available**     | Trip hasn't started yet    | Driver hasn't sent first position - is trip started?  |
| **TomTom request timeout**         | Network or API overload    | Retry with exponential backoff, fallback to Haversine |
| **Coordinates missing/incomplete** | Route not calculated yet   | Calculate route first before getting details          |

---

## Module Structure

```
src/modules/tracking/
├── tracking.type.ts              → TypeScript interfaces
├── tracking.validation.ts        → Request validation schemas
├── tracking.repository.ts        → Database operations
├── tracking.service.ts           → Business logic (Haversine & TomTom)
├── tracking.socket.service.ts    → WebSocket broadcasting
├── tracking.controller.ts        → HTTP request handlers
├── tracking.routes.ts            → Express route definitions
└── index.ts                      → Module exports

src/shared/services/
├── geo-util.service.ts          → Geolocation utilities (Haversine, SLERP, etc)
└── tomtom.service.ts            → TomTom API integration
```

---

## How Route Calculation Works

### Behind the Scenes: Haversine Flow

1. **Distance Calculation**: Uses Haversine formula to compute direct distances between all waypoints
2. **Coordinate Interpolation**: Applies Spherical Linear Interpolation (SLERP) to create smooth intermediate points every ~0.5km
3. **Sequence Optimization**: Orders waypoints using greedy nearest-neighbor algorithm
4. **ETA Computation**: Estimates arrival times based on 40 km/h average urban speed
5. **Visualization**: Returns dense coordinate array (100+ points) for smooth map rendering

### Behind the Scenes: TomTom Flow

1. **Matrix Calculation**: Sends all waypoints to TomTom Matrix API to get real-world distances between every pair
2. **Optimization**: Uses matrix distances to find the sequence that minimizes total travel time
3. **Routing**: Retrieves detailed routing geometry for the optimized path from TomTom's routing engine
4. **ETA Computation**: Calculates arrival times based on actual road speeds and traffic
5. **Visualization**: Returns precise route geometry with all turns and actual road paths

---

## References

- **WebSocket Integration**: See `docs/websocket/WEBSOCKET.md`
- **Flutter Implementation**: See `docs/websocket/FLUTTER_INTEGRATION.md`
- **School Transport System**: See `docs/schools/SCHOOL_TRANSPORT_SYSTEM.md`
- **TomTom API**: https://developer.tomtom.com/
- **Database Design**: See `Database/ping_parent_dbdiagram.dbml`

---

**Status**: ✅ Production Ready  
**Last Updated**: February 3, 2026  
**Changes in v2.0.0**: Consolidated to 2 route calculation methods (Haversine & TomTom), enhanced coordinate generation with SLERP interpolation for smooth visualization
