# Google Maps cost, usage, and driver vs parent routing

## Purpose

This document explains why the driver needs full route and traffic details while the parent only needs tracking and ETA. It also compares cost efficiency for Google Maps versus the current provider setup, and includes provider usage and sample code for TomTom, HereMaps, and Google Maps.

## Current architecture in backend

- The backend currently selects a routing provider using `process.env.ROUTING_PROVIDER`.
- Supported providers today: `tomtom` and `heremaps`.
- The tracking service calculates optimized sequences, route geometry, and navigation instructions on the server.
- Route metadata is stored in the trip record and broadcast to driver and parent clients.
- Driver app sees full route details, traffic delay, route type, legs, and navigation instructions.
- Parent app only needs trip progress, ETAs, and summary location updates.

## Provider usage comparison

| Provider     | Best use                                           | Backend route calc                                                                    | Traffic & instructions                  | Cost profile                                                                     |
| ------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------- |
| `tomtom`     | Current optimized route + active driver navigation | Yes, server-side, TSP optimization                                                    | Yes, traffic-aware route + instructions | Good for backend route calls, can be cost-effective for repeated trip planning   |
| `heremaps`   | Backend route geometry and route validation        | Yes, server-side with greedy waypoint ordering                                        | Yes, supports polyline + instructions   | Better for simpler route calculations, can be lower cost for single-route usages |
| `googlemaps` | Driver-side navigation + SDK rendering             | Yes, if you want one adapter for backend route storage; optional for client-side only | Yes, strong traffic + reroute support   | Higher per-call cost but best for mobile navigation SDKs and live rerouting      |

## Why the driver sees full details

- The driver is actively navigating and needs:
  - accurate route geometry
  - traffic-aware durations
  - turn-by-turn instructions
  - alternative route data when deviation occurs
- This is similar to an Uber-style driver experience.
- The parent only needs tracking and arrival time because the parent is not moving with the vehicle.
- Sending full route details to parents is unnecessary and increases complexity and cost.

## Why route calculation should stay in backend for now

### Benefits of backend route calculation

- One source of truth for optimized stop order and ETAs.
- Consistent route results across drivers and parent tracking.
- Ability to persist route data and reuse it for recalculations.
- Avoids exposing raw provider keys to client apps.
- Easier to support multiple providers behind the same interface.

### Recommended approach for your use case

- Keep the optimized route and ETA logic in backend.
- Continue broadcasting route metadata and calculated ETAs to parents.
- For the driver app, render the route using Google Maps SDK or the Directions/Routes API.
- The driver app can consume backend waypoint sequence and route geometry rather than recalculating everything itself.

## Example backend usage

This backend code pattern already exists in `src/modules/tracking/tracking.service.ts`:

```ts
const { routeGeometry, navigationInstructions } =
  await routingProvider.getRouteGeometryWithInstructions(
    startPoint,
    optimizedWaypoints,
  );

await trackingRepository.updateTripRouteData(
  tripId,
  routeGeometry,
  routeGeometry.totalDistance,
  routeProvider,
);
```

### TomTom backend example

Current TomTom backend adapter is implemented in `src/shared/services/tomtom.service.ts`.
It uses a single route request to get both route geometry and navigation instructions:

```ts
const url = `${this.baseUrl}/routing/1/calculateRoute/${pointsString}/json`;
const response = await axios.get<TomTomRouteResponse>(url, {
  params: {
    key: this.apiKey,
    instructionsType: "text",
  },
});
```

TomTom returns:

- `summary.lengthInMeters`
- `summary.travelTimeInSeconds`
- `summary.trafficDelayInSeconds`
- `legs[].points`
- `guidance.instructions`

Then the adapter builds `RouteGeometry` and `NavigationInstruction[]`.

### HereMaps backend example

Current HereMaps backend adapter is implemented in `src/shared/services/heremaps.service.ts`.
It calls HERE Routes API with:

```ts
const params: Record<string, string> = {
  apiKey: this.apiKey,
  transportMode: "car",
  origin,
  destination,
  return: "summary,polyline,actions,instructions",
};
const response = await axios.get<HereRouteResponse>(url, { params });
```

HereMaps returns:

