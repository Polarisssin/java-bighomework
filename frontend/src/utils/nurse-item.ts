/** 是否允许登记护理（与云函数 computeServiceStatus 规则一致） */
export function nurseItemExecuteHint(item: {
  isLevelTemplate?: boolean;
  id?: number | null;
  nurseNumber?: number | null;
  maturityTime?: string | null;
}): { ok: boolean; reason?: string } {
  if (item.isLevelTemplate || item.id == null) {
    return { ok: false, reason: "未购买" };
  }
  const num = Number(item.nurseNumber ?? 0);
  if (num <= 0) {
    return { ok: false, reason: "次数已用完" };
  }
  const mat = String(item.maturityTime || "").slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  if (mat && mat < today) {
    return { ok: false, reason: "已到期" };
  }
  return { ok: true };
}
