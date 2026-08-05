export type AppErrorCode =
  | "INVALID_REQUEST"
  | "CALENDAR_ERROR"
  | "KNOWLEDGE_ERROR"
  | "ETHICS_ERROR"
  | "CORE_ERROR";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly field?: string;
  readonly recoverable: boolean;

  constructor(
    code: AppErrorCode,
    message: string,
    options: { readonly field?: string; readonly recoverable?: boolean } = {},
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.field = options.field;
    this.recoverable = options.recoverable ?? true;
  }
}
