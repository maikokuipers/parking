"use client";

import { useState } from "react";
import type { FavoritePlate } from "@/lib/types";

interface PlateSelectorProps {
  plates: FavoritePlate[];
  selectedPlate: string | null;
  onSelect: (plate: string) => void;
}

export default function PlateSelector({
  plates,
  selectedPlate,
  onSelect,
}: PlateSelectorProps) {
  const [manualInput, setManualInput] = useState("");
  const [showInput, setShowInput] = useState(false);

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onSelect(manualInput.toUpperCase().replace(/\s+/g, "-"));
      setManualInput("");
      setShowInput(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">
        Kenteken
      </label>
      <div className="flex flex-wrap gap-2">
        {plates.map((plate) => (
          <button
            key={plate.id}
            onClick={() => onSelect(plate.plate)}
            className={`px-4 py-3 rounded-xl font-mono text-sm font-bold tracking-wider transition-all
              ${
                selectedPlate === plate.plate
                  ? "bg-blue-600 text-white ring-2 ring-blue-400 shadow-lg shadow-blue-500/20"
                  : "bg-gray-800 text-gray-200 hover:bg-gray-700 active:bg-gray-600"
              }`}
          >
            <div>{plate.plate}</div>
            {plate.description && (
              <div
                className={`text-xs font-normal font-sans mt-0.5 ${
                  selectedPlate === plate.plate
                    ? "text-blue-200"
                    : "text-gray-500"
                }`}
              >
                {plate.description}
              </div>
            )}
          </button>
        ))}

        {/* Manual input toggle */}
        <button
          onClick={() => setShowInput(!showInput)}
          className="px-4 py-3 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 
            active:bg-gray-600 transition-all border-2 border-dashed border-gray-700"
        >
          <div className="text-lg">+</div>
          <div className="text-xs font-normal">Anders</div>
        </button>
      </div>

      {/* Manual plate input */}
      {showInput && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value.toUpperCase())}
            placeholder="AB-123-C"
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white 
              font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
          />
          <button
            onClick={handleManualSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 active:bg-blue-700"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
