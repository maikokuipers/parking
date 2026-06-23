/**
 * Client-side notification helpers.
 * Handles service worker registration, permission requests,
 * and scheduling/cancelling parking expiry notifications.
 */

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register the service worker. Call once on app load.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    swRegistration = registration;
    return registration;
  } catch (err) {
    console.error("SW registration failed:", err);
    return null;
  }
}

/**
 * Request notification permission from the user.
 * Returns true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const result = await Notification.requestPermission();
  return result === "granted";
}

/**
 * Get current notification permission status.
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Schedule a notification 5 minutes before a parking session ends.
 */
export function scheduleSessionNotification(
  sessionId: number,
  vrn: string,
  endTime: string
): void {
  const sw = navigator.serviceWorker?.controller;
  if (!sw) return;

  sw.postMessage({
    type: "SCHEDULE_NOTIFICATION",
    sessionId,
    vrn,
    endTime,
  });
}

/**
 * Cancel a scheduled notification for a session.
 */
export function cancelSessionNotification(sessionId: number): void {
  const sw = navigator.serviceWorker?.controller;
  if (!sw) return;

  sw.postMessage({
    type: "CANCEL_NOTIFICATION",
    sessionId,
  });
}

/**
 * Sync all active sessions with the service worker.
 * Useful after page reload to re-schedule notifications.
 */
export function syncSessionNotifications(
  sessions: { sessionId: number; vrn: string; endTime: string }[]
): void {
  const sw = navigator.serviceWorker?.controller;
  if (!sw) return;

  sw.postMessage({
    type: "SYNC_SESSIONS",
    sessions,
  });
}
