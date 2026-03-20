import { CATEGORIES } from "../utils/constants";
import { de } from "../i18n/de";

export default function CategoryBadge({ categoryId, small = false }) {
  const cat = CATEGORIES[categoryId];
  const label = de.categories[categoryId]?.short ?? categoryId;

  return (
    <span
      className={`inline-block font-bold tracking-wide rounded ${
        small ? "text-[0.65rem] px-1.5 py-px" : "text-sm px-3.5 py-1"
      }`}
      style={{
        backgroundColor: cat?.color,
        color: cat?.textColor,
        border: cat?.border ? `2px solid ${cat.border}` : undefined,
      }}
    >
      {label}
    </span>
  );
}
