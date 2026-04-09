/**
 * Bundle dot indicators.
 *
 * Renders a row of small dots below the quantity count in the stepper.
 * Filled dots represent progress toward the next bundle threshold;
 * unfilled dots show the remaining count needed.
 */

type BundleDotsProps = {
  /** Total number of dots to render. */
  totalDots: number;
  /** Number of dots that should be filled (solid). */
  filledDots: number;
};

export function BundleDots({ totalDots, filledDots }: BundleDotsProps) {
  if (totalDots <= 0) return null;

  const dots: boolean[] = [];
  for (let i = 0; i < totalDots; i++) {
    dots.push(i < filledDots);
  }

  return (
    <div className="flex items-center justify-center gap-1">
      {dots.map((isFilled, index) => (
        <span
          key={index}
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            isFilled
              ? "bg-picnic-red"
              : "border border-gray-300 bg-transparent"
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
