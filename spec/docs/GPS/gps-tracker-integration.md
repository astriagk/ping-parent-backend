# GPS Hardware Tracker Integration — Backend-Only, Switchable Source of Truth

## Context

Today the **driver's mobile app is the sole source of truth** for vehicle location. The app emits `driver:update_position` over Socket.IO every ~5s with `{tripId, latitude, longitude, speed, heading, accuracy}`. The server:

1. Broadcasts to room `trip:{tripId}` as `trip:position_update` ([socket.service.ts:289](../../src/shared/services/socket.service.ts#L289)).
2. Persists via [recordLiveLocation()](../../src/modules/tracking/tracking.service.ts#L655) into `location_tracking`.
3. Runs deviation check against `trip.optimized_route_data.coordinates`; if >100m off-route, calls [autoRecalculateForDeviation()](../../src/modules/tracking/tracking.service.ts#L445).
4. Drives "approaching waypoint" push notifications.

No hardware tracker, no Vehicle entity (vehicle fields are embedded on `Driver`: `vehicle_type`, `vehicle_number`, `vehicle_capacity` — [driver.type.ts:16-37](../../src/modules/users/driver/driver.type.ts#L16-L37)). No TCP/UDP listener. HERE Maps and TomTom are used only for routing, not for raw-GPS snapping.

**Goal:** install a physical GPS tracker on the vehicle and make the backend accept its readings *as if* they were driver-app readings — **switchable per vehicle** so some schools/operators use the driver app, others use the hardware tracker, with optional auto-fallback.

### Hard constraint: driver app and parent app remain unchanged

- Driver app still emits `driver:update_position` exactly as today. When the policy says "use GPS device", the backend silently ignores those emits — the app never knows.
- Parent app still receives `trip:position_update` on `trip:{tripId}` with the **exact same payload shape** as today: `{tripId, driverId, latitude, longitude, speed, heading, accuracy, timestamp}`. No new fields.
- All existing socket events (`driver:subscribe_trip`, `parent:subscribe_trip`, `driver:trip_started`, `driver:trip_completed`, `parent:my_student_approaching`, `parent:route_recalculated`, etc.) keep the same name, payload, and timing.
- The HTTP endpoint `POST /driver/tracking` ([tracking.controller.ts:23](../../src/modules/tracking/tracking.controller.ts#L23)) keeps the same shape.

All changes in this document are server-side only.

---

## How the flow compares: driver app today vs GPS device

The answer to "does it use the same flow or a different one?" is: **different on the way in, identical on the way out**.

### Today (driver app)

```
Driver app                  Socket.IO server                  Parents
─────────                   ───────────────                  ───────
1. Driver presses "Start"
2. socket.emit("driver:subscribe_trip", tripId)
3. socket.emit("driver:trip_started", tripId)
4. Every 5s:
   socket.emit("driver:update_position",
               {tripId, lat, lng, speed, …})  ──►
                                              broadcast to trip:{tripId}
                                                                  ──► trip:position_update
                                                                      (rendered on map)
```

The driver app is a **socket client**. It already knows `tripId` (from the trip-start API). It carries the JWT, so the server trusts the lat/lng came from this driver.

### With a GPS device

```
GPS hardware             Traccar gateway          Our backend                   Parents
─────────────            ───────────────         ─────────────                  ───────
1. Powered on (key-in).
2. Streams binary TCP   ──►  parses vendor
   packets every 10s        protocol
   (knows IMEI only,        ──► POST /gps/ingest
   knows NOTHING            {imei, lat, lng, speed, fixTime}
   about trips, parents,                          1. auth IMEI+secret
   sockets, JWT)                                  2. look up vehicle by IMEI
                                                  3. find current driver
                                                  4. find that driver's active trip
                                                  5. call SAME core function
                                                     as the socket handler
                                                  6. broadcast to trip:{tripId} ─► trip:position_update
                                                                                    (identical payload)
```

### What's different vs same

| | Driver app today | GPS device |
|---|---|---|
| Transport in | Socket.IO from phone | TCP binary → Traccar → HTTPS webhook to backend |
| Who knows the `tripId`? | The app does (it just started the trip) | **Nobody on the device** — backend infers it from `IMEI → vehicle → current driver → active trip` |
| Who knows the user/driver? | JWT on the socket | Backend resolves it from the vehicle's `current_driver_id` |
| Auth | User JWT | Per-device shared secret on the webhook |
| Rate | App self-throttles to 5s | Device decides (usually 10–30s); backend doesn't care |
| Trip start signal | App explicitly emits `driver:trip_started` | **No such signal from the device** — device pings 24/7. Trip lifecycle still comes from the driver app (or admin) |
| Storage | `location_tracking` upsert | Same — same collection, same function |
| Deviation check + auto-recalc | Runs | Same — same code path |
| Approaching-waypoint notifications | Triggers | Same |
| Outbound to parents | `trip:position_update` on `trip:{tripId}` | **Exact same event, exact same payload** |

### The key conceptual shift

The GPS device is **dumb** by design. It has no idea what a "trip" or a "parent" is. It just yells its position into the void with its IMEI. The backend's job becomes:

1. **Identify** which vehicle this IMEI belongs to.
2. **Correlate** that vehicle to the driver who's currently using it, and that driver's active trip.
3. From that point on, **pretend it came from the driver app** — call the same internal function, emit the same socket event to the same room.

So:

- **Trip start/stop** still needs to happen somewhere — either the driver app continues to send `driver:trip_started` / `driver:trip_completed`, or an admin opens/closes trips manually. The GPS device cannot do this for you.
- The **parent app is completely unaware** the source changed. It listens to `trip:position_update` and gets it whether the bytes originated on a phone or on a vehicle-mounted box.
- The **driver app keeps doing what it does today**. When a vehicle is configured for GPS, the backend silently drops the app's location pings (the app gets `callback(true)`, no error). When it's configured for driver-app, the GPS webhook drops anything that comes in. When it's AUTO, GPS wins while fresh; the app's pings fill the gap when the tracker is offline.

In short: the GPS device replaces **only** the inbound location pipe. Everything from the point of `ingestLocation()` onward — deviation, recalc, ETAs, notifications, broadcast — is shared and unchanged.

---

## What a GPS tracker actually emits (background)

A vehicle-grade tracker has a GNSS chip + a cellular modem (2G/4G/NB-IoT) + a small CPU. Once powered (wired to vehicle ignition or battery), it:

- Reads NMEA sentences from the GNSS chip internally (`$GPRMC`, `$GPGGA`).
- Buffers and transmits periodic packets to a server you configure on the device (server IP + port). The on-air protocol is **vendor-specific binary** (Teltonika Codec 8, Concox GT06, Queclink @track, Ruptela, etc.) or, for fleet-SaaS devices, pre-bundled to send to that SaaS.
- Each packet typically carries: **IMEI** (device identity), **timestamp**, **lat/lng**, **speed (km/h)**, **heading (°)**, **altitude**, **HDOP/accuracy**, **satellites in use**, **ignition state**, **fuel/voltage**, plus I/O events (door open, panic button) depending on the device.

You don't talk to the device directly from a browser or REST. The two practical ingestion paths are:

| Path | What runs | Pros | Cons |
|---|---|---|---|
| Direct TCP listener per vendor | Long-running TCP server parsing the vendor's binary protocol | No third party | Locked to one device model; we maintain the parser |
| **Traccar (recommended)** as middleware | Open-source self-hosted gateway that speaks 200+ tracker protocols and forwards as HTTP/JSON webhook | Works with almost any device; we only implement *one* webhook in this repo | One extra service to run |
| Fleet-SaaS webhook (Wialon, Locate, etc.) | Vendor-hosted; pushes JSON to our webhook | Zero infra | Monthly cost; vendor lock-in |

### Recommended path: Traccar gateway → HTTPS webhook into this backend

Buy any Traccar-compatible 4G tracker (Concox JM-VL01, Teltonika FMC003, Sinotrack ST-901 — sub-$30 class will do). Point the device's server config (IP + port set via SMS or vendor config tool) at a Traccar instance. Configure Traccar's "Forward" feature to POST positions to a new endpoint on this backend. Our backend never has to learn binary protocols.

This keeps the addition here small: **one new HTTPS endpoint, one device model, one config flag per vehicle**.

---

## Architecture: a switchable LocationSource (server-internal)

We make `recordLiveLocation` the **shared core** that both location sources call. The driver-app socket handler and the new GPS webhook handler are both thin adapters that authenticate, normalize, then invoke the core. From the apps' perspective nothing changes.

```
┌──────────────────┐        socket: driver:update_position  (unchanged)
│ Driver app       │ ─────────────────────────────────────┐
└──────────────────┘                                       │
                                                            ▼
┌──────────────────┐                              ┌─────────────────────────────┐
│ Hardware GPS     │ ──TCP──▶ Traccar ──webhook──▶│ POST /api/v1/gps/ingest     │
└──────────────────┘                              └──────────────┬──────────────┘
                                                                 │
                                                                 ▼
                              ┌──────────────────────────────────────────────────┐
                              │ ingestLocation(source, driverId, tripId, …)      │
                              │  • policy gate per vehicle                       │
                              │  • drop if not currently authoritative           │
                              │  • upsert location_tracking                      │
                              │  • deviation check + auto-recalc                 │
                              │  • approaching-waypoint notifications            │
                              │  • broadcast trip:position_update (same payload) │
                              └──────────────────────────────────────────────────┘
```

The **policy** lives on the vehicle: `DRIVER_APP` | `GPS_DEVICE` | `AUTO` (prefer GPS, accept driver-app when GPS goes stale beyond N seconds). Changing the policy is an admin DB update — no code deploy, no app update.

---

## Implementation Plan

### 1. New `Vehicle` collection (separate from driver)

Vehicle fields are currently embedded on `Driver`. The GPS device belongs to the vehicle, not the driver, so they get their own collections.

Create `src/modules/vehicles/vehicle/vehicle.type.ts`:

```ts
export enum LocationSource {
  DRIVER_APP = "driver_app",
  GPS_DEVICE = "gps_device",
  AUTO       = "auto", // prefer GPS, fall back to driver app after staleness
}

export interface Vehicle {
  _id?: any;
  school_id?: string;
  vehicle_number: string;
  vehicle_type: VehicleType;
  vehicle_capacity: number;
  current_driver_id?: string;       // assigned when a driver takes the vehicle out
  location_source: LocationSource;   // policy
  gps_device_id?: string;            // FK to gps_devices
  created_at?: Date;
  updated_at?: Date;
}

export interface GPSDevice {
  _id?: any;
  imei: string;                      // unique
  vehicle_id?: string;
  ingest_secret: string;             // shared secret for webhook auth (store hashed)
  protocol: "traccar" | "custom";
  last_seen_at?: Date;
  last_latitude?: number;
  last_longitude?: number;
  is_active: boolean;
}
```

Folders to create (follow the pattern at [src/modules/users/driver](../../src/modules/users/driver/)):

- `src/modules/vehicles/vehicle/` — `vehicle.type.ts`, `vehicle.repository.ts`, `vehicle.service.ts`, `vehicle.controller.ts`, `vehicle.routes.ts`
- `src/modules/vehicles/gps-device/` — same structure

Add collection names to [src/shared/constants/collections.ts](../../src/shared/constants/collections.ts): `vehicles`, `gps_devices`.

**Migration note**: keep the existing `Driver.vehicle_*` fields read-only — they continue to work for vehicles that don't have a `Vehicle` row. For vehicles that opt in, create a `Vehicle` row and link it via `current_driver_id`. Don't drop the embedded fields in this change — that's churn for no benefit.

### 2. Extract the shared ingestion core

Refactor [tracking.service.ts:655](../../src/modules/tracking/tracking.service.ts#L655) — `recordLiveLocation` currently mixes user→driver resolution with the actual processing. Split into:

- **`ingestLocation(input: LocationInput)`** — new, exported. Takes already-authenticated `{ source, driverId, tripId, lat, lng, speed?, heading?, accuracy?, deviceTimestamp? }`. Responsibilities: policy gate → broadcast → cache → deviation check → upsert → approaching-waypoint notifications.
- **`recordLiveLocation(userId, tripId, …)`** — kept verbatim from the caller's perspective. Internally resolves `userId → driverId`, then delegates to `ingestLocation` with `source=DRIVER_APP`.
- The `source` is persisted on `LocationTracking` (add `source: LocationSource` field in [tracking.type.ts:137](../../src/modules/tracking/tracking.type.ts#L137)) — internal/admin use only; **never included in the outbound socket payload**.

### 3. Policy gate (the switching logic)

Inside `ingestLocation`, before any side effects:

```ts
const vehicle = await vehicleRepository.findByTripId(tripId);
// If no vehicle is configured for this trip, behave like today (driver app only).
const policy = vehicle?.location_source ?? LocationSource.DRIVER_APP;

if (policy === LocationSource.DRIVER_APP && source !== LocationSource.DRIVER_APP) return SKIP;
if (policy === LocationSource.GPS_DEVICE  && source !== LocationSource.GPS_DEVICE)  return SKIP;

if (policy === LocationSource.AUTO) {
  // Prefer GPS. Drop driver-app pings if GPS was seen in the last STALENESS_MS.
  const lastGps = lastGpsSeenAt.get(tripId);
  if (source === LocationSource.DRIVER_APP && lastGps && (Date.now() - lastGps) < STALENESS_MS) return SKIP;
}
```

`lastGpsSeenAt` is an in-memory `Map<tripId, number>` updated whenever a `GPS_DEVICE` ping is accepted. `STALENESS_MS = 20000` is reasonable for trackers reporting every 10–15s.

This is how a school operator switches modes: update `vehicles.location_source` (a single admin call). No code deploy, no app push.

**Driver-side behavior when ignored**: when the policy drops a driver-app ping, the socket handler still returns `callback(true)` so the app doesn't retry/log errors. The app sees identical behavior to today.

### 4. New webhook ingest endpoint

Create `src/modules/tracking/gps-ingest.controller.ts`:

- `POST /api/v1/gps/ingest`
- Headers: `X-Device-IMEI`, `X-Device-Secret` (must match `gps_devices.ingest_secret`; reject otherwise).
- Body (normalized Traccar-style):
  ```json
  { "imei": "...", "lat": 17.4, "lng": 78.4, "speed": 32.5,
    "heading": 145, "accuracy": 8.0, "fixTime": "2026-05-19T08:12:33Z" }
  ```
- Pipeline:
  1. Look up `GPSDevice` by IMEI; verify secret in constant time; update `last_seen_at`, `last_latitude/longitude`.
  2. Resolve `vehicle = vehicles.find({ gps_device_id })`.
  3. Resolve active trip: `trip = trips.find({ driver_id: vehicle.current_driver_id, trip_status: { $in: [IN_PROGRESS, STARTED] } })`. If none, store the ping on `gps_devices.last_*` for audit and return 204.
  4. Call `ingestLocation({ source: GPS_DEVICE, driverId: vehicle.current_driver_id, tripId, lat, lng, speed, heading, accuracy })`.
  5. Return 200 with `{ accepted: true }` if processed, `{ accepted: false, reason }` if the policy gate dropped it.

Register the route alongside existing tracking routes. **Do not** put it behind the user JWT middleware — the device cannot carry a user token. Use a dedicated `deviceAuthMiddleware` (see step 7).

### 5. Update the driver-app socket handler — invisibly

Inside the `DriverSocketEvent.UPDATE_POSITION` handler at [socket.service.ts:241-318](../../src/shared/services/socket.service.ts#L241-L318):

- Replace the direct `recordLiveLocation` call with `ingestLocation` (via the same lazy-import pattern that avoids the circular dep).
- The policy gate inside `ingestLocation` handles the case where GPS is authoritative and silently drops the driver-app ping (no error sent to the app).
- The 5-second rate limiter stays exactly where it is.
- The outbound `trip:position_update` payload **must not change shape** — keep `{tripId, driverId, latitude, longitude, speed, heading, accuracy, timestamp}` and nothing more.

### 6. Broadcast + cache (uniform, regardless of source)

The position cache from [../socket-join-order-fix.md](../socket-join-order-fix.md) must also be updated when a GPS ping comes in — otherwise late-joining parents won't get the cached position when the source is the tracker. Move the cache update + room broadcast into `ingestLocation` so both happen exactly once per accepted ping, regardless of source. This also keeps the `lastPositionCache` semantics that the parent app already depends on.

### 7. Device auth middleware

Create `src/shared/middlewares/device-auth.middleware.ts`:

- Reads `X-Device-IMEI` and `X-Device-Secret`.
- Looks up the device, verifies `is_active`, compares secret using `crypto.timingSafeEqual` against the stored hash.
- On success, attaches `req.device = { _id, imei, vehicle_id }` so the controller doesn't re-query.
- On failure: 401 with a generic message (don't leak whether IMEI or secret was wrong).

### 8. Admin endpoints for vehicle + device management

Add school-admin-scoped routes (existing admin routing style — see commit `87233ce feat: added the admin endpoints to remove blockers`):

- `POST   /api/v1/admin/vehicles` — create vehicle, set `location_source`, optionally bind `gps_device_id`.
- `PATCH  /api/v1/admin/vehicles/:id/location-source` — flip the switch (`DRIVER_APP | GPS_DEVICE | AUTO`).
- `POST   /api/v1/admin/vehicles/:vehicleId/assign-driver` — set `current_driver_id` so the webhook can resolve the active trip.
- `POST   /api/v1/admin/gps-devices` — register IMEI, generate `ingest_secret` (return once, store hashed).
- `POST   /api/v1/admin/gps-devices/:id/rotate-secret` — for revocation.

### 9. Constants & enums

- Add `LocationSource` enum to [src/shared/constants](../../src/shared/constants/) and re-export.
- Add new error messages: `GPS.INVALID_DEVICE_SECRET`, `GPS.DEVICE_NOT_LINKED_TO_VEHICLE`, `GPS.NO_ACTIVE_TRIP_FOR_DEVICE`.
- Add env var `GPS_INGEST_STALENESS_MS=20000` to [environment/](../../environment/) `.env` files.

---

## Critical files to modify or create

**New:**
- `src/modules/vehicles/vehicle/` — model, repository, service, controller, routes
- `src/modules/vehicles/gps-device/` — model, repository, service, controller, routes
- `src/modules/tracking/gps-ingest.controller.ts` — webhook handler
- `src/shared/middlewares/device-auth.middleware.ts` — IMEI+secret validator

**Modify:**
- [src/modules/tracking/tracking.service.ts](../../src/modules/tracking/tracking.service.ts) — extract `ingestLocation`, keep `recordLiveLocation` as adapter; add policy gate; move cache update + broadcast inside the core
- [src/modules/tracking/tracking.type.ts](../../src/modules/tracking/tracking.type.ts) — add internal `source` field to `LocationTracking`
- [src/shared/services/socket.service.ts](../../src/shared/services/socket.service.ts) — route `driver:update_position` through `ingestLocation`; **payload shape on the wire is unchanged**
- [src/shared/constants/collections.ts](../../src/shared/constants/collections.ts) — add `vehicles`, `gps_devices`
- Whichever file aggregates `/api/v1` routes — add `/gps/ingest` and `/admin/vehicles*` / `/admin/gps-devices*`
- [environment/](../../environment/) — add `GPS_INGEST_STALENESS_MS=20000`

---

## Verification

1. **Backwards compatibility (no vehicle row)**
   Default policy = `DRIVER_APP`. Driver app and parent app behave exactly as today. Payload of `trip:position_update` is byte-identical. No regression.

2. **Switch a vehicle to `GPS_DEVICE`**
   - Register a `GPSDevice` (IMEI + secret returned).
   - Point Traccar at `POST /api/v1/gps/ingest` with the secret header.
   - Power on the device in a real vehicle (or use Traccar's test client).
   - Start a trip on that vehicle's driver.
   - Confirm parent socket receives `trip:position_update` with the same payload shape as before while the driver app's emits are silently dropped.
   - The driver app should observe no change in its own behavior (still gets `callback(true)`).

3. **Switch the same vehicle to `AUTO`**
   - With GPS active, driver-app pings are dropped within the 20s freshness window.
   - Stop the tracker for >20s; the next driver-app ping is accepted and broadcast.
   - Toggle works both directions without restart.

4. **Deviation + recalculation** (the main downstream consumer)
   - Move the vehicle (or simulate via Traccar) off-route by >100m.
   - Confirm `autoRecalculateForDeviation` fires and parents receive `parent:route_recalculated` exactly as today.

5. **Position cache for late joiners**
   - Connect a parent socket *after* a GPS ping arrives.
   - Confirm cached position is emitted on `parent:subscribe_trip`, same as the driver-app case.

6. **Webhook auth**
   - POST without `X-Device-Secret` → 401.
   - With wrong secret → 401.
   - With wrong IMEI → 401 (not 404 — don't disclose IMEI existence).

7. **No active trip**
   - Device pings outside any trip window → 204; only `gps_devices.last_*` updated; no socket broadcast.

8. **App regression sweep**
   - Diff packet capture of `trip:position_update` payloads pre- and post-change for a driver-app-only vehicle. Must be identical.
