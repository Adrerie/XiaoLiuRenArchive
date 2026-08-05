import type { DivinationResult } from "../shared";

export interface ExportOptions {
  readonly includePreciseTime?: boolean;
}

export function createExportPayload(
  result: DivinationResult,
  options: ExportOptions = {},
): DivinationResult {
  const includePreciseTime = options.includePreciseTime === true;
  const calendarTrace = result.calendar.trace.map((entry) => entry.stage === "calendar-boundary" && !includePreciseTime
    ? { ...entry, inputLocalDateTime: null, lunarConversionLocalDateTime: null }
    : entry);
  return {
    ...result,
    input: {
      ...result.input,
      localDateTime: includePreciseTime ? result.input.localDateTime ?? null : null,
      privacy: {
        ...result.input.privacy,
        questionTextStored: false,
        questionTextIncludedInExport: false,
      },
    },
    calendar: {
      ...result.calendar,
      localDateTime: includePreciseTime ? result.calendar.localDateTime ?? null : null,
      trace: calendarTrace,
    },
  };
}

export function serializeExportPayload(
  result: DivinationResult,
  options: ExportOptions = {},
): string {
  return JSON.stringify(createExportPayload(result, options), null, 2);
}
