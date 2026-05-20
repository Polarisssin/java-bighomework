import type { MenuItem } from "@/stores/user";

/** 从登录菜单收集可访问路径（含 /dashboard） */
export function collectAllowedPaths(menus: MenuItem[]): Set<string> {
  const set = new Set<string>();
  for (const m of menus) {
    if (!m.path) continue;
    const p = m.path.startsWith("/") ? m.path : `/${m.path}`;
    set.add(p);
  }
  return set;
}

export function canAccessPath(path: string, menus: MenuItem[]): boolean {
  const normalized = path.replace(/\/$/, "") || "/";
  const allowed = collectAllowedPaths(menus);
  if (allowed.has(normalized)) return true;
  // 子路径暂不开放，仅精确匹配菜单 path
  return false;
}

/** 无权限时跳转到用户第一个菜单页 */
export function defaultHomePath(menus: MenuItem[]): string {
  const paths = [...collectAllowedPaths(menus)];
  if (paths.includes("/dashboard")) return "/dashboard";
  paths.sort();
  return paths[0] || "/login";
}
