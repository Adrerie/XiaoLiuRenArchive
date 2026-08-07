import type { FormState } from "../../app/entry-form";

export type FormUpdater = <K extends keyof FormState>(key: K, value: FormState[K]) => void;

export interface CastingModeOption {
  readonly id: FormState["castingMode"];
  readonly label: string;
  readonly description: string;
}
