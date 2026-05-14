import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { getSetupState } from "@/lib/setup";
import { listDraftsInRange, type DraftSummary } from "@/lib/drafts";
import { buildCalendarMonth, isoDate, parseMonthParam } from "@/lib/calendar";

export const dynamic = "force-dynamic";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  if (!process.env.POSTGRES_URL) return null;
  const setup = await getSetupState();
  if (!setup.isComplete) redirect("/setup");

  const { m } = await searchParams;
  const { year, month } = parseMonthParam(m);
  const cal = buildCalendarMonth(year, month);

  const drafts = await listDraftsInRange(
    cal.rangeStart.toISOString(),
    cal.rangeEnd.toISOString(),
  );

  // Group drafts by local-date string so they show on the right cell.
  const byDay = new Map<string, DraftSummary[]>();
  for (const d of drafts) {
    if (!d.scheduledFor) continue;
    const key = isoDate(new Date(d.scheduledFor));
    const arr = byDay.get(key) ?? [];
    arr.push(d);
    byDay.set(key, arr);
  }

  return (
    <div className="content--wide">
      <PageHeader
        eyebrow="Calendar"
        title={cal.label}
        right={<Badge>{drafts.length} scheduled</Badge>}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Link href={`/calendar?m=${cal.prevMonthParam}`} className="btn btn--ghost btn--sm">
          ← Previous
        </Link>
        <Link href="/calendar" className="btn btn--ghost btn--sm">
          This month
        </Link>
        <Link href={`/calendar?m=${cal.nextMonthParam}`} className="btn btn--ghost btn--sm">
          Next →
        </Link>
      </div>

      <div className="calendar" role="grid" aria-label={`${cal.label} calendar`}>
        <div className="calendar__dow" role="row">
          {DOW.map((d) => (
            <div key={d} className="calendar__dow-cell" role="columnheader">
              {d}
            </div>
          ))}
        </div>
        <div className="calendar__grid">
          {cal.days.map((day) => {
            const items = byDay.get(day.iso) ?? [];
            const cellClass = [
              "calendar__cell",
              day.inMonth ? "" : "calendar__cell--out",
              day.isToday ? "calendar__cell--today" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div key={day.iso} className={cellClass} role="gridcell">
                <div className="calendar__date">{day.date.getDate()}</div>
                <div className="calendar__items">
                  {items.map((d) => (
                    <Link
                      key={d.id}
                      href={`/drafts/${d.id}`}
                      className="calendar__pill"
                      title={d.title}
                    >
                      {d.title}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="eyebrow" style={{ marginTop: 18 }}>
        Tip: open any draft to set or change its scheduled date.
      </p>
    </div>
  );
}
