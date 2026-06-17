"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PinPad() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError("");

    if (newPin.length === 4) {
      submitPin(newPin);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError("");
  };

  const submitPin = async (code: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: code }),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Onjuiste PIN");
        setPin("");
      }
    } catch {
      setError("Verbindingsfout");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 p-4">
      <div className="w-full max-w-xs">
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          ParkeerHulp
        </h1>
        <p className="text-gray-400 text-center mb-8">Voer je PIN in</p>

        {/* PIN dots */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                i < pin.length
                  ? "bg-blue-500 scale-110"
                  : "bg-gray-700 border-2 border-gray-600"
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-400 text-center text-sm mb-4">{error}</p>
        )}

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3">
          {digits.map((digit, i) => {
            if (digit === "") {
              return <div key={i} />;
            }
            if (digit === "del") {
              return (
                <button
                  key={i}
                  onClick={handleDelete}
                  disabled={loading || pin.length === 0}
                  className="h-16 rounded-2xl bg-gray-800 text-gray-300 text-lg font-medium
                    active:bg-gray-700 disabled:opacity-30 transition-colors"
                >
                  ←
                </button>
              );
            }
            return (
              <button
                key={i}
                onClick={() => handleDigit(digit)}
                disabled={loading}
                className="h-16 rounded-2xl bg-gray-800 text-white text-xl font-medium
                  active:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                {digit}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
