# GPS Push API — Live Tracking Integration

## Overview

The GPS hardware device pushes location data to the backend via `POST /api/public/gps/push`. This document explains how that HTTP push is wired into the live tracking pipeline so parents receive real-time position updates through their existing socket connections — identical to the experience when a driver app sends location updates.

---

## How It Works

### Current Driver App Flow

```
Driver App
  ↓  socket.emit("driver:update_position", { tripId, lat, lng, ... })
Socket Service (server)
  ↓  emits "trip:position_update" to trip:{tripId} room  →  Parents receive it
  ↓  recordLiveLocation()
MongoDB (location_tracking) + Deviation Detection + Route Recalculation
```

### GPS Hardware Device Flow (this integration)

```
GPS Hardware Device
  ↓  POST /api/public/gps/push  { vnum, datetime, lat, lng, speed, heading, accuracy }
GPS Controller (server)
  ↓  resolve vnum → Driver (by vehicle_number) → Active Trip
  ↓  BroadcastService.broadcastPositionUpdate()  →  emits "trip:position_update" to trip:{tripId} room  →  Parents receive it
  ↓  recordLiveLocation()
MongoDB (location_tracking) + Deviation Detection + Route Recalculation
```

**Key point:** The GPS device does not need a socket connection. The server holds all parent socket connections and emits to the trip room server-side. The HTTP push is enough to trigger the broadcast.

---

## Resolution: `vnum` → Driver → Active Trip

| Step | What happens |
|------|-------------|
| 1 | Look up driver by `vehicle_number = vnum` in `drivers` collection |
| 2 | If no driver found → log and return success (unregistered device) |
| 3 | Call `tripRepository.findActiveTrips(driverId)` — returns SCHEDULED / STARTED / IN_PROGRESS trips |
| 4 | Pick the most active trip: `IN_PROGRESS` → `STARTED` → `SCHEDULED` |
| 5 | If no active trip → log "no active trip for vnum X" and return success |
| 6 | Broadcast position update + persist to DB |

---

## Socket Event Received by Parents

Event name: `trip:position_update`

Payload:
```json
{
  "tripId": "<trip_id>",
  "driverId": "<driver_id>",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "speed": 40.5,
  "heading": 180,
  "accuracy": 0,
  "timestamp": "2026-05-25T13:05:43.000Z"
}
```

Parents subscribed to the `trip:{tripId}` socket room receive this event — the same event they receive from the driver app. No frontend changes are needed.

---

## Data Persisted

Collection: `location_tracking`

One record per trip is upserted (latest position overwrites previous):

```json
{
  "trip_id": "<trip_id>",
  "driver_id": "<driver_id>",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "speed": 40.5,
  "heading": 180,
  "accuracy": 0,
  "timestamp": "2026-05-25T13:05:43.000Z"
}
```

---

## Automatic Deviation & Route Recalculation

`recordLiveLocation()` runs the same deviation logic regardless of whether the position came from the driver app socket or the GPS device HTTP push:

- If driver is **> 100m off route** → auto-recalculates optimal route, notifies affected parents with updated ETAs via `parent:route_recalculated`
- If driver returns to **within 50m of route** → deviation state cleared

---

## Device Behavior on No Active Trip

If the GPS device pushes when no trip is active (e.g., vehicle is idle, trip hasn't started yet), the server:
- Logs: `[GPS] No active trip for vnum: Astria`
- Returns `{ success: true }` so the device keeps pushing without error

When a trip is eventually started, the next push will resolve correctly and begin live tracking.

---

## Files Changed

| File | Change |
|------|--------|
| `src/modules/users/driver/driver.repository.ts` | Added `findByVehicleNumber(vehicleNumber)` |
| `src/modules/gps/gps.controller.ts` | Wires vnum → driver → trip → broadcast + persist |

---

## Related Docs

- [gps-push-endpoint.md](./gps-push-endpoint.md) — API reference for the push endpoint
- [gps-tracker-integration.md](./gps-tracker-integration.md) — Broader GPS hardware integration architecture
