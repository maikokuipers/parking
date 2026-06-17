"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PlateSelector from "@/components/plate-selector";
import TimeShortcuts, { resolveTime } from "@/components/time-shortcuts";
import TimePicker from "@/components/time-picker";
import ParkingButton from "@/components/parking-button";
import ActiveSession from "@/components/active-session";
import type { FavoritePlate, TimeShortcut } from "@/lib/types";

interface ActiveSessionData {
  id: number;
  vrn: string;
  started_at: string;
  ended_at: string;
  status: string;
  cost?: number;
}

export default function HomePage() {
  // State
  const [plates, setPlates] = useState<FavoritePlate[]>([]);
  const [shortcuts, setShortcuts] = useState<TimeShortcut[]>([]);
  const [selectedPlate, setSelectedPlate] = useState<string | null>(null);
  const [selectedShortcutId, setSelectedShortcutId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSessionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [permitId, setPermitId] = useState<number | null>(null);

  // Load initial data
  useEffect(() => {
    Promise.all([
      fetch("/api/plates").then((r) => r.json()),
      fetch("/api/shortcuts").then((r) => r.json()),
      fetch("/api/permits").then((r) => r.json()),
    ]).then(([platesRes, shortcutsRes, permitsRes]) => {
      if (platesRes.success) setPlates(platesRes.data);
      if (shortcutsRes.success) setShortcuts(shortcutsRes.data);
      if (permitsRes.success && permitsRes.data?.permit) {
        // Find the first active visitor permit
        const permits = permitsRes.data.permit;
        if (permits.length > 0) {
          // Use client_product_id from the first permit
          const firstPermit = permits[0];
          setPermitId(
            firstPermit.client_product_id || firstPermit.id
          );
        }
      }
    });
  }, []);

  // Poll active sessions
  const fetchSessions = useCallback(async () => {
    try {
      const params = permitId ? `?product_id=${permitId}` : "";
      const res = await fetch(`/api/sessions${params}`);
      const data = await res.json();
      if (data.success && data.data?.data) {
        // Filter for active sessions (status check)
        const active = data.data.data.filter(
          (s: ActiveSessionData) =>
            s.status === "ACTIVE" ||
            s.status === "STARTED" ||
            new Date(s.ended_at).getTime() > Date.now()
        );
        setActiveSessions(active);
      }
    } catch {
      // Silent fail for polling
    }
  }, [permitId]);

  useEffect(() => {
    if (permitId) {
      fetchSessions();
      const interval = setInterval(fetchSessions, 30_000);
      return () => clearInterval(interval);
    }
  }, [permitId, fetchSessions]);

  // Handle shortcut selection
  const handleShortcutSelect = (shortcut: TimeShortcut) => {
    setSelectedShortcutId(shortcut.id);
    setStartTime(resolveTime(shortcut.start_time));
    setEndTime(shortcut.end_time);
    setError(null);
  };

  // Build ISO datetime from time string (HH:MM) for today
  const timeToIso = (time: string): string => {
    const today = new Date();
    const [hours, minutes] = time.split(":").map(Number);
    today.setHours(hours, minutes, 0, 0);
    return today.toISOString();
  };

  // Start parking
  const handleStart = async () => {
    if (!selectedPlate || !startTime || !endTime) {
      setError("Selecteer een kenteken en tijd");
      return;
    }

    if (!permitId) {
      setError("Geen vergunning gevonden. Controleer je account.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_product_id: permitId,
          plate: selectedPlate,
          start_time: timeToIso(startTime),
          end_time: timeToIso(endTime),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(`Parkeren gestart voor ${selectedPlate}`);
        setSelectedPlate(null);
        setSelectedShortcutId(null);
        setStartTime("");
        setEndTime("");
        fetchSessions();

        // Clear success after 5s
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || "Kon parkeren niet starten");
      }
    } catch (err) {
      setError(`Fout: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Stop session
  const handleStop = async (sessionId: number) => {
    try {
      const now = new Date().toISOString();
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_ended_at: now }),
      });

      const data = await res.json();
      if (data.success) {
        fetchSessions();
      } else {
        setError(data.error || "Kon sessie niet stoppen");
      }
    } catch (err) {
      setError(`Fout: ${err}`);
    }
  };

  const canStart = selectedPlate && startTime && endTime && !loading;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-md mx-auto p-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <h1 className="text-xl font-bold">ParkeerHulp</h1>
          <Link
            href="/settings"
            className="text-gray-400 hover:text-white transition-colors p-2"
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
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Link>
        </div>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="mb-6 space-y-3">
            <h2 className="text-sm font-medium text-gray-400">
              Actieve sessies
            </h2>
            {activeSessions.map((session) => (
              <ActiveSession
                key={session.id}
                session={session}
                onStop={handleStop}
              />
            ))}
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-sm">
            {success}
          </div>
        )}

        {/* Plate Selection */}
        <div className="mb-6">
          <PlateSelector
            plates={plates}
            selectedPlate={selectedPlate}
            onSelect={setSelectedPlate}
          />
        </div>

        {/* Time Shortcuts */}
        <div className="mb-4">
          <TimeShortcuts
            shortcuts={shortcuts}
            selectedId={selectedShortcutId}
            onSelect={handleShortcutSelect}
          />
        </div>

        {/* Manual Time Picker */}
        <div className="mb-6">
          <TimePicker
            startTime={startTime}
            endTime={endTime}
            onStartChange={(t) => {
              setStartTime(t);
              setSelectedShortcutId(null);
            }}
            onEndChange={(t) => {
              setEndTime(t);
              setSelectedShortcutId(null);
            }}
          />
        </div>

        {/* Start Button */}
        <ParkingButton
          disabled={!canStart}
          loading={loading}
          onClick={handleStart}
        />

        {/* Permit info */}
        {!permitId && (
          <p className="text-center text-gray-600 text-xs mt-4">
            Vergunning wordt geladen...
          </p>
        )}
      </div>
    </div>
  );
}
