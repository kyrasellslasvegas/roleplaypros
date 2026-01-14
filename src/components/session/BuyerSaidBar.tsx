"use client";

import * as React from "react";

export type BuyerTag = {
  key: string;
  label: string;
  hint?: string;
};

export function BuyerSaidBar(props: {
  title?: string;
  tags: BuyerTag[];
  selectedKey: string | null;
  onSelectAction: (key: string) => void;
  rightSlot?: React.ReactNode; // optional controls (format/vibe toggles)
}) {
  const { title = "Buyer just said", tags, selectedKey, onSelectAction, rightSlot } = props;

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-zinc-900">{title}</div>
          <div className="text-xs text-zinc-500">Pick the pressure spike you want the buyer to apply.</div>
        </div>

        {rightSlot ? <div className="flex items-center gap-3">{rightSlot}</div> : null}
      </div>

      {/* one-row, scrollable chips */}
      <div className="mt-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tags.map((t) => {
            const active = selectedKey === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onSelectAction(t.key)}
                className={[
                  "shrink-0 rounded-full border px-4 py-2 text-sm transition",
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bgt"
                ].join(" ")}
                title={t.hint || ""}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
