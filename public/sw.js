/**
 * ParkeerHulp Service Worker
 * Handles parking session expiry notifications.
 * Receives messages from the main app to schedule/cancel notification timers.
 */

const NOTIFICATION_TIMERS = new Map();

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  const { type, sessionId, vrn, endTime } = event.data;

  if (type === "SCHEDULE_NOTIFICATION") {
    scheduleNotification(sessionId, vrn, endTime);
  } else if (type === "CANCEL_NOTIFICATION") {
    cancelNotification(sessionId);
  } else if (type === "SYNC_SESSIONS") {
    // Re-schedule all active sessions (e.g. after page reload)
    const sessions = event.data.sessions;
    // Clear all existing timers
    for (const [id, timerId] of NOTIFICATION_TIMERS) {
      clearTimeout(timerId);
      NOTIFICATION_TIMERS.delete(id);
    }
    // Schedule new timers
    if (sessions && Array.isArray(sessions)) {
      sessions.forEach((s) => {
        scheduleNotification(s.sessionId, s.vrn, s.endTime);
      });
    }
  }
});

function scheduleNotification(sessionId, vrn, endTime) {
  // Cancel existing timer for this session
  cancelNotification(sessionId);

  const endMs = new Date(endTime).getTime();
  const notifyAt = endMs - 5 * 60 * 1000; // 5 minutes before end
  const now = Date.now();
  const delay = notifyAt - now;

  if (delay <= 0) {
    // Already past the 5-minute mark, check if session hasn't ended yet
    if (endMs > now) {
      // Session still active but less than 5 min left - notify immediately
      showNotification(vrn, endTime);
    }
    return;
  }

  const timerId = setTimeout(() => {
    showNotification(vrn, endTime);
    NOTIFICATION_TIMERS.delete(sessionId);
  }, delay);

  NOTIFICATION_TIMERS.set(sessionId, timerId);
}

function cancelNotification(sessionId) {
  const timerId = NOTIFICATION_TIMERS.get(sessionId);
  if (timerId) {
    clearTimeout(timerId);
    NOTIFICATION_TIMERS.delete(sessionId);
  }
}

function showNotification(vrn, endTime) {
  const endDate = new Date(endTime);
  const timeStr =
    String(endDate.getHours()).padStart(2, "0") +
    ":" +
    String(endDate.getMinutes()).padStart(2, "0");

  self.registration.showNotification("Parkeren verloopt bijna!", {
    body: `${vrn} verloopt om ${timeStr} (over 5 minuten)`,
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    tag: `parking-expiry-${vrn}`,
    requireInteraction: true,
    vibrate: [200, 100, 200],
  });
}

// When user clicks the notification, open/focus the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      // Focus existing window if found
      for (const client of clientList) {
        if (client.url.includes("/") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow("/");
    })
  );
});
