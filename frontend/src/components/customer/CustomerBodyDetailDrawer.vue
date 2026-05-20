<template>
  <el-drawer
    v-model="visible"
    :title="customer ? `${customer.customerName} · 身体状态` : '身体状态'"
    size="560px"
    append-to-body
    destroy-on-close
    class="customer-body-drawer"
    @opened="onDrawerOpened"
    @closed="onDrawerClosed"
  >
    <template v-if="customer">
      <div class="scan-title">人体 3D 扫描（绿=正常/已排除 · 橙=发现隐患 · 红=严重）</div>
      <BodyScanHost
        v-if="scanReady"
        :key="scanHostKey"
        :scanning="scanning"
        :ppb="scan.ppb"
        :risk-level="scan.riskLevel"
        :organ-status="organStatus"
      />
      <div v-else class="scan-loading">3D 准备中…</div>

      <OrganStatusEditor
        v-model="organStatus"
        variant="dark"
        :customer-id="customer.id"
        @saved="onOrganSaved"
      />
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from "vue";
const BodyScanHost = defineAsyncComponent(() => import("@/components/body-scan/BodyScanHost.vue"));
import OrganStatusEditor from "@/components/customer/OrganStatusEditor.vue";
import {
  deriveBodyScanFromCustomer,
  normalizeCustomerForBodyScan,
  type CustomerBodyScanInput,
} from "@/lib/customer-body-scan";
import {
  defaultOrganStatusMap,
  normalizeOrganStatusMap,
  type CustomerOrganStatusMap,
} from "@/lib/organ-status";
import request from "@/utils/request";

export type CustomerRow = CustomerBodyScanInput & { id: number; customerName: string };

const visible = ref(false);
const customer = ref<CustomerRow | null>(null);
const scanning = ref(false);
const scanReady = ref(false);
const scanHostKey = ref(0);
const organStatus = ref<CustomerOrganStatusMap>(defaultOrganStatusMap());

const scan = computed(() => deriveBodyScanFromCustomer(customer.value));

function onDrawerOpened() {
  scanHostKey.value += 1;
  scanReady.value = true;
}

function onDrawerClosed() {
  scanReady.value = false;
  scanning.value = false;
}

async function loadOrganStatus(customerId: number) {
  try {
    const data = await request.get(`/customers/${customerId}/organ-status`);
    organStatus.value = normalizeOrganStatusMap(data?.organs ?? data);
  } catch {
    organStatus.value = defaultOrganStatusMap();
  }
}

function onOrganSaved(map: CustomerOrganStatusMap) {
  organStatus.value = map;
}

function open(row: CustomerBodyScanInput & Record<string, unknown>) {
  customer.value = normalizeCustomerForBodyScan(row) as CustomerRow;
  scanReady.value = false;
  organStatus.value = defaultOrganStatusMap();
  visible.value = true;
  scanning.value = true;
  loadOrganStatus(customer.value.id);
  window.setTimeout(() => {
    scanning.value = false;
  }, 2200);
}

defineExpose({ open });
</script>

<style scoped>
.customer-body-drawer :deep(.el-drawer__body) {
  background: #0b1220;
  color: #e2e8f0;
}

.scan-title {
  margin-bottom: 8px;
  font-size: 13px;
  color: rgba(226, 232, 240, 0.85);
}

.scan-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 18rem;
  font-size: 13px;
  color: rgba(226, 232, 240, 0.55);
}
</style>
