import type { DivinationResult } from "../shared";

export interface ExportOptions {
  readonly includePreciseTime?: boolean;
}

export function createExportPayload(
  result: DivinationResult,
  options: ExportOptions = {},
): DivinationResult {
  const includePreciseTime = options.includePreciseTime === true;
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
    },
  };
}

export function serializeExportPayload(
  result: DivinationResult,
  options: ExportOptions = {},
): string {
  return JSON.stringify(createExportPayload(result, options), null, 2);
}
