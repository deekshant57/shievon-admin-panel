import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ServiceScheduleEntry } from '@/types';

dayjs.extend(utc);
dayjs.extend(timezone);

export type ServiceStatus = 'open' | 'closed_manual' | 'closed_schedule';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function getDayName(day: number): string {
  return DAY_NAMES[day] ?? '';
}

/** Normalize "HH:mm" / "HH:mm:ss" to "HH:mm" for string compare. */
function toHm(time: string | undefined | null): string {
  if (!time) return '';
  const parts = String(time).split(':');
  const h = (parts[0] ?? '00').padStart(2, '0');
  const m = (parts[1] ?? '00').padStart(2, '0');
  return `${h}:${m}`;
}

function nowInShopTimezone(tz: string | undefined | null) {
  if (!tz) return dayjs();
  try {
    return dayjs().tz(tz);
  } catch {
    return dayjs();
  }
}

function findDayEntry(
  schedule: ServiceScheduleEntry[],
  day: number,
): ServiceScheduleEntry | undefined {
  const byDay = schedule.find((e) => Number(e.day) === day);
  if (byDay) return byDay;
  // Fallback: array index matches weekday when `day` is missing from API rows
  const byIndex = schedule[day];
  if (byIndex && (byIndex.day === undefined || byIndex.day === null)) {
    return byIndex;
  }
  return undefined;
}

/**
 * Check if the current time in the given timezone falls within today's
 * settings.serviceSchedule window.
 *
 * Do NOT use timings.open / timings.close here — those are display-only.
 *
 * Returns false when there is no schedule, no matching day entry, or today
 * is disabled / outside the open–close window.
 * Handles overnight spans where close < open (e.g. 22:00–02:00).
 */
export function isWithinSchedule(
  schedule: ServiceScheduleEntry[] | undefined | null,
  tz: string | undefined | null,
): boolean {
  if (!schedule || schedule.length === 0) return false;

  const now = nowInShopTimezone(tz);
  const currentDay = now.day(); // 0–6
  const currentTime = now.format('HH:mm');

  const todayEntry = findDayEntry(schedule, currentDay);
  if (!todayEntry || !todayEntry.enabled) {
    // Yesterday's overnight span may still cover "now"
    const yesterdayDay = (currentDay + 6) % 7;
    const yesterdayEntry = findDayEntry(schedule, yesterdayDay);
    if (
      yesterdayEntry?.enabled &&
      toHm(yesterdayEntry.close) < toHm(yesterdayEntry.open) &&
      currentTime < toHm(yesterdayEntry.close)
    ) {
      return true;
    }
    return false;
  }

  const open = toHm(todayEntry.open);
  const close = toHm(todayEntry.close);
  if (!open || !close) return false;

  // Same-day span: open <= close (e.g. 09:00–22:00)
  if (open <= close) {
    return currentTime >= open && currentTime < close;
  }

  // Overnight span: open > close (e.g. 22:00–02:00)
  return currentTime >= open || currentTime < close;
}

/**
 * Compute the shop's current service status.
 *
 * Priority:
 * 1. Manual accepting-orders switch (`is_serviceable === false`) → closed_manual
 * 2. Outside today's enabled serviceSchedule window → closed_schedule
 * 3. Otherwise → open
 *
 * Callers that gate on shop activity should hide UI when `is_active` is false
 * before using this (inactive shops show no serviceability banner).
 */
export function getServiceStatus(
  isServiceable: boolean | undefined,
  schedule: ServiceScheduleEntry[] | undefined | null,
  tz: string | undefined | null,
): ServiceStatus {
  // Undefined defaults to accepting (same as other vendor toggles)
  if (isServiceable === false) return 'closed_manual';
  if (!isWithinSchedule(schedule, tz)) return 'closed_schedule';
  return 'open';
}

/**
 * Find the next time the shop opens, based on serviceSchedule.
 * Returns a formatted string like "09:00 AM" or null if none.
 */
export function getNextOpenTime(
  schedule: ServiceScheduleEntry[] | undefined | null,
  tz: string | undefined | null,
): string | null {
  if (!schedule || schedule.length === 0) return null;

  const now = nowInShopTimezone(tz);
  const currentDay = now.day();
  const currentTime = now.format('HH:mm');

  const todayEntry = findDayEntry(schedule, currentDay);
  if (todayEntry?.enabled && currentTime < toHm(todayEntry.open)) {
    return formatTimeLabel(toHm(todayEntry.open));
  }

  for (let offset = 1; offset <= 7; offset++) {
    const nextDay = (currentDay + offset) % 7;
    const entry = findDayEntry(schedule, nextDay);
    if (entry?.enabled) {
      const dayName = getDayName(nextDay);
      return `${dayName} ${formatTimeLabel(toHm(entry.open))}`;
    }
  }

  return null;
}

/**
 * Convert "HH:mm" to "h:mm AM/PM"
 */
function formatTimeLabel(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${mStr} ${period}`;
}

/**
 * Generate a default 7-day schedule with all days enabled, 09:00–22:00.
 */
export function getDefaultSchedule(): ServiceScheduleEntry[] {
  return Array.from({ length: 7 }, (_, i) => ({
    day: i,
    enabled: true,
    open: '09:00',
    close: '22:00',
  }));
}
