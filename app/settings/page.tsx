"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { TimeShortcut, FavoritePlate } from "@/lib/types";

export default function SettingsPage() {
  const [shortcuts, setShortcuts] = useState<TimeShortcut[]>([]);
  const [plates, setPlates] = useState<FavoritePlate[]>([]);

  // New shortcut form
  const [newLabel, setNewLabel] = useState("");
  const [newStartTime, setNewStartTime] = useState("now");
  const [newStartFixed, setNewStartFixed] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("19:00");
  const [isStartNow, setIsStartNow] = useState(true);

  // New plate form
  const [newPlate, setNewPlate] = useState("");
  const [newPlateDesc, setNewPlateDesc] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/shortcuts").then((r) => r.json()),
      fetch("/api/plates").then((r) => r.json()),
    ]).then(([shortcutsRes, platesRes]) => {
      if (shortcutsRes.success) setShortcuts(shortcutsRes.data);
      if (platesRes.success) setPlates(platesRes.data);
    });
  }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  // Shortcut CRUD
  const addShortcut = async () => {
    if (!newLabel || !newEndTime) return;
    setSaving(true);
    try {
      const startTime = isStartNow ? "now" : newStartFixed;
      const res = await fetch("/api/shortcuts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newLabel,
          start_time: startTime,
          end_time: newEndTime,
          sort_order: shortcuts.length + 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShortcuts([...shortcuts, data.data]);
        setNewLabel("");
        setNewStartFixed("09:00");
        setNewEndTime("19:00");
        setIsStartNow(true);
        showMessage("Shortcut toegevoegd");
      }
    } finally {
      setSaving(false);
    }
  };

  const removeShortcut = async (id: number) => {
    const res = await fetch(`/api/shortcuts/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setShortcuts(shortcuts.filter((s) => s.id !== id));
      showMessage("Shortcut verwijderd");
    }
  };

  // Plate CRUD
  const addPlate = async () => {
    if (!newPlate) return;
    setSaving(true);
    try {
      const res = await fetch("/api/plates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate: newPlate,
          description: newPlateDesc || null,
          sort_order: plates.length + 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlates([...plates, data.data]);
        setNewPlate("");
        setNewPlateDesc("");
        showMessage("Kenteken toegevoegd");
      }
    } finally {
      setSaving(false);
    }
  };

  const removePlate = async (id: number) => {
    const res = await fetch(`/api/plates/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setPlates(plates.filter((p) => p.id !== id));
      showMessage("Kenteken verwijderd");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-md mx-auto p-4 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors p-2 -ml-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">Instellingen</h1>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-sm">
            {message}
          </div>
        )}

        {/* ============ Time Shortcuts ============ */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
            Tijd Shortcuts
          </h2>

          {/* Existing shortcuts */}
          <div className="space-y-2 mb-4">
            {shortcuts.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 bg-gray-900 rounded-xl border border-gray-800"
              >
                <div>
                  <div className="font-medium text-sm">{s.label}</div>
                  <div className="text-xs text-gray-500">
                    {s.start_time === "now" ? "nu" : s.start_time} - {s.end_time}
                  </div>
                </div>
                <button
                  onClick={() => removeShortcut(s.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950 rounded-lg transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}

            {shortcuts.length === 0 && (
              <p className="text-gray-600 text-sm">
                Geen shortcuts. Voeg er hieronder een toe.
              </p>
            )}
          </div>

          {/* Add new shortcut form */}
          <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 space-y-3">
            <h3 className="text-sm font-medium text-gray-400">
              Nieuwe shortcut
            </h3>

            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (bijv. 'Hele dag')"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm
                placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Starttijd
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={isStartNow}
                    onChange={() => setIsStartNow(true)}
                    className="accent-blue-500"
                  />
                  <span className="text-gray-300">Nu</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={!isStartNow}
                    onChange={() => setIsStartNow(false)}
                    className="accent-blue-500"
                  />
                  <span className="text-gray-300">Vast:</span>
                </label>
                {!isStartNow && (
                  <input
                    type="time"
                    value={newStartFixed}
                    onChange={(e) => setNewStartFixed(e.target.value)}
                    className="px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm
                      focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Eindtijd
              </label>
              <input
                type="time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm
                  focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={addShortcut}
              disabled={saving || !newLabel || !newEndTime}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
                hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Toevoegen
            </button>
          </div>
        </section>

        {/* ============ Favorite Plates ============ */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
            Favoriete Kentekens
          </h2>

          {/* Existing plates */}
          <div className="space-y-2 mb-4">
            {plates.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 bg-gray-900 rounded-xl border border-gray-800"
              >
                <div>
                  <div className="font-mono font-bold text-sm tracking-wider">
                    {p.plate}
                  </div>
                  {p.description && (
                    <div className="text-xs text-gray-500">{p.description}</div>
                  )}
                </div>
                <button
                  onClick={() => removePlate(p.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950 rounded-lg transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}

            {plates.length === 0 && (
              <p className="text-gray-600 text-sm">
                Geen kentekens. Voeg er hieronder een toe.
              </p>
            )}
          </div>

          {/* Add new plate form */}
          <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 space-y-3">
            <h3 className="text-sm font-medium text-gray-400">
              Nieuw kenteken
            </h3>

            <input
              type="text"
              value={newPlate}
              onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
              placeholder="AB-123-C"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm
                font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />

            <input
              type="text"
              value={newPlateDesc}
              onChange={(e) => setNewPlateDesc(e.target.value)}
              placeholder="Beschrijving (optioneel)"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm
                placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />

            <button
              onClick={addPlate}
              disabled={saving || !newPlate}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
                hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Toevoegen
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
