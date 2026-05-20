"use strict";

function snakeToCamelKey(k) {
  return k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function rowToCamel(row) {
  if (!row) return null;
  const o = {};
  for (const [k, v] of Object.entries(row)) o[snakeToCamelKey(k)] = v;
  return o;
}

function rowsToCamel(rows) {
  return (rows || []).map(rowToCamel);
}

function calcAge(birthday) {
  if (!birthday) return null;
  const birth = new Date(birthday);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

function getUserFromEvent(event) {
  const h = event.headers || {};
  let auth = h.authorization || h.Authorization || "";
  if (!auth && event.requestContext?.http?.headers) {
    const rh = event.requestContext.http.headers;
    auth = rh.authorization || rh.Authorization || "";
  }
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  try {
    const user = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    if (user && user.role == null && user.roleId != null) user.role = user.roleId;
    return user;
  } catch {
    return null;
  }
}

function getRoleId(authUser) {
  if (!authUser) return null;
  const r = authUser.role ?? authUser.roleId;
  return r == null ? null : Number(r);
}

function bedStatusNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function assertCaregiverOwnsCustomer(db, authUser, customerId) {
  if (getRoleId(authUser) !== 2) return;
  const cust = await db.queryOne("SELECT user_id FROM customer WHERE id=?", [customerId]);
  if (!cust) throw { status: 404, message: "客户不存在" };
  if (Number(cust.user_id) !== Number(authUser.uid)) {
    throw { status: 403, message: "只能操作您负责的老人" };
  }
}

function validateOutwardDates(outgoingtime, expectedreturntime) {
  if (!outgoingtime || !expectedreturntime) return "请填写外出与预计回院日期";
  if (expectedreturntime < outgoingtime) return "预计回院不能早于外出时间";
  return null;
}

function validateCheckinDates(checkinDate, expirationDate) {
  if (!checkinDate || !expirationDate) return "请填写入住日期与合同到期日";
  const inDt = String(checkinDate).slice(0, 10);
  const exDt = String(expirationDate).slice(0, 10);
  if (exDt < inDt) return "合同到期日不能早于入住日期";
  return null;
}

function validateBuyMaturityDates(buyTime, maturityTime) {
  if (!buyTime || !maturityTime) return "请填写购买日期与到期日期";
  const buy = String(buyTime).slice(0, 10);
  const mat = String(maturityTime).slice(0, 10);
  if (mat < buy) return "到期日期不能早于购买日期";
  return null;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function requireAdmin(authUser) {
  if (getRoleId(authUser) !== 1) throw { status: 403, message: "仅管理员可操作" };
}

async function validateNurseRecordExecution(db, customerId, itemId, nursingCount) {
  const cnt = Math.max(1, Number(nursingCount) || 1);
  if (!Number.isFinite(cnt) || cnt < 1) throw { status: 400, message: "护理次数至少为 1" };
  const cni = await db.queryOne(
    "SELECT id, nurse_number, maturity_time FROM customernurseitem WHERE customer_id=? AND item_id=? AND is_deleted=0",
    [customerId, itemId]
  );
  if (!cni) throw { status: 400, message: "该老人未购买此护理项目或已删除" };
  const remaining = Number(cni.nurse_number ?? 0);
  if (remaining <= 0) throw { status: 400, message: "护理项目剩余次数为 0，无法登记" };
  const mat = String(cni.maturity_time || "").slice(0, 10);
  const today = todayIso();
  if (mat && mat < today) throw { status: 400, message: "护理项目已到期，无法登记" };
  if (cnt > remaining) throw { status: 400, message: `本次次数不能超过剩余次数（剩余 ${remaining} 次）` };
  return { cniId: cni.id, deduct: cnt };
}

module.exports = {
  rowToCamel,
  rowsToCamel,
  calcAge,
  getUserFromEvent,
  getRoleId,
  bedStatusNum,
  assertCaregiverOwnsCustomer,
  requireAdmin,
  validateOutwardDates,
  validateCheckinDates,
  validateBuyMaturityDates,
  validateNurseRecordExecution,
  todayIso,
};
