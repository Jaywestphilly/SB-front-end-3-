import { db, saveUserDataLocally, getUserDataLocally } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export type AnalyticsEventName =
  | "module_opened"
  | "affiliate_clicked"
  | "premium_modal_opened"
  | "playbook_viewed"
  | "social_clicked"
  | "video_watched"
  | "community_joined"
  | "disclaimer_viewed"
  | "prompt_copied";

export interface AnalyticsEventData {
  section?: string;
  provider?: string;
  href?: string;
  platform?: string;
  videoId?: string;
  playbookId?: string;
  email?: string;
  [key: string]: string | number | boolean | null | undefined | unknown;
}

/**
 * Tracks analytics events locally and sends to Firestore collection when available
 */
export async function trackEvent(
  eventName: AnalyticsEventName,
  data: AnalyticsEventData = {}
) {
  const payload = {
    eventName,
    ...data,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
  };

  // Console output for dev auditing
  console.log(`[ANALYTICS] ${eventName.toUpperCase()}:`, payload);

  // Store in local history
  try {
    const history = getUserDataLocally("analytics_history", []);
    history.push(payload);
    // Keep last 50 events in local storage
    saveUserDataLocally("analytics_history", history.slice(-50));
  } catch (err) {
    // ignore local storage errors
  }

  // Attempt async firestore push
  try {
    if (db) {
      await addDoc(collection(db, "analytics_events"), payload);
    }
  } catch (err) {
    // Silent catch for offline or demo config
  }
}
