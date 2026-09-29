import { ALL_DAYS, getLocalDateKey, normalizeTime } from "@/utils/planner";

export type VoicePlanKind = "task" | "habit";
export type VoicePlanDraft = {
  id: string;
  title: string;
  date: string;
  time: string;
  kind: VoicePlanKind;
  days: number[];
  recurrence: string;
  intervalMinutes?: number;
  endTime?: string;
};

const DAY_LOOKUP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};
const WEEKDAY_NAMES = Object.keys(DAY_LOOKUP);

const toDateKey = (date: Date) => getLocalDateKey(date);
const shiftDate = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const parseExplicitDate = (text: string, base: Date) => {
  const lower = text.toLowerCase();
  if (/\btoday\b/.test(lower)) return toDateKey(base);
  if (/\btomorrow\b/.test(lower)) return toDateKey(shiftDate(base, 1));
  const namedDay = WEEKDAY_NAMES.findIndex(day => new RegExp(`\\b${day}s?\\b`).test(lower));
  if (namedDay >= 0) {
    const delta = (namedDay - base.getDay() + 7) % 7 || 7;
    return toDateKey(shiftDate(base, delta));
  }
  const monthMatch = lower.match(/\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b/);
  if (monthMatch) {
    const month = new Date(`${monthMatch[1]} 1, 2000`).getMonth();
    const day = Number(monthMatch[2]);
    let year = Number(monthMatch[3] || base.getFullYear());
    let result = new Date(year, month, day, 12);
    if (!monthMatch[3] && result < new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12)) result = new Date(++year, month, day, 12);
    return toDateKey(result);
  }
  const numeric = lower.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (numeric) return `${numeric[1]}-${numeric[2].padStart(2, "0")}-${numeric[3].padStart(2, "0")}`;
  const shortDate = lower.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/);
  if (shortDate) {
    let year = Number(shortDate[3] || base.getFullYear());
    let result = new Date(year, Number(shortDate[1]) - 1, Number(shortDate[2]), 12);
    if (!shortDate[3] && result < new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12)) result = new Date(++year, Number(shortDate[1]) - 1, Number(shortDate[2]), 12);
    return toDateKey(result);
  }
  return toDateKey(base);
};
const containsDateCue = (text: string) => /\btoday\b|\btomorrow\b|\bon\s+(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b|\b(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b|\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}|\b\d{4}-\d{2}-\d{2}\b/i.test(text);

const extractTime = (text: string) => {
  if (/\bnoon\b/i.test(text)) return "12:00";
  if (/\bmidnight\b/i.test(text)) return "00:00";
  const match = text.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\b/i);
  if (match) {
    const hour = Number(match[1]);
    const minute = Number(match[2] || "0");
    const suffix = match[3].toLowerCase().replaceAll(".", "");
    if (hour >= 1 && hour <= 12 && minute <= 59) {
      const converted = (hour % 12) + (suffix === "pm" ? 12 : 0);
      return `${String(converted).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }
  }
  const twentyFourHour = text.match(/\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/i);
  if (twentyFourHour) return `${String(Number(twentyFourHour[1])).padStart(2, "0")}:${twentyFourHour[2]}`;
  return "";
};

const recurrenceFor = (text: string, date: string) => {
  const lower = text.toLowerCase();
  const interval = lower.match(/every\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(hours?|hrs?)/);
  if (interval) {
    const amount = Number(interval[1]) || ({ one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 } as Record<string, number>)[interval[1]];
    return { days: ALL_DAYS, recurrence: `Every ${amount} ${amount === 1 ? "hour" : "hours"} · daily`, intervalMinutes: amount * 60 };
  }
  if (/\bevery day\b|\bdaily\b/.test(lower)) return { days: ALL_DAYS, recurrence: "Daily" };
  if (/\bweekdays\b/.test(lower)) return { days: [1, 2, 3, 4, 5], recurrence: "Weekdays" };
  if (/\bweekends\b/.test(lower)) return { days: [0, 6], recurrence: "Weekends" };
  const dayList = WEEKDAY_NAMES.filter(day => new RegExp(`(?:every\\s+)?${day}s?`).test(lower));
  if (dayList.length > 1) return { days: dayList.map(day => DAY_LOOKUP[day]), recurrence: dayList.map(day => day[0].toUpperCase() + day.slice(1)).join(" + ") };
  const day = WEEKDAY_NAMES.find(name => new RegExp(`\\bevery\\s+${name}\\b`).test(lower));
  if (day) return { days: [DAY_LOOKUP[day]], recurrence: `Every ${day[0].toUpperCase()}${day.slice(1)}` };
  if (/\bevery week\b|\bweekly\b/.test(lower)) {
    const weekday = new Date(`${date}T12:00:00`).getDay();
    return { days: [weekday], recurrence: `Weekly · ${WEEKDAY_NAMES[weekday]}` };
  }
  return { days: [], recurrence: "One time" };
};
export const parseVoiceRecurrence = recurrenceFor;

const cleanTitle = (text: string) => text
  .replace(/\b(today|tomorrow|on\s+\w+\s+\d{1,2}(?:st|nd|rd|th)?|on\s+(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}(?:\/\d{4})?)\b/gi, " ")
  .replace(/\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/gi, " ")
  .replace(/\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/gi, " ")
  .replace(/\b(?:at\s+)?(noon|midnight)\b/gi, " ")
  .replace(/\bevery\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:hours?|hrs?)\b/gi, " ")
  .replace(/\b(?:daily|every day|weekdays|weekends|weekly|every week|every (?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)s?)\b/gi, " ")
  .replace(/^\s*(?:and\s+)?(?:tomorrow|today|on\s+\w+\s+\d{1,2}(?:st|nd|rd|th)?)?\s*/i, "")
  .replace(/^\s*(?:i\s+)?(?:need\s+to|have\s+to|want\s+to|should|please|remind\s+me\s+to|schedule\s+|add\s+|plan\s+to)\s*/i, "")
  .replace(/\s+/g, " ")
  .replace(/^[,\s]+|[,\s]+$/g, "")
  .replace(/\.$/, "")
  .trim();

export const parseVoicePlan = (transcript: string, referenceDate = new Date()): VoicePlanDraft[] => {
  const cleaned = transcript.trim();
  if (!cleaned) return [];
  const clauses = cleaned
    .replace(/\s+and\s+(?=(?:drink|call|work|journal|write|read|go|take|do|practice|meditate|pick|finish|clean|plan|exercise|stretch|run|walk|study|pay|send|schedule|add|remind|check|water|mom|dad|email|text|eat|cook|buy|bring|drop|visit|feed|shower|brush)\b)/gi, ",")
    .split(/[,;\n]+/)
    .map(clause => clause.trim())
    .filter(Boolean);
  const inheritedDate = parseExplicitDate(cleaned, referenceDate);
  return clauses.map((clause, index) => {
    const date = containsDateCue(clause) ? parseExplicitDate(clause, referenceDate) : inheritedDate;
    const recurrence = recurrenceFor(clause, date);
    const kind: VoicePlanKind = recurrence.days.length ? "habit" : "task";
    return {
      id: `voice_${Date.now()}_${index}`,
      title: cleanTitle(clause) || clause,
      date,
      time: normalizeTime(extractTime(clause)) || (recurrence.intervalMinutes ? "09:00" : ""),
      kind,
      days: recurrence.days,
      recurrence: recurrence.recurrence,
      intervalMinutes: recurrence.intervalMinutes,
      endTime: recurrence.intervalMinutes ? "21:00" : undefined,
    };
  }).filter(draft => !!draft.title);
};
