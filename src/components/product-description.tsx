type ProductDescriptionProps = {
  description: string | null;
};

/** Render description text with basic markdown bold support. */
function renderDescription(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={index} className="font-semibold">
          {boldMatch[1]}
        </strong>
      );
    }
    return part;
  });
}

export function ProductDescription({ description }: ProductDescriptionProps) {
  if (!description) return null;

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-foreground">
        Beschrijving
      </h2>
      <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
        {renderDescription(description)}
      </p>
    </div>
  );
}
