# Google Maps Integration Plan

## Context

You asked: how do you use Google Maps for routing, waypoint optimization, traffic, and deviation handling — and whether the work belongs in Flutter alone or also in the backend.

**Answer to the architecture question:** Google Maps Flutter SDK (`google_maps_flutter`) only **displays** maps and polylines — it does NOT auto-generate routes. To get a polyline through multiple pickup waypoints (with traffic, optimal order, ETAs), *something* has to call a routing API. This backend already does this for TomTom and HERE Maps, including TSP optimization, deviation detection (100m threshold), auto-recalculation, and Socket.IO broadcast to both driver and parent apps. The cleanest path is to **add Google Maps as a third provider on the backend** behind the existing `ROUTING_PROVIDER` env switch — same architecture, same payload format, no rewrites elsewhere. Then the Flutter apps just render whatever the backend sends.

Chosen approach:
- **Backend** → add Google Maps as a 3rd routing provider (alongside TomTom + HERE Maps), selectable via `ROUTING_PROVIDER` env var.
- **Driver app (Flutter)** → Google Navigation SDK (in-app turn-by-turn).
- **Parent app (Flutter)** → render the polyline + waypoints from the backend payload on `google_maps_flutter`.

The Flutter changes are described below for reference, but the only code in *this* repo is the backend provider.

---

## Part A — Backend (this repo)

### A1. Add `GOOGLEMAPS` to `RouteProvider` enum
**File:** [src/shared/constants/enums.ts](src/shared/constants/enums.ts) (lines 160-163)
```ts
export enum RouteProvider {
  TOMTOM = "tomtom",
  HEREMAPS = "heremaps",
  GOOGLEMAPS = "googlemaps",
}
```

### A2. Create `googlemaps.service.ts`
**File:** [src/shared/services/googlemaps.service.ts](src/shared/services/googlemaps.service.ts) (new)

Mirror the structure of [src/shared/services/tomtom.service.ts](src/shared/services/tomtom.service.ts) — class implementing `IRoutingProvider`, singleton export, `axios` HTTP, `logger` from `@shared/utils`, env-var read in constructor, identical error-handling shape.

**Single Google API used: Routes API v2** — endpoint `POST https://routes.googleapis.com/directions/v2:computeRoutes`. Auth via header `X-Goog-Api-Key: $GOOGLE_MAPS_API_KEY`. **Mandatory** header `X-Goog-FieldMask` per call (Routes v2 rejects requests without it).

Method-by-method:

| `IRoutingProvider` method | Google call | Key request fields | Field mask |
|---|---|---|---|
| `calculateOptimalSequence(start, waypoints)` | `computeRoutes` | `origin=start`, `destination=last waypoint`, `intermediates=waypoints[0..n-2]`, `travelMode:"DRIVE"`, `routingPreference:"TRAFFIC_AWARE"`, `optimizeWaypointOrder:true` | `routes.optimizedIntermediateWaypointIndex,routes.legs.distanceMeters,routes.distanceMeters` |
| `getRouteGeometryWithInstructions(start, waypoints)` | `computeRoutes` (no `optimizeWaypointOrder`) | same shape | `routes.duration,routes.staticDuration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration,routes.legs.polyline.encodedPolyline,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.navigationInstruction,routes.legs.steps.polyline.encodedPolyline` |
| `getAlternativeRoutes(start, end, maxRoutes=2)` | `computeRoutes` with `computeAlternativeRoutes:true`; take `routes.slice(1, maxRoutes+1)` | `routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration` |
| `validateApiKey()` | minimal `computeRoutes` with two fixed nearby coords | `routes.distanceMeters` |

**Mapping notes (must produce the exact `RouteGeometry` / `NavigationInstruction` shapes from [src/shared/services/routing-interfaces.ts](src/shared/services/routing-interfaces.ts)):**
- Google returns durations as strings like `"425s"` → write a private `parseSeconds(s: string): number` helper.
- `trafficDelay = max(0, duration - staticDuration)`.
- `confidence` — reuse the same `delayRatio` thresholds as tomtom (`>0.3 → low`, `>0.15 → medium`, else `high`) — see [src/shared/services/tomtom.service.ts](src/shared/services/tomtom.service.ts) (lines 233-237).
- `coordinates: [lat, lng][]` is produced by decoding `routes[0].polyline.encodedPolyline` (precision 5).
- For `calculateOptimalSequence`, build `sequence` as `[...optimizedIntermediateWaypointIndex, lastIndex]` so length === N (matches TomTom contract). Empty/single-waypoint guards mirror [src/shared/services/tomtom.service.ts](src/shared/services/tomtom.service.ts) (lines 83-89).
- Navigation instructions: iterate `routes[0].legs[*].steps[*].navigationInstruction.instructions`, accumulating `distance_from_start` / `duration_from_start`, mirroring `buildNavigationInstructions()` at [src/shared/services/tomtom.service.ts](src/shared/services/tomtom.service.ts) (lines 327-404). Include the same per-leg generic-fallback path when `steps` are missing.

**Error handling (mirror tomtom):** outer `try/catch` per method; `logger.error` + re-throw, except `getAlternativeRoutes` returns `[]` on error and `validateApiKey` returns `false` on error.

**Polyline decoder dependency:** add `@googlemaps/polyline-codec` to `package.json` (small, MIT, zero deps). Use `decode(encoded, 5) → [lat,lng][]` — exact shape match. (Alternative: ~25-line inline decoder if you want zero new deps.)

