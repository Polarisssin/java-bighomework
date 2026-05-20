/** 历史记录行常带 customerName（接口 JOIN）；退住老人勿仅用当前在住列表解析 */
export function displayCustomerName(
  row: { customerName?: string; customerId?: number },
  fallback = "—"
) {
  const name = (row.customerName || "").trim();
  if (name) return name;
  if (row.customerId != null) return `ID:${row.customerId}`;
  return fallback;
}
