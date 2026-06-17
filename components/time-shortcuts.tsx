"use client";

import type { TimeShortcut } from "@/lib/types";

interface TimeShortcutsProps {
  shortcuts: TimeShortcut[];
  selectedId: number | null;
  onSelect: (shortcut: TimeShortcut) => void;
}

function resolveTime(time: string): string {
  if (time === "now") {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }
  return time;
}

function formatDisplay(start: string, end: string): string {
  const s = start === "now" ? "nu" : start;
  return `${s} - ${end}`;
}

export default function TimeShortcuts({
  shortcuts,
  selectedId,
  onSelect,
}: TimeShortcutsProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">
        Tijd
      </label>
      <div className="flex flex-wrap gap-2">
        {shortcuts.map((shortcut) => (
          <button
            key={shortcut.id}
            onClick={() => onSelect(shortcut)}
            className={`px-4 py-3 rounded-xl transition-all text-left
              ${
                selectedId === shortcut.id
                  ? "bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20"
                  : "bg-gray-800 text-gray-200 hover:bg-gray-700 active:bg-gray-600"
              }`}
          >
            <div className="text-sm font-medium">{shortcut.label}</div>
            <div
              className={`text-xs mt-0.5 ${
                selectedId === shortcut.id ? "text-emerald-200" : "text-gray-500"
              }`}
            >
              {formatDisplay(shortcut.start_time, shortcut.end_time)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export { resolveTime };
