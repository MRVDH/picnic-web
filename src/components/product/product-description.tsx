import { useTranslations } from "@/contexts/country-context";
import { renderMarkdownBold } from "@/lib/pml/render-markdown-bold";

type ProductDescriptionProps = {
  description: string | null;
};

export function ProductDescription({ description }: ProductDescriptionProps) {
  const t = useTranslations()
  if (!description) return null;

  return (
    <div>
      <h2 className="text-foreground mb-2 text-lg font-semibold">{t.descriptionTitle}</h2>
      <p className="text-sm leading-relaxed whitespace-pre-line text-gray-600">
        {renderMarkdownBold(description)}
      </p>
    </div>
  );
}
