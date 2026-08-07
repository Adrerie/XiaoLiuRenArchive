export const APP_DISPLAY_NAME = "小六壬档案" as const;
export const APP_VERSION = "0.5.0-beta.1" as const;
export const ANDROID_VERSION_CODE = 501 as const;
export const BUILD_CHANNEL = "beta-debug" as const;
export const ALGORITHM_VERSION = "1.0.0" as const;

export const APP_VERSION_INFO = {
  displayName: APP_DISPLAY_NAME,
  version: APP_VERSION,
  androidVersionCode: ANDROID_VERSION_CODE,
  buildChannel: BUILD_CHANNEL,
  algorithmVersion: ALGORITHM_VERSION,
} as const;
