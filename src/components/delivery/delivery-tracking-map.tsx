"use client";

import { useEffect, useMemo } from "react";

import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import type { DeliveryTrackingData } from "@/lib/core/delivery-types";

import "leaflet/dist/leaflet.css";

const vanIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const homeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ tracking }: { tracking: DeliveryTrackingData }) {
  const map = useMap();

  const bounds = useMemo(() => {
    const points: [number, number][] = tracking.route.map((p) => [p.lat, p.lng]);
    if (tracking.currentPosition) {
      points.push([tracking.currentPosition.lat, tracking.currentPosition.lng]);
    }
    if (tracking.destination) {
      points.push([tracking.destination.lat, tracking.destination.lng]);
    }
    return points;
  }, [tracking]);

  useEffect(() => {
    if (bounds.length === 0) return;
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [bounds, map]);

  return null;
}

type DeliveryTrackingMapProps = {
  tracking: DeliveryTrackingData;
};

export function DeliveryTrackingMap({ tracking }: DeliveryTrackingMapProps) {
  const center = tracking.currentPosition ?? tracking.destination ?? tracking.route[0];

  if (!center) return null;

  const routeLatLngs = tracking.route.map((p) => [p.lat, p.lng] as [number, number]);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      scrollWheelZoom={false}
      className="h-56 w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds tracking={tracking} />
      {routeLatLngs.length > 1 && (
        <Polyline positions={routeLatLngs} pathOptions={{ color: "#e30613", weight: 4 }} />
      )}
      {tracking.currentPosition && (
        <Marker
          position={[tracking.currentPosition.lat, tracking.currentPosition.lng]}
          icon={vanIcon}
        />
      )}
      {tracking.destination && (
        <Marker
          position={[tracking.destination.lat, tracking.destination.lng]}
          icon={homeIcon}
        />
      )}
    </MapContainer>
  );
}
