"use client";

import { useState, useEffect } from "react";

interface ActiveSessionProps {
  session: {
    id: number;
    vrn: string;
    started_at: string;
    ended_at: string;
    status: string;
    cost?: number;
  };
  onStop: (sessionId: number) => void;
}

function formatTimeRemaining(endTime: string): string {
  const end = new Date(endTime).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) return "Verlopen";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}u ${minutes}m resterend`;
  }
  return `${minutes}m resterend`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function ActiveSession({ session, onStop }: ActiveSessionProps) {
  const [remaining, setRemaining] = useState(
    formatTimeRemaining(session.ended_at)
  );
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(formatTimeRemaining(session.ended_at));
    }, 30_000);
    return () => clearInterval(interval);
  }, [session.ended_at]);

  const isExpired = new Date(session.ended_at).getTime() <= Date.now();

  const handleStop = async () => {
    setStopping(true);
    try {
      await onStop(session.id);
    } finally {
      setStopping(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl border ${
        isExpired
          ? "bg-red-950/50 border-red-800"
          : "bg-emerald-950/50 border-emerald-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono font-bold text-white tracking-wider">
            {session.vrn}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {formatTime(session.started_at)} - {formatTime(session.ended_at)}
          </div>
          <div
            className={`text-sm font-medium mt-1 ${
              isExpired ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {remaining}
          </div>
        </div>
        <button
          onClick={handleStop}
          disabled={stopping}
          className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium
            hover:bg-red-500 active:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {stopping ? "..." : "Stop"}
        </button>
      </div>
    </div>
  );
}
