import { PPB_THRESHOLDS } from "@/lib/ppb-risk.js";

export type OrganHeatKey = "head" | "heart" | "lungL" | "lungR" | "liver" | "gut";

export type OrganHeatMap = Record<OrganHeatKey, number>;

export function getHeatIntensityFromPpb(ppb: number | null | undefined): number {
  if (ppb == null || Number.isNaN(ppb)) return 0.12;
  const v = Number(ppb);
  if (v <= PPB_THRESHOLDS.healthyMax) {
    return 0.08 + (v / PPB_THRESHOLDS.healthyMax) * 0.22;
  }
  if (v <= PPB_THRESHOLDS.riskMax) {
    const t = (v - PPB_THRESHOLDS.healthyMax) / (PPB_THRESHOLDS.riskMax - PPB_THRESHOLDS.healthyMax);
    return 0.3 + t * 0.35;
  }
  const t = Math.min(1, (v - PPB_THRESHOLDS.riskMax) / 600);
  return 0.65 + t * 0.35;
}

export function getOrganHeatMap(ppb: number | null | undefined): OrganHeatMap {
  const base = getHeatIntensityFromPpb(ppb);
  const respBoost = base > 0.45 ? 0.18 : 0;
  const liverBoost = base > 0.55 ? 0.12 : 0;

  return {
    head: Math.min(1, base * 0.42 + 0.08),
    heart: Math.min(1, base * 0.55 + base * 0.15),
    lungL: Math.min(1, base * 0.95 + respBoost),
    lungR: Math.min(1, base * 0.95 + respBoost),
    liver: Math.min(1, base * 0.75 + liverBoost),
    gut: Math.min(1, base * 0.68 + liverBoost * 0.55),
  };
}
