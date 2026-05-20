<template>
  <el-container class="layout">
    <el-aside width="232px" class="aside">
      <div class="logo">
        <div class="logo-mark" aria-hidden="true">NEU</div>
        <div>
          <div class="logo-title">{{ UI_TEXT.brandTitle }}</div>
          <div class="logo-sub">{{ UI_TEXT.brandSub }}</div>
        </div>
      </div>
      <el-menu
        :default-active="active"
        router
        class="side-menu"
        background-color="transparent"
        text-color="rgba(248, 250, 252, 0.78)"
        active-text-color="#ffffff"
      >
        <template v-for="group in menuTree" :key="group.title">
          <el-sub-menu v-if="group.children.length" :index="group.title">
            <template #title>
              <el-icon><component :is="group.icon" /></el-icon>
              <span>{{ group.title }}</span>
            </template>
            <el-menu-item
              v-for="item in group.children"
              :key="item.path"
              :index="'/' + item.path"
            >
              {{ item.title }}
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else-if="group.path" :index="'/' + group.path">
            <el-icon><component :is="group.icon" /></el-icon>
            <span>{{ group.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-container class="main-wrap">
      <el-header class="header" height="56px">
        <div class="header-title-wrap">
          <h1 class="header-title">{{ currentTitle }}</h1>
          <span class="header-sub">{{ roleLabel }}</span>
        </div>
        <div class="header-actions">
          <span class="user-chip">{{ userStore.user?.nickname }}</span>
          <el-button class="logout-btn" plain @click="onLogout">{{ UI_TEXT.logout }}</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore, type MenuItem } from "@/stores/user";
import { UI_TEXT } from "@/constants/ui-text";
import {
  Avatar,
  Back,
  Connection,
  DataBoard,
  Document,
  EditPen,
  FirstAidKit,
  Grid,
  House,
  List,
  Menu,
  Notebook,
  Odometer,
  Position,
  Promotion,
  Rank,
  Remove,
  Setting,
  Suitcase,
  Tickets,
  User,
  UserFilled,
  View,
} from "@element-plus/icons-vue";

const ICON_MAP: Record<string, Component> = {
  User,
  House,
  Remove,
  Position,
  Grid,
  DataBoard,
  Tickets,
  FirstAidKit,
  List,
  Rank,
  Setting,
  Document,
  Avatar,
  Connection,
  View,
  UserFilled,
  Suitcase,
  EditPen,
  Notebook,
  Odometer,
  Promotion,
  Back,
  Menu,
};

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const active = computed(() => route.path);

const roleLabel = computed(() => (userStore.isAdmin() ? UI_TEXT.roleAdmin : UI_TEXT.roleNurse));

const currentTitle = computed(() => {
  const hit = (userStore.menus as MenuItem[]).find((m) => m.path === route.path);
  return hit?.title || UI_TEXT.workbench;
});

function iconOf(name?: string) {
  return ICON_MAP[name || "Menu"] || Menu;
}

const menuTree = computed(() => {
  const list = userStore.menus as MenuItem[];
  const parents = list.filter((m) => !m.parentId);
  return parents.map((p) => ({
    title: p.title,
    icon: iconOf(p.icon),
    path: p.path ? p.path.replace(/^\//, "") : undefined,
    children: list
      .filter((c) => c.parentId === p.id && c.path)
      .map((c) => ({ title: c.title, path: c.path!.replace(/^\//, "") })),
  }));
});

function onLogout() {
  userStore.logout();
  router.push("/login");
}
</script>

<style scoped>
.layout {
  height: 100vh;
  background: var(--app-bg);
}

.aside {
  background: var(--app-sidebar);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-mark {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--app-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.logo-title {
  font-size: 15px;
  font-weight: 600;
  color: #f8fafc;
  line-height: 1.3;
}

.logo-sub {
  margin-top: 2px;
  font-size: 11px;
  color: rgba(248, 250, 252, 0.5);
}

.side-menu {
  flex: 1;
  border-right: none;
  padding: 8px 10px 16px;
  overflow-y: auto;
}

.aside :deep(.side-menu .el-menu-item),
.aside :deep(.side-menu .el-sub-menu__title) {
  height: 42px;
  line-height: 42px;
  border-radius: 8px;
  margin-bottom: 2px;
}

.aside :deep(.side-menu .el-menu-item:hover),
.aside :deep(.side-menu .el-sub-menu__title:hover) {
  background: rgba(255, 255, 255, 0.08) !important;
}

.aside :deep(.side-menu .el-menu-item.is-active) {
  background: rgba(37, 99, 235, 0.22) !important;
  color: #fff !important;
  font-weight: 600;
  box-shadow: inset 3px 0 0 var(--app-primary);
}

.aside :deep(.side-menu .el-sub-menu .el-menu) {
  background: transparent !important;
  padding-left: 8px;
}

.aside :deep(.side-menu .el-sub-menu .el-menu-item.is-active) {
  background: rgba(37, 99, 235, 0.18) !important;
  box-shadow: inset 3px 0 0 var(--app-primary);
}

.main-wrap {
  min-width: 0;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: var(--app-surface);
  border-bottom: 1px solid var(--app-border);
}

.header-title-wrap {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
}

.header-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--app-text);
}

.header-sub {
  font-size: 12px;
  color: var(--app-text-secondary);
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.user-chip {
  padding: 5px 12px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #334155;
  font-size: 13px;
  font-weight: 500;
}

.logout-btn {
  color: #64748b;
  border-color: var(--app-border);
}

.logout-btn:hover {
  color: #dc2626;
  border-color: #fecaca;
  background: #fef2f2;
}

.main {
  padding: 16px 20px 20px;
  background: var(--app-bg);
}
</style>
