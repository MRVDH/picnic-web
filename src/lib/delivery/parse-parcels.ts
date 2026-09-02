import type { ParcelItem } from "@/lib/core/delivery-types";
import { asArray, asString, isObject } from "@/lib/core/type-guards";

/**
 * Parse the raw `/parcels` response into ParcelItems.
 *
 * Raw shape (picnic-api `Parcel`):
 * `{ id, handler_name, active, current_status: { status, timestamp } }`.
 */
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
        carrier: asString(raw["handler_name"]) || asString(raw["carrier"]),
        active: raw["active"] === true,
        status: statusObj ? asString(statusObj["status"]) : asString(raw["status"]),
        statusTimestamp: statusObj ? asString(statusObj["timestamp"]) : "",
      };
    })
    .filter((item): item is ParcelItem => item !== null);
}
