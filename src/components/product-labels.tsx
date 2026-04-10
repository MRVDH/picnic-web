import type { ProductLabel } from "@/lib/types";

type ProductLabelsProps = {
  labels: ProductLabel[];
};

export function ProductLabels({ labels }: ProductLabelsProps) {
  if (labels.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <span
          key={label.text}
          className="inline-block rounded px-2 py-0.5 text-sm font-medium"
          style={{
            color: label.textColor,
            backgroundColor: label.backgroundColor,
          }}
        >
          {label.text}
        </span>
      ))}
    </div>
  );
}
