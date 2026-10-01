import { addDays, type YMD } from '@numerology/engine';

export type IcsEvent = { date: YMD; summary: string; description?: string };

const pad = (n: number, width = 2) => String(n).padStart(width, '0');
const ymd = (d: YMD) => `${pad(d.year, 4)}${pad(d.month)}${pad(d.day)}`;

/** RFC 5545 text escaping. */
export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Folds a content line at 75 octets, never inside a UTF-8 sequence. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = '';
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > limit) {
      out.push(current);
      current = '';
      bytes = 0;
      limit = 74; // continuation lines start with a space
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join('\r\n ');
}

function stamp(now: Date): string {
  return `${pad(now.getUTCFullYear(), 4)}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
}

/**
 * Builds an iCalendar file of all-day events. It carries numbers and short
 * themes only: no name and no birth date.
 */
export function buildIcs(events: IcsEvent[], calendarName: string, now: Date = new Date()): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ninefold//Numerology//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
  ];
  const dtstamp = stamp(now);
  events.forEach((e, i) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ymd(e.date)}-${i}@ninefold.invalid`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${ymd(e.date)}`,
      `DTEND;VALUE=DATE:${ymd(addDays(e.date, 1))}`,
      `SUMMARY:${escapeIcsText(e.summary)}`,
    );
    if (e.description) lines.push(`DESCRIPTION:${escapeIcsText(e.description)}`);
    lines.push('TRANSP:TRANSPARENT', 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

/** Hands a text file to the browser as a download. Nothing is uploaded. */
export function downloadText(filename: string, text: string, type = 'text/calendar;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
