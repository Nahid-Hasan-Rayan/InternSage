// © 2026 Nahid Hasan Rayan. All rights reserved.

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface CommandItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group?: string;
}

export function CommandPalette({
  items,
  open,
  onOpenChange,
}: {
  items: CommandItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q) || i.group?.toLowerCase().includes(q));
  }, [items, query]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const go = React.useCallback(
    (item: CommandItem) => {
      onOpenChange(false);
      router.push(item.href);
    },
    [onOpenChange, router],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) go(item);
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  }

  if (!open) return null;

  // Group while preserving each group's first-appearance order.
  const groups: { name: string; items: CommandItem[] }[] = [];
  for (const item of filtered) {
    const name = item.group ?? "Go to";
    let g = groups.find((g) => g.name === name);
    if (!g) {
      g = { name, items: [] };
      groups.push(g);
    }
    g.items.push(item);
  }
  let flatIndex = 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-[rgba(10,15,12,0.55)] pt-[12vh] backdrop-blur-[2px]"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="mx-4 w-full max-w-[560px] overflow-hidden rounded-2xl bg-paper-0 shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-2.5 border-b border-hairline px-[18px] py-4">
          <Search size={17} className="shrink-0 text-slate-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Jump to a page, or search…"
            className="flex-1 border-none bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-slate-500"
          />
          <kbd className="mono rounded bg-paper-100 px-1.5 py-0.5 text-[10px] text-slate-500">esc</kbd>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-slate-500">No matches for &ldquo;{query}&rdquo;.</p>
          )}
          {groups.map((group) => (
            <div key={group.name}>
              <p className="px-3 pb-1 pt-2.5 text-[10.5px] uppercase tracking-[0.05em] text-slate-500">
                {group.name}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = flatIndex === activeIndex;
                const idx = flatIndex;
                flatIndex += 1;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => go(item)}
                    className={
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13.5px] transition-colors " +
                      (isActive ? "bg-signal-100 text-signal-700" : "text-ink-900 hover:bg-paper-100")
                    }
                  >
                    <Icon size={15} className="shrink-0 opacity-70" />
                    <span>{item.label}</span>
                    {isActive && <CornerDownLeft size={13} className="ml-auto shrink-0 opacity-60" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
