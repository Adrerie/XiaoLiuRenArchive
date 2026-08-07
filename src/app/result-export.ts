import type { DivinationResult } from "../shared";

export interface ExportOptions {
  readonly includePreciseTime?: boolean;
}

export function createExportPayload(
  result: DivinationResult,
  options: ExportOptions = {},
): DivinationResult {
  const includePreciseTime = options.includePreciseTime === true;
  const calendar = result.calendar === null
    ? null
    : {
        ...result.calendar,
        localDateTime: includePreciseTime ? result.calendar.localDateTime ?? null : null,
        trace: result.calendar.trace.map((entry) => entry.stage === "calendar-boundary" && !includePreciseTime
          ? { ...entry, inputLocalDateTime: null, lunarConversionLocalDateTime: null }
          : entry),
      };
  return {
    ...result,
    input: result.input.kind === "calendar"
      ? {
          ...result.input,
          localDateTime: includePreciseTime ? result.input.localDateTime : null,
          privacy: {
            ...result.input.privacy,
            questionTextStored: false,
            questionTextIncludedInExport: false,
          },
        }
      : {
          ...result.input,
          privacy: {
            ...result.input.privacy,
            questionTextStored: false,
            questionTextIncludedInExport: false,
          },
        },
    calendar,
  };
}

export function serializeExportPayload(
  result: DivinationResult,
  options: ExportOptions = {},
): string {
  return JSON.stringify(createExportPayload(result, options), null, 2);
}
