import type { ParcelItem } from "@/lib/core/delivery-types";
import { asArray, asString, isObject } from "@/lib/core/type-guards";

export function parseParcels(rawData: unknown): ParcelItem[] {
  const rawList = Array.isArray(rawData) ? rawData : asArray(rawData);

  return rawList
    .filter(isObject)
    .map((raw) => {
      const id = asString(raw["id"]) || asString(raw["parcel_id"]);
      if (!id) return null;
      const statusObj = isObject(raw["current_status"]) ? raw["current_status"] : null;
      return {
        id,
        carrier: asString(raw["carrier"]) || asString(raw["carrier_name"]),
        status: statusObj ? asString(statusObj["status"]) : asString(raw["status"]),
        statusTimestamp: statusObj ? asString(statusObj["timestamp"]) : "",
        trackingUrl: asString(raw["tracking_url"]) || null,
      };
    })
    .filter((item): item is ParcelItem => item !== null);
}