- `sections[].summary.length`
- `sections[].summary.duration`
- `sections[].summary.baseDuration`
- `sections[].polyline`
- `sections[].actions`

The adapter decodes HERE flexipolyline to coordinates and constructs legs and instructions.

### Google Maps backend adapter example

If you add a Google Maps provider adapter, it should implement the same `IRoutingProvider` contract.
A minimal implementation can use the Routes API:

```ts
import axios from "axios";

import {
  AlternativeRoute,
  Coordinate,
  IRoutingProvider,
  NavigationInstruction,
  RouteGeometry,
} from "@shared/services/routing-interfaces";

class GoogleMapsService implements IRoutingProvider {
  private apiKey = process.env.GOOGLE_MAPS_API_KEY || "";
  private baseUrl = "https://routes.googleapis.com/directions/v2:computeRoutes";

  async calculateOptimalSequence(start: Coordinate, waypoints: Coordinate[]) {
    // Google Routes API supports waypoint optimization with optimizeWaypoints=true
    const origin = `${start.latitude},${start.longitude}`;
    const destination = `${waypoints[waypoints.length - 1].latitude},${waypoints[waypoints.length - 1].longitude}`;
    const waypointsParam = waypoints
      .slice(0, -1)
      .map((wp) => ({ location: `${wp.latitude},${wp.longitude}` }));

    const response = await axios.post(
      this.baseUrl,
      {
        origin: { location: origin },
        destination: { location: destination },
        waypoints: waypointsParam,
        travelMode: "DRIVE",
        optimizeWaypoints: true,
      },
      {
        params: { key: this.apiKey },
      },
    );

    const route = response.data.routes?.[0];
    const optimizedOrder = route?.waypointOrder ?? [];

    return {
      sequence: optimizedOrder,
      distances: [],
      totalDistance: route?.distanceMeters ?? 0,
    };
  }

  async getRouteGeometryWithInstructions(
    start: Coordinate,
    waypoints: Coordinate[],
  ) {
    const allPoints = [start, ...waypoints];
    const origin = `${allPoints[0].latitude},${allPoints[0].longitude}`;
    const destination = `${allPoints[allPoints.length - 1].latitude},${allPoints[allPoints.length - 1].longitude}`;
    const waypointsParam = allPoints
      .slice(1, -1)
      .map((wp) => ({ location: `${wp.latitude},${wp.longitude}` }));

    const response = await axios.post(
      this.baseUrl,
      {
        origin: { location: origin },
        destination: { location: destination },
        waypoints: waypointsParam,
        travelMode: "DRIVE",
        routeModifiers: { avoidTolls: false },
        computeAlternativeRoutes: false,
        requestedReferenceRoutes: "FALLBACK",
      },
      {
        params: { key: this.apiKey },
      },
    );

    const route = response.data.routes?.[0];
    const legs = route?.legs ?? [];

    const routeGeometry: RouteGeometry = {
      totalDistance: route?.distanceMeters ?? 0,
      totalDuration: route?.duration?.seconds ?? 0,
      coordinates: legs.flatMap((leg) =>
        leg.polyline?.points ? decodePolyline(leg.polyline.points) : [],
      ),
      legs: legs.map((leg) => ({
        distance: leg.distanceMeters,
        duration: leg.duration?.seconds ?? 0,
        coordinates: leg.polyline?.points
          ? decodePolyline(leg.polyline.points)
          : [],
      })),
      routeType: "primary",
      hasAlternatives: false,
      alternativeRoutesCount: 0,
      trafficDelay: route?.travelAdvisory?.trafficDelay?.seconds,
      confidence: "high",
    };

    const navigationInstructions: NavigationInstruction[] = legs.flatMap(
      (leg, legIndex) =>
        (leg.steps ?? []).map((step: any, stepIndex: number) => ({
          route_index: legIndex,
          instruction: step.navigationInstruction?.displayText ?? "",
          distance_delta: (step.distanceMeters ?? 0) / 1000,
          duration_delta: step.duration?.seconds ?? 0,
          distance_from_start: 0,
          duration_from_start: 0,
          coordinates: step.polyline?.points
            ? decodePolyline(step.polyline.points)
            : [],
        })),
    );

    return { routeGeometry, navigationInstructions };
  }

  async getAlternativeRoutes(
    start: Coordinate,
    end: Coordinate,
    maxRoutes = 2,
  ) {
    // Google Maps alternative route handling can be added here if needed.
    return [] as AlternativeRoute[];
  }
}
```

