export type CalendarDay = {
  date: Date;
  iso: string; // YYYY-MM-DD
  inMonth: boolean;
  isToday: boolean;
};

export type CalendarMonth = {
  year: number;
  month: number; // 0-indexed (0 = January)
  label: string;
  rangeStart: Date;
  rangeEnd: Date;
  days: CalendarDay[];
  prevMonthParam: string;
  nextMonthParam: string;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseMonthParam(value: string | undefined, now: Date = new Date()): { year: number; month: number } {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [yStr, mStr] = value.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    if (m >= 1 && m <= 12) return { year: y, month: m - 1 };
  }
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function buildCalendarMonth(year: number, month: number, today: Date = new Date()): CalendarMonth {
  const first = new Date(year, month, 1);
  const firstWeekday = first.getDay(); // 0 = Sunday
  const startOffset = firstWeekday; // weeks start on Sunday in this UI
  const gridStart = new Date(year, month, 1 - startOffset);
  const totalCells = 42; // 6 weeks
  const days: CalendarDay[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push({
      date: d,
      iso: isoDate(d),
      inMonth: d.getMonth() === month,
      isToday: isoDate(d) === isoDate(today),
    });
  }
  const rangeStart = new Date(year, month, 1);
  const rangeEnd = new Date(year, month + 1, 1);
  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const label = first.toLocaleString(undefined, { month: "long", year: "numeric" });
  return {
    year,
    month,
    label,
    rangeStart,
    rangeEnd,
    days,
    prevMonthParam: `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}`,
    nextMonthParam: `${next.getFullYear()}-${pad(next.getMonth() + 1)}`,
  };
}
