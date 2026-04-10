import { renderMarkdownBold } from "@/lib/render-markdown-bold";

type ProductDescriptionProps = {
  description: string | null;
};

export function ProductDescription({ description }: ProductDescriptionProps) {
  if (!description) return null;

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-foreground">
        Beschrijving
      </h2>
      <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
        {renderMarkdownBold(description)}
      </p>
    </div>
  );
}
