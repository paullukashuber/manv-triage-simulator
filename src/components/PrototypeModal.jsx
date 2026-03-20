import { useState } from "react";
import { de } from "../i18n/de";

export default function PrototypeModal() {
  const [visible, setVisible] = useState(true);
  const t = de.prototypeModal;

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl p-5 max-w-[380px] w-full text-center flex flex-col gap-3">
        <div className="text-3xl leading-none">⚠️</div>
        <h2 className="text-base font-bold text-[var(--color-sk2)]">
          {t.title}
        </h2>
        <p className="text-[0.8rem] leading-relaxed text-[var(--color-text-muted)]">
          {t.text}
        </p>
        <p className="text-[0.8rem] leading-relaxed text-[var(--color-text-muted)]">
          {t.cta}
        </p>
        <button
          onClick={() => setVisible(false)}
          className="w-full py-3 bg-[var(--color-accent)] text-[var(--color-bg)] font-bold rounded-lg active:scale-[0.97] transition-transform cursor-pointer"
        >
          {t.button}
        </button>
      </div>
    </div>
  );
}
