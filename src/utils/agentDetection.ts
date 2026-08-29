/**
 * Helper to detect if the page is loaded by an automated agent, crawler,
 * headless browser (Puppeteer, Playwright, Selenium, etc.), or preview environment.
 */
export function isAgentOrHeadless(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return true;

  // 1. Standard navigator.webdriver flag
  if (navigator.webdriver) return true;

  // 2. Automation window flags set by Headless Chrome / Puppeteer / Playwright / Cypress / Selenium
  const w = window as unknown as Record<string, unknown>;
  if (
    w.domAutomation ||
    w.domAutomationController ||
    w._phantom ||
    w.callPhantom ||
    w.__nightmare ||
    w._selenium ||
    w.__playwright ||
    w.__puppeteer ||
    w.Cypress
  ) {
    return true;
  }

  // 3. User agent string inspection
  const ua = (navigator.userAgent || "").toLowerCase();
  const agentKeywords = [
    "headlesschrome",
    "headless",
    "puppeteer",
    "playwright",
    "selenium",
    "phantomjs",
    "lighthouse",
    "bot",
    "crawler",
    "spider",
    "googlebot",
    "bingbot",
    "gptbot",
    "claudebot",
    "antigravity",
    "agent",
    "python",
    "axios",
    "node-fetch",
    "curl",
    "wget"
  ];
  if (agentKeywords.some((kw) => ua.includes(kw))) {
    return true;
  }

  // 4. URL Query string override flags (e.g., ?agent=true, ?skip_modal=true, ?headless=true)
  try {
    const params = new URLSearchParams(window.location.search);
    if (
      params.has("agent") ||
      params.has("headless") ||
      params.has("skip_modal") ||
      params.has("no_modal") ||
      params.has("preview") ||
      params.has("bot")
    ) {
      return true;
    }
  } catch {
    // Ignore URL parsing errors
  }

  return false;
}
