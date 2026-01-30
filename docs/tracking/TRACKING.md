# Tracking Module - REST API Documentation

**Version**: 1.0.0  
**Last Updated**: January 26, 2026  
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Quick Overview](#quick-overview)
2. [Setup](#setup)
3. [REST API Endpoints](#rest-api-endpoints)
4. [Authentication](#authentication)
5. [Database Schema](#database-schema)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [References](#references)

---

## Quick Overview

The Tracking module provides REST APIs for:

- **Route Optimization**: Calculate optimal pickup/drop sequence using TomTom API
- **Position Tracking**: Store driver positions during trips
- **Trip Details**: Get complete route information with waypoints and geometry
- **Tracking History**: Retrieve all position updates for a trip
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

## REST API Endpoints

### 1️⃣ Calculate Optimal Route

**POST** `/api/tracking/calculate`

Calculate the best route sequence for a trip.

**Authentication**: ✅ Driver token required

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
      "coordinates": [
        [28.6139, 77.209],
        [28.5721, 77.2068]
      ],
      "total_distance": 15.8,
      "total_duration": 1200
    },
    "trip_students_updated": 2
  },
  "message": "Route calculated and optimized successfully"
}
```

**What it does**:

1. Fetches students assigned to trip
2. Gets their pickup addresses
3. Calls TomTom to find optimal sequence
4. Calculates ETA for each student
5. Broadcasts to parents via WebSocket

---

### 2️⃣ Update Driver Position

**PATCH** `/api/tracking/{tripId}/position`

Send current driver position (every 10-30 seconds).

**Authentication**: ✅ Driver token required

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
3. Stores in database
4. Broadcasts to parents via WebSocket

---

### 3️⃣ Get Current Driver Position

**GET** `/api/tracking/{tripId}/current-position`

Get latest driver position for a trip.

**Authentication**: ❌ None required

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

### 4️⃣ Get Route Details

**GET** `/api/tracking/{tripId}/details`

Get complete route with waypoints and current position.

**Authentication**: ❌ None required

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
      "coordinates": [
        [28.6139, 77.209],
        [28.5721, 77.2068]
      ],
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
    }
  },
  "message": "Route details retrieved successfully"
}
```

---

### 5️⃣ Get Tracking History

**GET** `/api/tracking/{tripId}/tracking`

Get all position updates for a trip.

**Authentication**: ❌ None required

**Query Parameters**:

- `limit` (optional, default: 100)

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
    }
  ],
  "count": 45,
  "message": "Tracking data retrieved successfully"
}
```

---

### 6️⃣ Delete Old Tracking Data (Admin)

**POST** `/api/tracking/admin/cleanup`

Delete old tracking records.

**Authentication**: ✅ Admin token required

**Request**:

```json
{
  "days_old": 30
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "deleted_count": 15234
  },
  "message": "Deleted 15234 old tracking records"
}
```

---

## Authentication

| Endpoint                         | Auth Required | Who Can Use                    |
| -------------------------------- | ------------- | ------------------------------ |
| POST `/calculate`                | ✅ Driver JWT | Drivers only (for their trips) |
| PATCH `/{tripId}/position`       | ✅ Driver JWT | Drivers only (for their trips) |
| GET `/{tripId}/current-position` | ❌ None       | Anyone (parents can track)     |
| GET `/{tripId}/details`          | ❌ None       | Anyone (parents can view)      |
| GET `/{tripId}/tracking`         | ❌ None       | Anyone (view history)          |
| POST `/admin/cleanup`            | ✅ Admin JWT  | Admins only                    |

---

## Database Schema

### location_tracking Collection

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

- `trip_id, timestamp` (for fast trip lookups)
- `driver_id, timestamp` (for driver tracking)
- TTL: Auto-delete after 30 days

---

## Common Issues & Solutions

| Issue                         | Cause               | Solution                                |
| ----------------------------- | ------------------- | --------------------------------------- |
| **TomTom API 401**            | Invalid API key     | Check TOMTOM_API_KEY in .env            |
| **Trip not found**            | Invalid trip_id     | Verify trip exists in database          |
| **Permission denied**         | Not trip owner      | Driver can only update own trips        |
| **No students assigned**      | Empty trip_students | Create student assignments first        |
| **Position outside corridor** | Driver deviated     | Service logs warning but accepts update |

---

## Module Structure

```
src/modules/tracking/
├── tracking.type.ts          → TypeScript interfaces
├── tracking.validation.ts    → Joi schemas
├── tracking.repository.ts    → Database queries
├── tracking.service.ts       → Business logic
├── tracking.controller.ts    → HTTP handlers
├── tracking.routes.ts        → Express routes
└── index.ts                  → Module exports

src/shared/services/
└── tomtom.service.ts        → TomTom API calls
```

---

## References

- **WebSocket Integration**: See `docs/websocket/WEBSOCKET.md`
- **Flutter Implementation**: See `docs/websocket/FLUTTER_INTEGRATION.md`
- **TomTom API**: https://developer.tomtom.com/
- **Database**: See `Database/ping_parent_dbdiagram.dbml`

---

**Status**: ✅ Production Ready  
**Last Updated**: January 26, 2026
