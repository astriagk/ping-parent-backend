import { RouteProvider } from "@shared/constants/enums";
import { logger } from "@shared/utils";

import { hereMapsService } from "../services/heremaps.service";
import { IRoutingProvider } from "../services/routing-interfaces";
import { tomTomService } from "../services/tomtom.service";

export function createRoutingProvider(): IRoutingProvider {
  const provider = (
    process.env.ROUTING_PROVIDER ?? RouteProvider.TOMTOM
  ).toLowerCase();

  if (provider === RouteProvider.HEREMAPS) {
    logger.info("Routing provider: HereMaps");
    return hereMapsService;
  }

  logger.info("Routing provider: TomTom");
  return tomTomService;
}

export const routingProvider = createRoutingProvider();
