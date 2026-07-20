/**
 * Shared meeting-link helpers (Jitsi Meet).
 *
 * A Jitsi room is created simply by opening its URL, and everyone who opens
 * the SAME URL lands in the SAME room. That property is what fixes the old
 * behaviour, where `https://meet.google.com/new` spawned a brand-new
 * (different) Google Meet room for every person who clicked it.
 */

/**
 * A fresh, unguessable room link. Generate this ONCE when a meeting is
 * created, store it on the meeting record, and open/share that stored link.
 */
export function newJitsiLink(): string {
  return `https://meet.jit.si/QNNX-${crypto.randomUUID()}`;
}

/**
 * The URL a Join button should open. Prefers the link stored on the meeting;
 * for meetings saved without a link, falls back to a room named after the
 * meeting's own id — deterministic, so every joiner still lands in the SAME
 * room (never a per-click new one).
 */
export function joinUrl(meeting: { id: string; link?: string | null }): string {
  return meeting.link || `https://meet.jit.si/QNNX-${meeting.id}`;
}

/**
 * Determines if a meeting should be shown in the "Upcoming" list.
 * Any meeting scheduled for today or in the future is considered upcoming.
 */
export function isUpcoming(dateStr: string): boolean {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}
