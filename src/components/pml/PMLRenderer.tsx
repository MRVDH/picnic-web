"use client";

import React from "react";
import { PMLStack } from "./PMLStack";
import { PMLContainer } from "./PMLContainer";
import { PMLImage } from "./PMLImage";
import { PMLRichText } from "./PMLRichText";
import { PMLIcon } from "./PMLIcon";
import { PMLTouchable } from "./PMLTouchable";
import { PMLSellingUnitTile } from "./PMLSellingUnitTile";
import { PMLStepper } from "./PMLStepper";
import { PMLPrice } from "./PMLPrice";
import { PMLTextButton } from "./PMLTextButton";
import { PMLAccordion } from "./PMLAccordion";
import { PMLActivityIndicator } from "./PMLActivityIndicator";

/**
 * Generic PML component renderer.
 * Dispatches to the correct component based on the `type` discriminant.
 */
export function PMLRenderer({ component, images }: { component: any; images?: Record<string, string> }) {
  if (!component) return null;

  // Skip hidden components
  if (component.isHidden) return null;

  switch (component.type) {
    case "STACK":
      return <PMLStack component={component} images={images} />;
    case "CONTAINER":
      return <PMLContainer component={component} images={images} />;
    case "IMAGE":
      return <PMLImage component={component} images={images} />;
    case "RICH_TEXT":
      return <PMLRichText component={component} />;
    case "ICON":
      return <PMLIcon component={component} />;
    case "TOUCHABLE":
      return <PMLTouchable component={component} images={images} />;
    case "SELLING_UNIT_TILE":
      return <PMLSellingUnitTile component={component} />;
    case "STEPPER":
      return <PMLStepper component={component} />;
    case "PRICE":
      return <PMLPrice component={component} />;
    case "TEXT_BUTTON":
      return <PMLTextButton component={component} />;
    case "ACCORDION":
      return <PMLAccordion component={component} images={images} />;
    case "ACTIVITY_INDICATOR":
      return <PMLActivityIndicator />;
    case "ANIMATION_CONTAINER":
    case "REFERENCE_CONTAINER":
      return component.child ? <PMLRenderer component={component.child} images={images} /> : null;
    case "ACCESSIBILITY_CONTAINER":
    case "UNAVAILABILITY_CONTAINER":
    case "SELLING_UNIT_MUTATION":
    case "EXPRESSION":
    case "MODAL":
    case "SOCIAL_SHARE":
    case "SEARCH_RESULT_ENTITY":
      // These are runtime/native-only components — render nothing on web
      return null;
    default:
      if (process.env.NODE_ENV === "development") {
        console.warn(`[PMLRenderer] Unknown component type: ${component.type}`);
      }
      return null;
  }
}
