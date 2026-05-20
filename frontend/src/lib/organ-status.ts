import type { OrganHeatKey } from "@/lib/organ-heat";
import { ORGAN_HOTSPOTS } from "@/config/organ-hotspots";

/** normal=绿(正常/隐患已排除) warning=橙(发现隐患) danger=红(严重隐患) */
export type OrganStatusLevel = "normal" | "warning" | "danger";

export type OrganStatusItem = {
  status: OrganStatusLevel;
  note?: string;
};

export type CustomerOrganStatusMap = Record<OrganHeatKey, OrganStatusItem>;

export const ORGAN_STATUS_OPTIONS: { value: OrganStatusLevel; label: string; color: string }[] = [
  { value: "normal", label: "正常 / 隐患已排除", color: "#22c55e" },
  { value: "warning", label: "发现隐患", color: "#f59e0b" },
  { value: "danger", label: "严重隐患", color: "#ef4444" },
];

export function defaultOrganStatusMap(): CustomerOrganStatusMap {
  const map = {} as CustomerOrganStatusMap;
  for (const def of ORGAN_HOTSPOTS) {
    map[def.key] = { status: "normal", note: "" };
  }
  return map;
}

export function normalizeOrganStatusMap(raw: unknown): CustomerOrganStatusMap {
  const base = defaultOrganStatusMap();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, { status?: string; note?: string } | string>;
  for (const def of ORGAN_HOTSPOTS) {
    const v = obj[def.key];
    if (!v) continue;
    const status =
      typeof v === "string"
        ? parseStatus(v)
        : parseStatus(v.status);
    base[def.key] = {
      status,
      note: typeof v === "object" && v.note != null ? String(v.note) : "",
    };
  }
  return base;
}

function parseStatus(s: unknown): OrganStatusLevel {
  if (s === "warning" || s === "danger" || s === "normal") return s;
  return "normal";
}

export function statusLabel(status: OrganStatusLevel): string {
  return ORGAN_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "正常";
}

export function statusColorHex(status: OrganStatusLevel): string {
  return ORGAN_STATUS_OPTIONS.find((o) => o.value === status)?.color ?? "#22c55e";
}

/** 映射到 3D 热点热度 0~1 */
export function statusToHeat(status: OrganStatusLevel): number {
  if (status === "danger") return 0.92;
  if (status === "warning") return 0.52;
  return 0.12;
}

export function organStatusToHeatMap(map: CustomerOrganStatusMap): Record<OrganHeatKey, number> {
  const out = {} as Record<OrganHeatKey, number>;
  for (const def of ORGAN_HOTSPOTS) {
    out[def.key] = statusToHeat(map[def.key]?.status ?? "normal");
  }
  return out;
}
