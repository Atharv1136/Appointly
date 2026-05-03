// Helpers to add an event to external calendars

function formatICSDate(d: Date): string {
  // YYYYMMDDTHHMMSSZ
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startISO: string;
  durationMins: number;
}

function endDate(e: CalendarEvent): Date {
  return new Date(new Date(e.startISO).getTime() + e.durationMins * 60_000);
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const start = formatICSDate(new Date(e.startISO));
  const end = formatICSDate(endDate(e));
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${start}/${end}`,
    details: e.description ?? "",
    location: e.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(e: CalendarEvent): string {
  const start = new Date(e.startISO).toISOString();
  const end = endDate(e).toISOString();
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: e.title,
    body: e.description ?? "",
    location: e.location ?? "",
    startdt: start,
    enddt: end,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function downloadICS(e: CalendarEvent, filename = "appointment.ics"): void {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CalenSync//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@calensync`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(new Date(e.startISO))}`,
    `DTEND:${formatICSDate(endDate(e))}`,
    `SUMMARY:${e.title}`,
    `DESCRIPTION:${(e.description ?? "").replace(/\n/g, "\\n")}`,
    `LOCATION:${e.location ?? ""}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
