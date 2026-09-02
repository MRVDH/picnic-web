import type { CountryCode } from "@/lib/core/types";
import type { DeliveryRoutePoint, DeliveryTrackingData } from "@/lib/core/delivery-types";
import { asArray, asNumber, asString, isObject } from "@/lib/core/type-guards";

import { formatEtaText } from "@/lib/delivery/format-delivery-window";

function mapRoutePoint(raw: unknown): DeliveryRoutePoint | null {
  if (!isObject(raw)) return null;
  const lat = asNumber(raw["lat"]);
  const lng = asNumber(raw["lng"]);
  const ts = asNumber(raw["ts"]);
  if (lat === 0 && lng === 0) return null;
  return { lat, lng, ts };
}

function findRoutePoint(route: DeliveryRoutePoint[], scenarioTs: number): DeliveryRoutePoint | null {
  if (route.length === 0) return null;
  let best = route[0];
  let bestDiff = Math.abs(best.ts - scenarioTs);
  for (const point of route) {
    const diff = Math.abs(point.ts - scenarioTs);
    if (diff < bestDiff) {
      best = point;
      bestDiff = diff;
    }
  }
  return best;
}

function vehicleImageDataUrl(image: unknown): string | null {
  if (typeof image !== "string" || image.length === 0) return null;
  if (image.startsWith("data:")) return image;
  return `data:image/png;base64,${image}`;
}

export function parseDeliveryTracking(
  positionRaw: unknown,
  scenarioRaw: unknown,
  countryCode: CountryCode
): DeliveryTrackingData {
  const position = isObject(positionRaw) ? positionRaw : {};
  const scenario = isObject(scenarioRaw) ? scenarioRaw : {};

  const route = asArray(scenario["scenario"])
    .map(mapRoutePoint)
    .filter((point): point is DeliveryRoutePoint => point !== null);

  const scenarioTs = asNumber(position["scenario_ts"]);
  const currentPosition = findRoutePoint(route, scenarioTs);

  const etaWindow = isObject(position["eta_window"]) ? position["eta_window"] : null;
  const etaMs = asNumber(position["eta"]) || null;

  const driver = isObject(scenario["driver"]) ? scenario["driver"] : null;
  const vehicle = isObject(scenario["vehicle"]) ? scenario["vehicle"] : null;
  const destination = isObject(scenario["destination"]) ? scenario["destination"] : null;

  const destLat = destination ? asNumber(destination["lat"]) : 0;
  const destLng = destination ? asNumber(destination["lng"]) : 0;
  const fallbackPoint = route.length > 0 ? route[route.length - 1] : null;
  const resolvedLat = destLat !== 0 ? destLat : (fallbackPoint?.lat ?? 0);
  const resolvedLng = destLng !== 0 ? destLng : (fallbackPoint?.lng ?? 0);

  return {
    scenarioVersion: asNumber(scenario["version"]),
    scenarioInProgress: position["scenario_in_progress"] === true,
    queryInterval: asNumber(position["query_interval"], 15000),
    eta: etaMs,
    etaWindowStart: etaWindow ? asString(etaWindow["start"]) || null : null,
    etaWindowEnd: etaWindow ? asString(etaWindow["end"]) || null : null,
    etaText: formatEtaText(etaMs, countryCode),
    currentPosition,
    route,
    driverName: driver ? asString(driver["name"]) || null : null,
    driverPhotoUrl: driver ? asString(driver["photo_url"]) || null : null,
    vehicleName: vehicle ? asString(vehicle["name"]) || null : null,
    vehicleImageDataUrl: vehicle ? vehicleImageDataUrl(vehicle["image"]) : null,
    destination:
      destination && (resolvedLat !== 0 || resolvedLng !== 0)
        ? {
            lat: resolvedLat,
            lng: resolvedLng,
            street: asString(destination["street"]) || null,
            city: asString(destination["city"]) || null,
            postcode: asString(destination["postcode"]) || null,
          }
        : null,
  };
}
