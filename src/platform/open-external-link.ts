import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

function validateExternalUrl(url: string): void {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("来源链接必须使用 HTTP 或 HTTPS。");
  }
}

export async function openExternalLink(url: string): Promise<void> {
  validateExternalUrl(url);
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  }
}
