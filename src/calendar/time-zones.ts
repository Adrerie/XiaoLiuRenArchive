const FALLBACK_TIME_ZONES = [
  "UTC",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Paris",
  "America/Los_Angeles",
  "America/New_York",
  "Australia/Sydney",
] as const;

export function listSupportedTimeZones(): readonly string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    return ["UTC", ...Intl.supportedValuesOf("timeZone")];
  }
  return FALLBACK_TIME_ZONES;
}
