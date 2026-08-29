import { EarningsReport } from "../types";

export function parseReportDate(
  reportDateStr: string,
  timingStr?: string,
): { startISO: string; endISO: string; displayDate: Date } {
  // e.g. "Aug 26, 2026" or "Jul 30, 2026"
  const dateObj = new Date(reportDateStr);
  const year = isNaN(dateObj.getFullYear())
    ? new Date().getFullYear()
    : dateObj.getFullYear();
  const month = isNaN(dateObj.getMonth()) ? 0 : dateObj.getMonth();
  const day = isNaN(dateObj.getDate()) ? 1 : dateObj.getDate();

  let hour = 16; // Default to After Market Close (4:00 PM EST)
  if (
    timingStr?.toLowerCase().includes("before market open") ||
    timingStr?.toLowerCase().includes("pre market")
  ) {
    hour = 8; // 8:30 AM EST
  } else if (timingStr?.toLowerCase().includes("during market")) {
    hour = 12; // 12:00 PM EST
  }

  const startDate = new Date(Date.UTC(year, month, day, hour, 0, 0));
  const endDate = new Date(Date.UTC(year, month, day, hour + 1, 0, 0));

  const formatIcsDate = (d: Date) => {
    return d.toISOString().replace(/-|:|\.\d+/g, "");
  };

  return {
    startISO: formatIcsDate(startDate),
    endISO: formatIcsDate(endDate),
    displayDate: startDate,
  };
}

export function generateIcsForReports(
  reports: EarningsReport[],
  calendarTitle = "Stock Bloc Earnings Calendar",
): string {
  const events = reports
    .map((report) => {
      const { startISO, endISO } = parseReportDate(
        report.reportDate,
        report.timing,
      );
      const summary = `${report.symbol} ${report.companyName} Earnings (${report.fiscalQuarter})`;
      const description = [
        `Company: ${report.companyName} (${report.symbol})`,
        `Quarter: ${report.fiscalQuarter}`,
        `Timing: ${report.timing}`,
        `Report Date: ${report.reportDate}`,
        `EPS Est: ${report.epsEstimate} | Revenue Est: ${report.revenueEstimate}`,
        report.epsActual ? `EPS Actual: ${report.epsActual}` : "",
        report.revenueActual ? `Revenue Actual: ${report.revenueActual}` : "",
        report.guidanceHighlight ? `Guidance: ${report.guidanceHighlight}` : "",
        report.summaryText ? `Summary: ${report.summaryText}` : "",
        `Synced via Stock Bloc Financial Platform`,
      ]
        .filter(Boolean)
        .join("\\n");

      return `BEGIN:VEVENT
UID:earnings-${report.id}-${report.symbol}@stockbloc.app
DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d+/g, "")}
DTSTART:${startISO}
DTEND:${endISO}
SUMMARY:${summary.replace(/,/g, "\\,")}
DESCRIPTION:${description.replace(/,/g, "\\,")}
LOCATION:Wall Street / Investor Relations
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Reminder: ${report.symbol} Earnings Report in 30 minutes
END:VALARM
END:VEVENT`;
    })
    .join("\n");

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Stock Bloc//Earnings Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${calendarTitle}
${events}
END:VCALENDAR`;
}

export function downloadIcsFile(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    filename.endsWith(".ics") ? filename : `${filename}.ics`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(report: EarningsReport): string {
  const { startISO, endISO } = parseReportDate(
    report.reportDate,
    report.timing,
  );
  const title = `[Earnings] ${report.symbol} ${report.companyName} (${report.fiscalQuarter})`;
  const details = [
    `Company: ${report.companyName} (${report.symbol})`,
    `Quarter: ${report.fiscalQuarter}`,
    `Date & Time: ${report.reportDate} (${report.timing})`,
    `EPS Est: ${report.epsEstimate} | Revenue Est: ${report.revenueEstimate}`,
    report.guidanceHighlight ? `Guidance: ${report.guidanceHighlight}` : "",
    report.summaryText ? `Summary: ${report.summaryText}` : "",
    `Synced via Stock Bloc Financial Platform`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startISO}/${endISO}`,
    details: details,
    location: "Investor Relations / Stock Market",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function getOutlookCalendarUrl(report: EarningsReport): string {
  const { startISO, endISO } = parseReportDate(
    report.reportDate,
    report.timing,
  );
  const title = `[Earnings] ${report.symbol} ${report.companyName} (${report.fiscalQuarter})`;
  const details = `Company: ${report.companyName} (${report.symbol})\nQuarter: ${report.fiscalQuarter}\nDate: ${report.reportDate} (${report.timing})\nEPS Est: ${report.epsEstimate} | Revenue Est: ${report.revenueEstimate}\n\nSynced via Stock Bloc`;

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title,
    body: details,
    startdt: startISO,
    enddt: endISO,
    location: "Investor Relations",
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
