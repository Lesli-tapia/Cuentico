import type { ReadingPlan } from '@/core/contracts';

export const defaultPlan: ReadingPlan = {
  minutes: 10, days: [1, 3, 5], moment: 'noche', time: '19:00', timezone: 'America/Guayaquil'
};

const formatters = new Map<string, Intl.DateTimeFormat>();
function dateParts(date: Date, timezone: string) {
  let formatter = formatters.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    });
    formatters.set(timezone, formatter);
  }
  const parts = formatter.formatToParts(date);
  const get = (name: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === name)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

/** Resolve a wall-clock minute in an IANA zone, including half-hour offsets and DST. */
function zonedMinute(year: number, month: number, day: number, hour: number, minute: number, timezone: string, after: Date): Date | null {
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = target;
  for (let iteration = 0; iteration < 4; iteration++) {
    const parts = dateParts(new Date(candidate), timezone);
    const represented = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const next = candidate + target - represented;
    if (next === candidate) break;
    candidate = next;
  }
  // A skipped spring-forward minute moves to the next real minute on that day.
  const exact: number[] = [];
  const later: { timestamp: number; wallMinute: number }[] = [];
  for (let offset = -180; offset <= 180; offset++) {
    const timestamp = candidate + offset * 60000;
    const parts = dateParts(new Date(timestamp), timezone);
    if (parts.year !== year || parts.month !== month || parts.day !== day) continue;
    const wallMinute = parts.hour * 60 + parts.minute;
    if (wallMinute === hour * 60 + minute) exact.push(timestamp);
    else if (wallMinute > hour * 60 + minute) later.push({ timestamp, wallMinute });
  }
  const remaining = exact.filter(timestamp => timestamp > after.getTime());
  if (remaining.length) return new Date(Math.min(...remaining));
  // If this minute exists but has passed, never silently substitute a later hour.
  if (exact.length) return null;
  // In a spring-forward gap, choose the first valid wall minute after the gap.
  later.sort((first, second) => first.wallMinute - second.wallMinute || first.timestamp - second.timestamp);
  const firstWallMinute = later[0]?.wallMinute;
  const fallback = later.find(item => item.wallMinute === firstWallMinute && item.timestamp > after.getTime());
  return fallback ? new Date(fallback.timestamp) : null;
}

/** Earliest selected reading day strictly after `from`, in the family's own timezone. */
export function nextReminderAt(plan: ReadingPlan, from: Date = new Date()): Date {
  if (plan.days.length === 0) throw new Error('Selecciona al menos un día de lectura.');
  const parts = dateParts(from, plan.timezone);
  const [hour, minute] = plan.time.split(':').map(Number);
  for (let offset = 0; offset <= 14; offset++) {
    const day = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + offset));
    if (!plan.days.includes(day.getUTCDay())) continue;
    const candidate = zonedMinute(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), hour, minute, plan.timezone, from);
    if (candidate) return candidate;
  }
  throw new Error('No fue posible calcular la próxima sesión.');
}

export interface ReminderDelivery {
  channel: 'in-app' | 'push';
  deliver(message: { id: string; text: string }): Promise<void>;
}

/** The MVP stores reminders; the interface deliberately makes no closed-app push promise. */
export const inAppDelivery: ReminderDelivery = { channel: 'in-app', async deliver() {} };
