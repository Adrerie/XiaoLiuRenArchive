import { Capacitor } from "@capacitor/core";
import { Clipboard } from "@capacitor/clipboard";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export const EXPORT_FILE_NAME = "xiaoliuren-result.json" as const;

export interface ExportActionResult {
  readonly ok: boolean;
  readonly message: string;
}

function failure(message: string): ExportActionResult {
  return { ok: false, message };
}

function success(message: string): ExportActionResult {
  return { ok: true, message };
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message.length > 0 ? `（${error.message}）` : "";
}

export async function copyExportJson(serialized: string): Promise<ExportActionResult> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Clipboard.write({ string: serialized });
      return success("JSON 已复制到系统剪贴板。");
    }
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return failure("当前浏览器不支持剪贴板复制，请改用下载。");
    }
    await navigator.clipboard.writeText(serialized);
    return success("JSON 已复制到剪贴板。");
  } catch (error) {
    return failure(`复制失败，未确认内容已写入剪贴板${errorMessage(error)}。`);
  }
}

function downloadJson(serialized: string): ExportActionResult {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    return failure("当前环境不支持文件下载。");
  }
  try {
    const blob = new Blob([serialized], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = EXPORT_FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
    return success("JSON 已下载到本地。");
  } catch (error) {
    return failure(`下载失败，未确认文件已生成${errorMessage(error)}。`);
  }
}

export async function saveOrShareExportJson(serialized: string): Promise<ExportActionResult> {
  if (!Capacitor.isNativePlatform()) return downloadJson(serialized);

  let uri: string;
  try {
    const file = await Filesystem.writeFile({
      path: EXPORT_FILE_NAME,
      data: serialized,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    uri = file.uri;
  } catch (error) {
    return failure(`JSON 保存失败，未确认文件已写入应用缓存${errorMessage(error)}。`);
  }

  try {
    await Share.share({
      title: "小六壬档案 JSON",
      files: [uri],
      dialogTitle: "分享小六壬结果",
    });
    return success("JSON 已写入应用缓存，已请求系统分享面板。");
  } catch (error) {
    return failure(`JSON 已写入应用缓存，但系统分享未能打开${errorMessage(error)}。`);
  }
}
