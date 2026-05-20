/** Normalize API date (ISO or YYYY-MM-DD) to YYYY-MM-DD for display / date-picker. */
export function formatDate(value: unknown): string {
  if (value == null || value === "") return "";
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(value);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : s;
}

/** API datetime → YYYY-MM-DD HH:mm for display. */
export function formatDateTime(value: unknown): string {
  if (value == null || value === "") return "";
  const s = String(value).replace("T", " ");
  const m = s.match(/^(\d{4}-\d{2}-\d{2})(?: (\d{2}:\d{2}))?/);
  if (!m) return s;
  return m[2] ? `${m[1]} ${m[2]}` : m[1];
}
