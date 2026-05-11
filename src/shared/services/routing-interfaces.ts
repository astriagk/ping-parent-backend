export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteLeg {
  distance: number;
  duration: number;
  coordinates: [number, number][];
}

export interface RouteGeometry {
  totalDistance: number;
  totalDuration: number;
  coordinates: [number, number][];
  legs: RouteLeg[];
  routeType: "primary" | "alternative";
  hasAlternatives: boolean;
  alternativeRoutesCount: number;
  trafficDelay?: number;
  confidence: "high" | "medium" | "low";
}

export interface NavigationInstruction {
  route_index: number;
  instruction: string;
  distance_delta: number;
  duration_delta: number;
  distance_from_start: number;
  duration_from_start: number;
  coordinates: [number, number][];
}

export interface AlternativeRoute {
  totalDistance: number;
  totalDuration: number;
  coordinates: [number, number][];
  legs: Array<{ distance: number; duration: number }>;
}

export interface IRoutingProvider {
  calculateOptimalSequence(
    start: Coordinate,
    waypoints: Coordinate[],
  ): Promise<{
    sequence: number[];
    distances: number[];
    totalDistance: number;
  }>;

  getRouteGeometryWithInstructions(
    start: Coordinate,
    waypoints: Coordinate[],
  ): Promise<{
    routeGeometry: RouteGeometry;
    navigationInstructions: NavigationInstruction[];
  }>;

  getAlternativeRoutes(
    start: Coordinate,
    end: Coordinate,
    maxRoutes?: number,
  ): Promise<AlternativeRoute[]>;

  validateApiKey(): Promise<boolean>;
}
