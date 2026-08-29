export type HapticPattern =
  | "light"
  | "medium"
  | "heavy"
  | "selection"
  | "success"
  | "warning"
  | "error"
  | "refresh";

export const triggerHaptic = (type: HapticPattern = "light") => {
  if (
    typeof window !== "undefined" &&
    "navigator" in window &&
    "vibrate" in navigator
  ) {
    try {
      switch (type) {
        case "light":
        case "selection":
          navigator.vibrate(10);
          break;
        case "medium":
          navigator.vibrate(20);
          break;
        case "heavy":
          navigator.vibrate(40);
          break;
        case "success":
          navigator.vibrate([15, 40, 25]);
          break;
        case "warning":
          navigator.vibrate([30, 50, 30]);
          break;
        case "error":
          navigator.vibrate([50, 30, 50, 30, 50]);
          break;
        case "refresh":
          navigator.vibrate([12, 25, 12]);
          break;
        default:
          navigator.vibrate(15);
      }
    } catch {
      // Ignore vibration errors on unsupported devices
    }
  }
};
