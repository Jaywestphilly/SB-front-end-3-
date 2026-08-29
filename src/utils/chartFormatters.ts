/**
 * Formats timestamps (ISO strings, date strings, or ticks) into clean, human-readable labels for charts.
 */
export function formatChartTimestamp(timeStr: string | undefined | null): string {
  if (!timeStr) return "";
  
  const str = String(timeStr).trim();
  
  // If it's an ISO timestamp or date-time string
  if (str.includes("T") || str.includes("Z") || (str.includes("-") && str.includes(":"))) {
    try {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${hours}:${minutes}`;
      }
    } catch (e) {
      // Fallback to original string
    }
  }
  
  // If it's a date string like "2026-08-04"
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    try {
      const date = new Date(str + "T00:00:00");
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
    } catch (e) {
      // Fallback
    }
  }

  return str;
}

/**
 * Formats timestamps for detailed tooltips and badges (e.g. "Aug 4, 11:13 PM" or "11:13 PM")
 */
export function formatTimestampDetail(timeStr: string | undefined | null): string {
  if (!timeStr) return "";
  const str = String(timeStr).trim();
  return str;
}

export interface YAxisTick {
  val: number;
  y: number;
  label: string;
}

export interface CleanYAxisOptions {
  minVal: number;
  maxVal: number;
  plotBottom: number;
  plotHeight: number;
  targetCount?: number;
  isPercent?: boolean;
}

/**
 * Calculates clean, nicely rounded Y-axis ticks with strict step-rounding
 * to prevent duplicate labels and ensure uniform price visual distribution across varying market volatility.
 */
export function calculateCleanYAxisTicks({
  minVal,
  maxVal,
  plotBottom,
  plotHeight,
  targetCount = 5,
  isPercent = false,
}: CleanYAxisOptions): YAxisTick[] {
  if (
    typeof minVal !== "number" ||
    typeof maxVal !== "number" ||
    isNaN(minVal) ||
    isNaN(maxVal)
  ) {
    return [];
  }

  let rawMin = minVal;
  let rawMax = maxVal;

  if (rawMin >= rawMax) {
    const pad = Math.abs(rawMin) * 0.05 || 1;
    rawMin = rawMin - pad;
    rawMax = rawMax + pad;
  }

  const rawRange = rawMax - rawMin;
  const count = Math.max(2, targetCount);
  const rawStep = rawRange / (count - 1);

  // Compute nice step interval (e.g. 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 50, etc.)
  const exponent = Math.floor(Math.log10(rawStep || 1));
  const magnitude = Math.pow(10, exponent);
  const fraction = rawStep / (magnitude || 1);

  let niceFraction = 1;
  if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 2.5) niceFraction = 2.5;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;

  const step = niceFraction * magnitude;

  // Determine required decimal precision based on step size
  let decimals = 0;
  if (step < 0.01) decimals = 3;
  else if (step < 0.1) decimals = 2;
  else if (step < 1) decimals = 2;
  else if (step < 10 && rawMax < 10) decimals = 2;
  else if (step < 10 && rawMax < 100) decimals = 1;
  else decimals = 0;

  if (isPercent) {
    decimals = Math.max(1, decimals);
  }

  const ticks: YAxisTick[] = [];
  const seenLabels = new Set<string>();

  for (let i = 0; i < count; i++) {
    const ratio = i / (count - 1);
    const unroundedVal = rawMin + ratio * rawRange;
    // Step round to the nearest clean interval
    const stepRounded = Math.round(unroundedVal / step) * step;
    const cleanVal = Number(stepRounded.toFixed(decimals + 2));

    const y = plotBottom - ratio * plotHeight;

    let label = "";
    if (isPercent) {
      label = `${cleanVal >= 0 ? "+" : ""}${cleanVal.toFixed(decimals)}%`;
    } else if (cleanVal < 10) {
      label = `$${cleanVal.toFixed(Math.max(2, decimals))}`;
    } else if (cleanVal < 100) {
      label = `$${cleanVal.toFixed(Math.max(1, decimals))}`;
    } else {
      if (decimals > 0) {
        label = `$${cleanVal.toFixed(decimals)}`;
      } else {
        label = `$${Math.round(cleanVal).toLocaleString()}`;
      }
    }

    if (!seenLabels.has(label)) {
      seenLabels.add(label);
      ticks.push({ val: cleanVal, y, label });
    }
  }

  // Fallback: if step rounding deduplicated too aggressively, compute raw clean ticks
  if (ticks.length < 2) {
    ticks.length = 0;
    seenLabels.clear();
    for (let i = 0; i < count; i++) {
      const ratio = i / (count - 1);
      const val = rawMin + ratio * rawRange;
      const y = plotBottom - ratio * plotHeight;
      let label = isPercent
        ? `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`
        : `$${val.toFixed(val < 10 ? 2 : val < 100 ? 1 : 2)}`;

      if (seenLabels.has(label)) {
        label = `$${val.toFixed(3)}`;
      }
      seenLabels.add(label);
      ticks.push({ val, y, label });
    }
  }

  return ticks;
}

/**
 * Clean formatter for Recharts Y-axis ticks or standalone price labels
 */
export function formatYAxisTick(val: number, isPercent: boolean = false): string {
  if (typeof val !== "number" || isNaN(val)) return "$0.00";
  if (isPercent) {
    return `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`;
  }
  if (val < 10) return `$${val.toFixed(2)}`;
  if (val < 100) return `$${val.toFixed(1)}`;
  return `$${Math.round(val).toLocaleString()}`;
}

