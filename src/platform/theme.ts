import { Capacitor, registerPlugin } from "@capacitor/core";

export type ThemePreference = "system" | "light" | "dark";

interface ThemeBarPlugin {
  setTheme(options: { readonly theme: ThemePreference }): Promise<void>;
}

const ThemeBar = registerPlugin<ThemeBarPlugin>("ThemeBar");

export async function syncNativeTheme(theme: ThemePreference): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await ThemeBar.setTheme({ theme });
  } catch {
    // The web theme remains usable if an older installed shell lacks the bridge.
  }
}
