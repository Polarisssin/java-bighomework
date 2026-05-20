"use strict";

function snakeToCamel(s) {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** DATE/DATETIME → YYYY-MM-DD for API consumers (Element Plus date-picker). */
function formatDateValue(v) {
  if (v == null || v === "") return v;
  if (v instanceof Date) {
    const y = v.getUTCFullYear();
    const m = String(v.getUTCMonth() + 1).padStart(2, "0");
    const d = String(v.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof v === "string") {
    const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  return v;
}

function isDateField(snakeKey, camelKey) {
  if (/create_time|update_time|audit_time|audittime/i.test(snakeKey + camelKey)) return false;
  return /date|birthday|outgoing|expectedreturn|actualreturn|retreat|buy_time|maturity/i.test(
    snakeKey + camelKey
  );
}

function rowToCamel(row) {
  if (!row) return null;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const ck = snakeToCamel(k);
    out[ck] = isDateField(k, ck) ? formatDateValue(v) : v;
  }
  return out;
}

function rowsToCamel(rows) {
  return (rows || []).map(rowToCamel);
}

function mapCustomer(r) {
  return rowToCamel(r);
}

function mapUser(r) {
  const u = rowToCamel(r);
  if (u) {
    u.phoneNumber = u.phoneNumber || r.phone_number;
    delete u.password;
  }
  return u;
}

function mapNurseContent(r) {
  return rowToCamel(r);
}

function mapCustomerNurseItem(r) {
  const row = rowToCamel(r);
  if (!row) return null;
  if (r.nursing_name) row.nursingName = r.nursing_name;
  if (r.serial_number) row.serialNumber = r.serial_number;
  if (r.service_price) row.servicePrice = r.service_price;
  if (r.level_name) row.levelName = r.level_name;
  return row;
}

function mapOutward(r) {
  const row = rowToCamel(r);
  if (r.customer_name) row.customerName = r.customer_name;
  for (const key of ["outgoingtime", "expectedreturntime", "actualreturntime"]) {
    if (row[key] != null) row[key] = formatDateValue(row[key]);
  }
  if (row.auditTime != null) row.auditTime = formatDateTimeValue(row.auditTime);
  if (row.audittime != null) row.audittime = formatDateTimeValue(row.audittime);
  return row;
}

function mapBackdown(r) {
  const row = rowToCamel(r);
  if (r.customer_name) row.customerName = r.customer_name;
  const rt = row.retreattime ?? row.retreatTime ?? r.retreattime;
  if (rt != null) {
    row.retreattime = formatDateValue(rt);
    row.retreatTime = row.retreattime;
  }
  if (row.auditTime != null) row.auditTime = formatDateTimeValue(row.auditTime);
  if (row.audittime != null) row.audittime = formatDateTimeValue(row.audittime);
  return row;
}

function formatDateTimeValue(v) {
  if (v == null || v === "") return v;
  if (v instanceof Date) {
    const y = v.getUTCFullYear();
    const mo = String(v.getUTCMonth() + 1).padStart(2, "0");
    const d = String(v.getUTCDate()).padStart(2, "0");
    const h = String(v.getUTCHours()).padStart(2, "0");
    const mi = String(v.getUTCMinutes()).padStart(2, "0");
    const s = String(v.getUTCSeconds()).padStart(2, "0");
    return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
  }
  if (typeof v === "string") {
    const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return v.includes("T") ? v.replace("T", " ").slice(0, 19) : v.slice(0, 19);
  }
  return v;
}

function mapNurseRecord(r) {
  const row = rowToCamel(r);
  if (!row) return null;
  if (r.customer_name) row.customerName = r.customer_name;
  if (r.nursing_name) row.nursingName = r.nursing_name;
  if (r.serial_number) row.serialNumber = r.serial_number;
  if (r.nurse_name) row.nurseName = r.nurse_name;
  if (row.nursingTime != null) row.nursingTime = formatDateTimeValue(row.nursingTime);
  return row;
}

function mapRoom(r) {
  const row = rowToCamel(r);
  if (row) row.roomFloor = String(row.roomFloor ?? r.room_floor);
  return row;
}

function mapBed(r) {
  const row = rowToCamel(r);
  if (row && row.bedStatus != null) row.bedStatus = Number(row.bedStatus);
  return row;
}

module.exports = {
  rowToCamel,
  rowsToCamel,
  mapCustomer,
  mapUser,
  mapNurseContent,
  mapCustomerNurseItem,
  mapOutward,
  mapBackdown,
  mapNurseRecord,
  mapRoom,
  mapBed,
};
