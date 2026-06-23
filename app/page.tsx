"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import PlateSelector from "@/components/plate-selector";
import TimeShortcuts, { resolveTime } from "@/components/time-shortcuts";
import TimePicker from "@/components/time-picker";
import ParkingButton from "@/components/parking-button";
import ActiveSession from "@/components/active-session";
import type { FavoritePlate, TimeShortcut } from "@/lib/types";
import {
  registerServiceWorker,
  requestNotificationPermission,
  scheduleSessionNotification,
  cancelSessionNotification,
  syncSessionNotifications,
  getNotificationPermission,
} from "@/lib/notifications";

interface ActiveSessionData {
  parking_session_id: number;
  vrn: string;
  started_at: string;
  ended_at: string;
  status: string;
  cost: number;
  zone_description: string;
  can_edit: boolean;
}

interface ZoneData {
  zone_id: number;
  zone_description: string;
}

export default function HomePage() {
  // State
  const [plates, setPlates] = useState<FavoritePlate[]>([]);
  const [shortcuts, setShortcuts] = useState<TimeShortcut[]>([]);
  const [selectedPlate, setSelectedPlate] = useState<string | null>(null);
  const [selectedShortcutId, setSelectedShortcutId] = useState<number | null>(
    null
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSessionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clientProductId, setClientProductId] = useState<number | null>(null);
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const swReady = useRef(false);

  // Register service worker
  useEffect(() => {
    registerServiceWorker().then((reg) => {
      if (reg) {
        swReady.current = true;
        setNotificationPermission(getNotificationPermission());
      }
    });
  }, []);

  // Load initial data
  useEffect(() => {
    Promise.all([
      fetch("/api/plates").then((r) => r.json()),
      fetch("/api/shortcuts").then((r) => r.json()),
      fetch("/api/permits").then((r) => r.json()),
    ])
      .then(([platesRes, shortcutsRes, permitsRes]) => {
        if (platesRes.success) setPlates(platesRes.data);
        if (shortcutsRes.success) setShortcuts(shortcutsRes.data);
        if (permitsRes.success && permitsRes.data) {
          setClientProductId(permitsRes.data.client_product_id);
          if (permitsRes.data.zones) {
            setZones(permitsRes.data.zones);
            // Auto-select first zone
            if (permitsRes.data.zones.length > 0) {
              setSelectedZoneId(permitsRes.data.zones[0].zone_id);
            }
          }
        }
      })
      .finally(() => setInitialLoading(false));
  }, []);

  // Poll active sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions?page=1&row_per_page=10");
      const data = await res.json();
      if (data.success && data.data?.data) {
        const active = data.data.data.filter(
          (s: ActiveSessionData) =>
            s.status === "ACTIVE" || s.status === "STARTED"
        );
        setActiveSessions(active);

        // Sync notification timers with active sessions
        if (swReady.current && getNotificationPermission() === "granted") {
          syncSessionNotifications(
            active.map((s: ActiveSessionData) => ({
              sessionId: s.parking_session_id,
              vrn: s.vrn,
              endTime: s.ended_at,
            }))
          );
        }
      }
    } catch {
      // Silent fail for polling
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30_000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  // Handle shortcut selection
  const handleShortcutSelect = (shortcut: TimeShortcut) => {
    setSelectedShortcutId(shortcut.id);
    setStartTime(resolveTime(shortcut.start_time));
    setEndTime(shortcut.end_time);
    setError(null);
  };

  // Build ISO datetime from time string (HH:MM) for today in Europe/Amsterdam
  const timeToIso = (time: string): string => {
    const now = new Date();
    const [hours, minutes] = time.split(":").map(Number);
    // Build date string in local time with explicit timezone
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const h = String(hours).padStart(2, "0");
    const m = String(minutes).padStart(2, "0");
    // Use +02:00 for CEST (Amsterdam summer time) or +01:00 for CET
    // Simple heuristic: if month is between April and October, use CEST
    const isSummer = now.getMonth() >= 2 && now.getMonth() <= 9;
    const tz = isSummer ? "+02:00" : "+01:00";
    return `${year}-${month}-${day}T${h}:${m}:00${tz}`;
  };

  // Start parking
  const handleStart = async () => {
    if (!selectedPlate || !startTime || !endTime) {
      setError("Selecteer een kenteken en tijd");
      return;
    }

    if (!clientProductId) {
      setError("Geen vergunning gevonden. Controleer je account.");
      return;
    }

    if (!selectedZoneId) {
      setError("Geen zone geselecteerd");
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
          client_product_id: clientProductId,
          plate: selectedPlate,
          start_time: timeToIso(startTime),
          end_time: timeToIso(endTime),
          zone_id: selectedZoneId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(`Parkeren gestart voor ${selectedPlate}`);

        // Schedule notification 5 min before end
        if (swReady.current) {
          const granted = await requestNotificationPermission();
          setNotificationPermission(granted ? "granted" : "denied");
          if (granted && data.data?.parking_session_id) {
            scheduleSessionNotification(
              data.data.parking_session_id,
              selectedPlate,
              timeToIso(endTime)
            );
          }
        }

        setSelectedPlate(null);
        setSelectedShortcutId(null);
        setStartTime("");
        setEndTime("");
        fetchSessions();

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
      // Cancel notification timer immediately
      cancelSessionNotification(sessionId);

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

  const canStart =
    selectedPlate && startTime && endTime && selectedZoneId && !loading;

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-md mx-auto p-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <h1 className="text-xl font-bold">ParkeerHulp</h1>
          <div className="flex items-center gap-2">
            {/* Notification toggle */}
            {notificationPermission !== "unsupported" && (
              <button
                onClick={async () => {
                  const granted = await requestNotificationPermission();
                  setNotificationPermission(granted ? "granted" : "denied");
                }}
                className={`p-2 transition-colors ${
                  notificationPermission === "granted"
                    ? "text-emerald-400"
                    : "text-gray-500 hover:text-white"
                }`}
                title={
                  notificationPermission === "granted"
                    ? "Notificaties aan"
                    : notificationPermission === "denied"
                      ? "Notificaties geblokkeerd in browser-instellingen"
                      : "Notificaties inschakelen"
                }
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
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  {notificationPermission !== "granted" && (
                    <line x1="1" y1="1" x2="23" y2="23" />
                  )}
                </svg>
              </button>
            )}
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
        </div>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="mb-6 space-y-3">
            <h2 className="text-sm font-medium text-gray-400">
              Actieve sessies
            </h2>
            {activeSessions.map((session) => (
              <ActiveSession
                key={session.parking_session_id}
                session={{
                  id: session.parking_session_id,
                  vrn: session.vrn,
                  started_at: session.started_at,
                  ended_at: session.ended_at,
                  status: session.status,
                  cost: session.cost,
                }}
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
        <div className="mb-4">
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

        {/* Zone Selection */}
        {zones.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Zone
            </label>
            <select
              value={selectedZoneId || ""}
              onChange={(e) => setSelectedZoneId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm
                focus:outline-none focus:border-blue-500"
            >
              {zones.map((zone) => (
                <option key={zone.zone_id} value={zone.zone_id}>
                  {zone.zone_description}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Start Button */}
        <ParkingButton
          disabled={!canStart}
          loading={loading}
          onClick={handleStart}
        />

        {/* Permit info */}
        {!clientProductId && !initialLoading && (
          <p className="text-center text-red-400 text-xs mt-4">
            Geen vergunning gevonden. Check je Egis credentials.
          </p>
        )}
      </div>
    </div>
  );
}
