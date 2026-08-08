import type { AppView } from "../components/navigation/navigation-data";

export const ARCHIVE_COMPACT_MEDIA_QUERY = "(max-width: 760px)";

export function shouldOpenArchiveMobileDetail(compactViewport: boolean): boolean {
  return compactViewport;
}

export function shouldHandleArchiveBack(view: AppView, compactViewport: boolean, mobileDetailOpen: boolean): boolean {
  return view === "archive" && compactViewport && mobileDetailOpen;
}
