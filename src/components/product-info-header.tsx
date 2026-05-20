type ProductInfoHeaderProps = {
  name: string;
  brand: string;
  unitQuantity: string;
  unitPrice: string | null;
  categoryTag: { text: string; color: string } | null;
};

export function ProductInfoHeader({
  name,
  brand,
  unitQuantity,
  unitPrice,
  categoryTag,
}: ProductInfoHeaderProps) {
  return (
    <div>
      <h1 className="text-foreground text-2xl font-bold">{name}</h1>

      {brand && <p className="mt-1 text-base text-gray-500">{brand}</p>}

      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
        {unitQuantity && <span>{unitQuantity}</span>}
        {unitPrice && (
          <>
            {unitQuantity && <span aria-hidden="true">&middot;</span>}
            <span>{unitPrice}</span>
          </>
        )}
        {categoryTag && (
          <>
            {(unitQuantity || unitPrice) && <span aria-hidden="true">&middot;</span>}
            <span style={{ color: categoryTag.color }} className="font-medium">
              {categoryTag.text}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
