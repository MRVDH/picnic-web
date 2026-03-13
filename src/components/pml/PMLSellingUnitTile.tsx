"use client";

import React from "react";
import { getImageUrl } from "@/lib/image-url";

export function PMLSellingUnitTile({ component }: { component: any }) {
  const su = component.sellingUnit;
  const imgConfig = component.sellingUnitImageConfiguration;

  if (!su) return null;

  const imageUrl = imgConfig
    ? getImageUrl(imgConfig.id, "medium")
    : getImageUrl(su.image_id);

  const priceEuros = (su.display_price / 100).toFixed(2).replace(".", ",");

  return (
    <div className="selling-unit-tile">
      <div className="selling-unit-tile__image">
        <img
          src={imageUrl}
          alt={su.name}
          loading="lazy"
        />
      </div>
      <div className="selling-unit-tile__info">
        <div className="selling-unit-tile__price-row">
          <div className="selling-unit-tile__price">€{priceEuros}</div>
        </div>
        <div className="selling-unit-tile__name">{su.name}</div>
        <div className="selling-unit-tile__quantity">{su.unit_quantity}</div>
      </div>
    </div>
  );
}
