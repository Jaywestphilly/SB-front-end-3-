/**
 * Utility functions for formatting timestamps to UTC and checking data staleness (>24h).
 */

/**
 * Format any date input to "YYYY-MM-DD HH:MM UTC"
 * Example: 2026-08-07 11:34 UTC
 */
export function formatUtcTimestamp(dateInput?: string | number | Date | null): string {
  if (!dateInput) {
    return new Date().toISOString().replace("T", " ").substring(0, 16) + " UTC";
  }

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    // If it's already a formatted string like "2026-08-07 11:34 UTC", return it if clean or fallback
    return String(dateInput);
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}

/**
 * Check if data timestamp is older than 24 hours (86,400,000 ms) or missing
 */
export function isDataStale(dateInput?: string | number | Date | null): boolean {
  if (!dateInput) return true;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return false; // If non-parsable string, treat as fresh unless proven otherwise

  const ageMs = Date.now() - date.getTime();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  return ageMs > TWENTY_FOUR_HOURS_MS;
}

/**
 * Get human-readable age text for DataStatusPanel e.g. "12 mins ago", "3 hours ago", "2 days ago"
 */
export function getDataAgeText(dateInput?: string | number | Date | null): string {
  if (!dateInput) return "Unknown";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  const ageMs = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(ageMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 2) return "Just now";
  if (minutes < 60) return `${minutes} mins ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}
