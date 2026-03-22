# Socket Join-Order Fix

## Problem

When a parent joins the trip room before the driver, they receive no position updates until the driver's next socket emit (10+ second gap).

**Root causes:**
1. Driver sends HTTP position update before joining the socket room — broadcast hits an empty room
2. No position cache — late joiners have nothing to receive
3. No last-known position on reconnect

---

## Solution

Add an in-memory position cache (`Map<tripId, CachedPosition>`) in `socket.service.ts`. When a parent joins, immediately emit the cached position if one exists.

---

## Backend Changes

| File | Change |
|------|--------|
| `src/shared/services/socket.service.ts` | Add `lastPositionCache`, update on `driver:update_position`, send to parent on `parent:subscribe_trip`, clear on `driver:trip_completed` |
| `src/modules/tracking/tracking.socket.service.ts` | Call `updatePositionCache()` from `broadcastPositionUpdate()` |
| `src/modules/tracking/tracking.service.ts` | (Optional) Remove redundant HTTP broadcast |

---

## Driver App — Required Sequence

1. Connect socket (wait for `connect` event)
2. Emit `driver:subscribe_trip` and wait for `callback(true)` — **before any API calls**
3. Call REST APIs (`GET /trips/progress`, `POST /tracking/tomtom`)
4. Emit `driver:trip_started`
5. Emit `driver:update_position` every 10 seconds
6. Emit `driver:trip_completed` when done

> **Critical**: Subscribe to the room (step 2) before making HTTP calls so position broadcasts reach room members.

---

## Parent App — Required Sequence

1. Connect socket with `role: "parent"`
2. Emit `parent:subscribe_trip` with `tripId`
   - Server sends cached position immediately if available
3. Listen for `trip:position_update`, `trip:started`, `trip:completed`
4. Emit `parent:unsubscribe_trip` when leaving the screen

---

## Test Scenarios

| Scenario | Expected |
|----------|----------|
| Driver joins first, then parent | Parent gets position on next 10s emit |
| Parent joins first, then driver | Parent gets cached position immediately after driver's first emit |
| Parent joins while driver is active | Parent gets last cached position immediately |
| Parent reconnects mid-trip | Parent gets last cached position immediately |
| Trip completes | Cache is cleared |
