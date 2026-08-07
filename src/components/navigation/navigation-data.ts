export type AppView = "divination" | "archive" | "library" | "methods" | "about";

export const NAV_ITEMS: readonly { readonly id: AppView; readonly label: string; readonly shortLabel: string }[] = [
  { id: "divination", label: "起课", shortLabel: "起课" },
  { id: "archive", label: "案例库", shortLabel: "案例" },
  { id: "library", label: "六宫资料", shortLabel: "资料" },
  { id: "methods", label: "方法说明", shortLabel: "方法" },
  { id: "about", label: "关于", shortLabel: "关于" },
];
