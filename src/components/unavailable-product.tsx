type UnavailableOverlayProps = {
  explanation: string | null;
};

/**
 * Renders unavailability explanation text for a cart item that is no longer
 * available.  Returns null when no explanation is provided.
 */
export function UnavailableOverlay({
  explanation,
}: UnavailableOverlayProps) {
  if (!explanation) return null;

  return (
    <div className="mt-2">
      <p className="text-sm text-picnic-orange">{explanation}</p>
    </div>
  );
}
