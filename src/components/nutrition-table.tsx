import type { NutritionRow } from "@/lib/types";

type NutritionTableProps = {
  rows: NutritionRow[];
};

export function NutritionTable({ rows }: NutritionTableProps) {
  if (rows.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-card-border">
      {rows.map((row, index) => (
        <div
          key={`nutrition-${index}`}
          className="flex items-center justify-between px-4 py-3"
          style={{
            backgroundColor: row.backgroundColor ?? undefined,
          }}
        >
          <span
            className={`text-sm ${
              row.isCategory
                ? "font-medium text-foreground"
                : "pl-3 text-gray-600"
            }`}
          >
            {row.label}
          </span>
          {row.value !== null && (
            <span className="text-sm text-gray-600">{row.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}
