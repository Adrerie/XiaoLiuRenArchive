export interface ResultLifecycleState<Result> {
  readonly result: Result | null;
  readonly archiveStatus: string | null;
}

export function beginResultGeneration<Result>(state: ResultLifecycleState<Result>): ResultLifecycleState<Result> {
  return { result: state.result, archiveStatus: null };
}

export function completeResultGeneration<Result>(result: Result): ResultLifecycleState<Result> {
  return { result, archiveStatus: null };
}

export function failResultGeneration<Result>(): ResultLifecycleState<Result> {
  return { result: null, archiveStatus: null };
}
