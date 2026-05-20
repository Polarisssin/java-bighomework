import { createRouter, createWebHashHistory } from "vue-router";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/user";
import { UI_TEXT } from "@/constants/ui-text";
import { canAccessPath, defaultHomePath } from "@/utils/permission";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { public: true },
    },
    {
      path: "/",
      component: () => import("@/layouts/MainLayout.vue"),
      redirect: "/dashboard",
      children: [
        { path: "dashboard", component: () => import("@/views/DashboardView.vue") },
        { path: "customer/checkin", component: () => import("@/views/customer/CheckinView.vue") },
        { path: "customer/outward", component: () => import("@/views/customer/OutwardView.vue") },
        { path: "customer/backdown", component: () => import("@/views/customer/BackdownView.vue") },
        { path: "bed/diagram", component: () => import("@/views/bed/DiagramView.vue") },
        { path: "bed/manage", component: () => import("@/views/bed/ManageView.vue") },
        { path: "nurse/content", component: () => import("@/views/nurse/ContentView.vue") },
        { path: "nurse/level", component: () => import("@/views/nurse/LevelView.vue") },
        { path: "nurse/customer-setting", component: () => import("@/views/nurse/CustomerSettingView.vue") },
        { path: "nurse/record", component: () => import("@/views/nurse/RecordView.vue") },
        { path: "health/assign", component: () => import("@/views/health/AssignView.vue") },
        { path: "health/service", component: () => import("@/views/health/ServiceView.vue") },
        { path: "user/manage", component: () => import("@/views/user/UserManageView.vue") },
        { path: "caregiver/daily", component: () => import("@/views/caregiver/DailyView.vue") },
        { path: "caregiver/elders", component: () => import("@/views/caregiver/EldersView.vue") },
        { path: "caregiver/record", component: () => import("@/views/caregiver/RecordView.vue") },
        { path: "caregiver/outward", component: () => import("@/views/caregiver/OutwardApplyView.vue") },
        { path: "caregiver/backdown", component: () => import("@/views/caregiver/BackdownApplyView.vue") },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const store = useUserStore();
  if (to.meta.public) return true;
  const token = localStorage.getItem("token");
  if (!token) {
    if (store.token) store.logout();
    return "/login";
  }
  if (token !== store.token) store.token = token;

  const menus = store.menus || [];
  if (!canAccessPath(to.path, menus)) {
    ElMessage.warning(UI_TEXT.noPermission);
    return defaultHomePath(menus);
  }
  return true;
});

export default router;
