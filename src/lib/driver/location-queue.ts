"use client";

export type QueuedLocationUpdate = {
  routeId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  capturedAt: string;
};

const QUEUE_PREFIX = "driver_location_queue";

function getQueueKey(routeId: string) {
  return `${QUEUE_PREFIX}_${routeId}`;
}

function readQueue(routeId: string): QueuedLocationUpdate[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(getQueueKey(routeId));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as QueuedLocationUpdate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(routeId: string, updates: QueuedLocationUpdate[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(getQueueKey(routeId), JSON.stringify(updates));
}

export function enqueueLocationUpdate(routeId: string, update: QueuedLocationUpdate) {
  const queue = readQueue(routeId);
  queue.push(update);
  writeQueue(routeId, queue);
  return queue.length;
}

export function getQueuedUpdateCount(routeId: string) {
  return readQueue(routeId).length;
}

export function clearQueuedUpdates(routeId: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(getQueueKey(routeId));
}

export async function flushQueuedUpdates(
  routeId: string,
  sender: (update: QueuedLocationUpdate) => Promise<boolean>,
) {
  const queue = readQueue(routeId);
  if (queue.length === 0) {
    return { sent: 0, remaining: 0 };
  }

  const remaining: QueuedLocationUpdate[] = [];
  let sent = 0;

  for (const update of queue) {
    const ok = await sender(update);
    if (!ok) {
      remaining.push(update);
    } else {
      sent += 1;
    }
  }

  writeQueue(routeId, remaining);
  return { sent, remaining: remaining.length };
}