> Note: `decodePolyline` is the Google polyline decoder used to convert encoded route geometry into `[latitude, longitude]` pairs.

## Driver app route rendering

For the driver, use Google Maps SDK or a web map load to render the route and show traffic.

### Example Google Maps JavaScript route rendering

```js
const map = new google.maps.Map(document.getElementById("map"), {
  center: { lat: startLat, lng: startLng },
  zoom: 13,
});

const directionsService = new google.maps.DirectionsService();
const directionsRenderer = new google.maps.DirectionsRenderer({ map });

directionsService.route(
  {
    origin: { lat: startLat, lng: startLng },
    destination: { lat: endLat, lng: endLng },
    waypoints: waypoints.map((wp) => ({
      location: { lat: wp.latitude, lng: wp.longitude },
    })),
    travelMode: google.maps.TravelMode.DRIVING,
    optimizeWaypoints: true,
    drivingOptions: {
      departureTime: new Date(),
      trafficModel: "bestguess",
    },
  },
  (result, status) => {
    if (status === google.maps.DirectionsStatus.OK) {
      directionsRenderer.setDirections(result);
    } else {
      console.error("Google Maps route error", status);
    }
  },
);
```

### Recommended split: driver vs parent

- Driver app:
  - render full route geometry
  - display traffic-aware directions
  - use turn-by-turn instructions
- Parent app:
  - use backend ETA updates
  - display live vehicle location marker
  - do not require the full navigation route

## Google Maps cost efficiency

### Key Google Maps billing items

- `Routes API` / `Directions API` request costs for route calculation.
- `Maps SDK` or map load costs for rendering the route on the driver device.
- Traffic-enabled requests may be more expensive than static directions.
- Recalculation frequency matters: every deviation or trip update can generate an extra request.

### Cost factors for your workflow

- Driver-only detailed navigation is the best use case for Google Maps.
- Parent tracking can remain on the existing provider or use minimal map data.
- If route calculations remain server-side, cost is driven by route requests per trip, not parent map loads.
- If driver app also loads Google Maps tiles frequently, expect additional map load costs.

### Rough comparison vs Here/TomTom

- Here/TomTom pricing is generally oriented around backend route requests and can be cheaper for bulk optimization.
- Google Maps is stronger for mobile navigation SDKs and traffic-aware rerouting, but can be more expensive when used heavily on client-side map loads and repeated route requests.
- In your setup, Google Maps makes sense if:
  - only the driver gets Google navigation
  - parent view remains summary-only
  - backend still handles optimization and ETAs

## How to use Google Maps for this app

### Recommended flow

1. Backend receives trip waypoints and calculates optimized sequence.
2. Backend uses a routing provider adapter to compute route geometry and metrics.
3. Backend stores route metadata and broadcasts updates.
4. Driver app renders route with Google Maps SDK and can use Google navigation features.
5. Parent app continues using current tracking data and ETAs, without full turn-by-turn route details.

### If you add Google Maps support

- Add a `googlemaps` provider adapter that implements `IRoutingProvider`.
- Keep these methods available:
  - `calculateOptimalSequence(start, waypoints)`
  - `getRouteGeometryWithInstructions(start, waypoints)`
  - `getAlternativeRoutes(start, end, maxRoutes)`
- Use backend route results to feed the driver UI and maintain ETA accuracy for parents.

## Cost optimization recommendations

- Do not recalculate routes more often than necessary.
- Reuse route output for the active trip unless the driver deviates significantly.
- Keep parent routing lightweight; send only ETA and status updates.
- Use Google Maps navigation only on the driver side if exact traffic-aware routing is required.

## Why this documentation exists

- To explain why the driver receives rich routing details and parents do not.
- To compare provider costs and help choose whether to move route calculation to Google Maps.
- To document where route calculation should remain in the backend and where Google Maps should be used in the driver app.