**Constraints to comment in code:**
- Routes v2 allows up to 25 `intermediates` per call without higher-tier billing — leave a comment near `calculateOptimalSequence`.
- The GCP API key must have **Routes API** enabled and (recommended) be IP-restricted on production.

### A3. Update the provider factory
**File:** [src/shared/utils/routing-provider.ts](src/shared/utils/routing-provider.ts)

Add an import and a branch before the HereMaps one:
```ts
import { googleMapsService } from "../services/googlemaps.service";
// ...
if (provider === RouteProvider.GOOGLEMAPS) {
  logger.info("Routing provider: GoogleMaps");
  return googleMapsService;
}
```
Default fallback stays TomTom — no behavior change unless `ROUTING_PROVIDER=googlemaps` is set.

### A4. Env vars
**Files:** `environment/.env`, `environment/.env.dev`
Add:
```
GOOGLE_MAPS_API_KEY=
```
Switching providers is then just `ROUTING_PROVIDER=googlemaps`. **No other backend code changes** — `tracking.service.ts`, `broadcast.service.ts`, deviation logic, parent ETA notifications all keep working unchanged because they call `routingProvider.*` methods through the interface.

---

## Part B — Flutter (separate repo, for reference)

### Driver app (in-app navigation)
- Add package: `google_navigation_flutter` (Google's official Navigation SDK Flutter wrapper).
- Per-platform setup: enable Navigation SDK on the same GCP project, add `GOOGLE_MAPS_API_KEY` to `AndroidManifest.xml` / `Info.plist`. Note Navigation SDK is a **paid tier** (per-trip billing) — confirm with finance before shipping.
- Listen on the existing Socket.IO `ROUTE_CALCULATED` / `ROUTE_RECALCULATED` events. Extract `waypoints[]` from the payload (lat/lng + ordered).
- Pass them to `GoogleMapsNavigator.setDestinations([Waypoint, ...])` and call `startGuidance()` for in-app turn-by-turn with voice + lane guidance.
- On `ROUTE_RECALCULATED` (deviation case): call `setDestinations(...)` again with the new waypoint order — Navigation SDK will re-route in place.
- Keep sending the driver's GPS position via the existing `UPDATE_LOCATION` socket event so the backend can keep doing deviation detection. **Do not** rely on the Navigation SDK's own deviation handling — the backend is authoritative and is what notifies parents.

### Parent app (read-only display)
- Add package: `google_maps_flutter`.
- Listen on `ROUTE_CALCULATED` / `ROUTE_RECALCULATED` events. The payload already contains `coordinates: [[lat,lng], ...]` (full polyline) and `waypoints` with `estimated_arrival_time`.
- Render `Polyline(points: coordinates.map(LatLng))` directly — no decoding needed; backend already gives a coordinate array.
- Render `Marker`s per waypoint with the per-waypoint ETA chip.
- Render the driver's live position from `LIVE_LOCATION_UPDATE` socket events as an animated marker.

---

## Critical Files

**Modify:**
- [src/shared/constants/enums.ts](src/shared/constants/enums.ts) — add `GOOGLEMAPS` enum value
- [src/shared/utils/routing-provider.ts](src/shared/utils/routing-provider.ts) — add factory branch
- `environment/.env`, `environment/.env.dev` — add `GOOGLE_MAPS_API_KEY`
- `package.json` — add `@googlemaps/polyline-codec`

**Create:**
- [src/shared/services/googlemaps.service.ts](src/shared/services/googlemaps.service.ts)

**Reference (no changes):**
- [src/shared/services/tomtom.service.ts](src/shared/services/tomtom.service.ts) — pattern to mirror
- [src/shared/services/heremaps.service.ts](src/shared/services/heremaps.service.ts) — second reference
- [src/shared/services/routing-interfaces.ts](src/shared/services/routing-interfaces.ts) — contract

---

## Verification

1. **Type check / build:** `npm run build` — must compile.
2. **API key check:** with `GOOGLE_MAPS_API_KEY` set in `environment/.env.dev` and `ROUTING_PROVIDER=googlemaps`, hit a small test endpoint that calls `routingProvider.validateApiKey()` (or write a one-off script) — should log `Routing provider: GoogleMaps` and return `true`.
3. **Optimal sequence:** call the existing `/calculateOptimal` endpoint on a dev trip with 3+ pickup students at known coordinates — confirm:
   - Response contains `optimized_route_data.coordinates` (non-empty polyline).
   - Waypoint order is sensible (compare distance vs. unoptimized order).
   - `total_distance` and `total_duration` look reasonable.
   - `navigation_instructions[]` is non-empty.
4. **Provider parity:** run the same trip with `ROUTING_PROVIDER=tomtom` then `=googlemaps` — total distances should be within ~10–20% of each other; both should produce decodable polylines.
5. **Deviation flow:** simulate driver location off-route via `UPDATE_LOCATION` socket event (>100m from polyline) — confirm `ROUTE_RECALCULATED` fires with a new polyline, parents receive `notifyParentRouteRecalculated`. This must work because we kept the same interface; if it breaks, the issue is in the new provider's response shape.
6. **Flutter integration smoke test:** with the parent app pointed at the dev backend, confirm the polyline renders and updates after a triggered recalc. Defer Navigation SDK testing until that change ships in the driver app repo.
