export const PPB_THRESHOLDS = {
  healthyMax: 500,
  riskMax: 1200,
};

export function getRiskLevelByPpb(ppb) {
  const value = Number(ppb || 0);
  if (value <= PPB_THRESHOLDS.healthyMax) return "healthy";
  if (value <= PPB_THRESHOLDS.riskMax) return "risk";
  return "critical";
}

export function getRiskMetaByPpb(ppb) {
  const level = getRiskLevelByPpb(ppb);
  if (level === "healthy") {
    return {
      level,
      label: "健康",
      description: "当前读数在健康区间，建议保持日常运动与监测。",
      color: "#00B96B",
      glow: "rgba(0,185,107,0.45)",
      action: "保持监测",
    };
  }
  if (level === "risk") {
    return {
      level,
      label: "疾病风险",
      description: "读数偏高，建议连续复测并关注近期身体状态。",
      color: "#FAAD14",
      glow: "rgba(250,173,20,0.45)",
      action: "建议复测",
    };
  }
  return {
    level,
    label: "建议就医",
    description: "读数明显异常，建议尽快线下复诊并做进一步检查。",
    color: "#FF4D4F",
    glow: "rgba(255,77,79,0.5)",
    action: "立即就医",
  };
}

export function formatPpbForDisplay(ppb) {
  if (ppb == null || Number.isNaN(Number(ppb))) return "--";
  const v = Number(ppb);
  return String(Number(v.toFixed(3)));
}
