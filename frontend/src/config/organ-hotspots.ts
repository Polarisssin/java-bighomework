import type { OrganHeatKey } from "@/lib/organ-heat";

export const ORGAN_HOTSPOT_Y_LIFT = 0.92;

export const ORGAN_HOTSPOT_Z_INWARD = -0.12;

export type OrganHotspotDef = {
  key: OrganHeatKey;
  label: string;
  hint: string;
  pos: [number, number, number];
  r: number;
};

export const ORGAN_HOTSPOTS: readonly OrganHotspotDef[] = [
  {
    key: "head",
    label: "头部",
    hint: "脑部与头颈部血流、神经调节与整体状态相关，可作为全身应激的参考区。",
    pos: [0, 0.76, 0.048],
    r: 0.075,
  },
  {
    key: "heart",
    label: "心脏",
    hint: "心血管负荷与节律；读数偏高时建议关注心率变异性与活动后恢复。",
    pos: [0.033, 0.39, 0.1],
    r: 0.052,
  },
  {
    key: "lungL",
    label: "左肺",
    hint: "左肺呼吸区；挥发性有机物暴露时呼吸系统常最先出现波动。",
    pos: [-0.105, 0.47, 0.068],
    r: 0.058,
  },
  {
    key: "lungR",
    label: "右肺",
    hint: "右肺呼吸区；与左肺联动观察更完整。",
    pos: [0.105, 0.47, 0.068],
    r: 0.058,
  },
  {
    key: "liver",
    label: "肝脏",
    hint: "代谢与解毒；长期暴露可能影响肝酶与脂质代谢指标。",
    pos: [0.073, 0.27, 0.087],
    r: 0.058,
  },
  {
    key: "gut",
    label: "肠胃",
    hint: "消化吸收与肠道屏障；应激与毒素暴露可能表现为胃肠不适。",
    pos: [0, 0.11, 0.072],
    r: 0.068,
  },
] as const;

export function getHotspotByKey(key: OrganHeatKey): OrganHotspotDef | undefined {
  return ORGAN_HOTSPOTS.find((h) => h.key === key);
}
