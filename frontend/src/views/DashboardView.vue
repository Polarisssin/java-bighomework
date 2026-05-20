<template>
  <div class="dashboard">
    <el-row :gutter="16">
      <el-col v-for="card in cards" :key="card.key" :xs="12" :sm="8" :md="6">
        <el-card shadow="hover" class="stat-card" :body-style="{ padding: '18px 20px' }">
          <div class="stat-label">{{ card.label }}</div>
          <div class="stat-value" :class="card.tone">{{ card.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="hint-card" shadow="never">
      <p class="hint-title">{{ UI_TEXT.dashboardHintTitle }}</p>
      <p class="hint-body">{{ UI_TEXT.dashboardHintBody }}</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { UI_TEXT } from "@/constants/ui-text";
import { useUserStore } from "@/stores/user";
import request from "@/utils/request";

interface DashboardStats {
  residentCount: number;
  freeBedCount: number;
  pendingOutward: number;
  pendingBackdown: number;
  todayRecordCount: number;
  myCustomerCount?: number | null;
  roleId: number;
}

const store = useUserStore();
const stats = ref<DashboardStats | null>(null);

const cards = computed(() => {
  const s = stats.value;
  if (!s) return [];
  const base = [
    { key: "resident", label: UI_TEXT.statResident, value: s.residentCount, tone: "primary" },
    { key: "bed", label: UI_TEXT.statFreeBed, value: s.freeBedCount, tone: "success" },
    { key: "out", label: UI_TEXT.statPendingOutward, value: s.pendingOutward, tone: "warn" },
    { key: "back", label: UI_TEXT.statPendingBackdown, value: s.pendingBackdown, tone: "warn" },
    { key: "record", label: UI_TEXT.statTodayRecord, value: s.todayRecordCount, tone: "primary" },
  ];
  if (store.isAdmin()) return base;
  return [
    { key: "mine", label: UI_TEXT.statMyCustomers, value: s.myCustomerCount ?? 0, tone: "primary" },
    ...base.filter((c) => c.key !== "resident" && c.key !== "bed"),
  ];
});

onMounted(async () => {
  stats.value = await request.get<DashboardStats>("/dashboard/stats");
});
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-card {
  border-radius: 10px;
}

.stat-label {
  font-size: 13px;
  color: var(--app-text-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-value.primary {
  color: var(--app-primary);
}

.stat-value.success {
  color: #16a34a;
}

.stat-value.warn {
  color: #d97706;
}

.hint-card {
  border-radius: 10px;
}

.hint-title {
  margin: 0 0 6px;
  font-weight: 600;
  color: var(--app-text);
}

.hint-body {
  margin: 0;
  font-size: 13px;
  color: var(--app-text-secondary);
  line-height: 1.6;
}
</style>
