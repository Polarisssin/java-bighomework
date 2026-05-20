import { getRiskLevelByPpb, getRiskMetaByPpb } from "@/lib/ppb-risk.js";

export type BodyScanRiskLevel = "healthy" | "risk" | "critical";

export type CustomerBodyScanInput = {
  id?: number;
  customerName?: string;
  customerAge?: number;
  levelId?: number | null;
  residentStatus?: number;
  residenceStatus?: string | number;
  customerSex?: number;
  elderType?: string;
  bedLabel?: string;
  roomNo?: number | string;
  bedNo?: number | string;
};

/** 统一入住登记 / 服务关注 / 老人状态 等不同列表行字段 */
export function normalizeCustomerForBodyScan(
  row: CustomerBodyScanInput & Record<string, unknown>
): CustomerBodyScanInput & { id: number; customerName: string } {
  const rs = row.residentStatus ?? row.residenceStatus;
  let residentStatus: number | undefined;
  if (rs === 2 || rs === "已退住") residentStatus = 2;
  else if (
    rs === 1 ||
    rs === "在住" ||
    rs === "在院" ||
    rs === "外出" ||
    rs === "外出中"
  ) {
    residentStatus = 1;
  }

  let levelId = row.levelId != null ? Number(row.levelId) : null;
  if ((levelId == null || Number.isNaN(levelId)) && typeof row.elderType === "string") {
    levelId = row.elderType.includes("护理") ? 1 : null;
  }
  if (levelId != null && Number.isNaN(levelId)) levelId = null;

  const ageRaw = row.customerAge ?? row.customer_age;
  const customerAge =
    ageRaw != null && ageRaw !== "" ? Number(ageRaw) : undefined;

  return {
    ...row,
    id: Number(row.id),
    customerName: String(row.customerName ?? row.customer_name ?? "老人"),
    customerAge: Number.isFinite(customerAge) ? customerAge : undefined,
    levelId,
    residentStatus,
  };
}

export function deriveBodyScanFromCustomer(c: CustomerBodyScanInput | null | undefined) {
  if (!c) {
    return {
      ppb: null as number | null,
      riskLevel: "healthy" as BodyScanRiskLevel,
      scanning: false,
      riskMeta: getRiskMetaByPpb(0),
    };
  }
  if (c.residentStatus === 2) {
    return {
      ppb: 0,
      riskLevel: "healthy" as BodyScanRiskLevel,
      scanning: false,
      riskMeta: getRiskMetaByPpb(0),
    };
  }

  let ppb = 160 + (Number(c.id) % 11) * 38;
  if (c.levelId) ppb += 240;
  const age = Number(c.customerAge);
  if (age >= 85) ppb += 200;
  else if (age >= 75) ppb += 110;
  else if (age >= 65) ppb += 40;
  if (c.customerSex === 1) ppb += 25;

  const riskLevel = getRiskLevelByPpb(ppb) as BodyScanRiskLevel;
  return {
    ppb,
    riskLevel,
    scanning: false,
    riskMeta: getRiskMetaByPpb(ppb),
  };
}
