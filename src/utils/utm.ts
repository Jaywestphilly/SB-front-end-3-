/**
 * Appends standard UTM parameters for outbound links tracking
 */
export function appendUTM(url: string, section: string = "general"): string {
  if (!url) return "#";
  
  // If it's a mailto, tel, or internal anchor, return as is
  if (url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("#") || url.startsWith("/")) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set("utm_source", "stockbloc");
    urlObj.searchParams.set("utm_medium", "app");
    urlObj.searchParams.set("utm_campaign", section.toLowerCase().replace(/[^a-z0-9_-]/g, "_"));
    return urlObj.toString();
  } catch (e) {
    // If invalid URL string, append simple query params
    const separator = url.includes("?") ? "&" : "?";
    const cleanSection = section.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    return `${url}${separator}utm_source=stockbloc&utm_medium=app&utm_campaign=${cleanSection}`;
  }
}
