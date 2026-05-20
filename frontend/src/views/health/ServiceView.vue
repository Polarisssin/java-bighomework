<template>
  <el-card header="服务关注（到期监控与续费）">
    <el-alert type="info" :closable="false" show-icon class="mb">
      本页仅做<strong>已购项目</strong>的状态查看与续费。购买、改期、删除、设置级别请到
      <router-link to="/nurse/customer-setting">客户护理设置</router-link>。
    </el-alert>
    <el-form :inline="true" class="mb">
      <el-form-item label="老人">
        <el-select
          v-model="customerId"
          filterable
          placeholder="选择老人"
          style="width: 240px"
          @change="loadItems"
        >
          <el-option
            v-for="c in customers"
            :key="c.id"
            :label="`${c.customerName}（${c.roomNo}房 · ${c.levelId ? '护理' : '自理'}）`"
            :value="c.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="服务状态">
        <el-select v-model="statusFilter" clearable placeholder="全部" style="width: 130px" @change="loadItems">
          <el-option label="到期" value="到期" />
          <el-option label="欠费" value="欠费" />
          <el-option label="数量正常" value="数量正常" />
          <el-option label="未到期" value="未到期" />
        </el-select>
      </el-form-item>
    </el-form>

    <el-table v-if="customerId" :data="items" border stripe v-loading="loading" size="small">
      <el-table-column prop="serialNumber" label="编号" width="90" />
      <el-table-column prop="nursingName" label="项目名称" min-width="120" />
      <el-table-column prop="servicePrice" label="单价" width="70" />
      <el-table-column prop="nurseNumber" label="剩余次数" width="90" />
      <el-table-column label="购买日期" width="110">
        <template #default="{ row }">{{ formatDate(row.buyTime) }}</template>
      </el-table-column>
      <el-table-column label="到期日期" width="110">
        <template #default="{ row }">{{ formatDate(row.maturityTime) }}</template>
      </el-table-column>
      <el-table-column prop="serviceStatus" label="服务状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.serviceStatus)" size="small">{{ row.serviceStatus }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.id && (row.serviceStatus === '到期' || row.serviceStatus === '欠费')"
            link
            type="primary"
            @click="renew(row)"
          >
            续费
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-else description="请先选择老人查看已购护理项目" />
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import request from "@/utils/request";
import { formatDate } from "@/utils/date";

const loading = ref(false);
const customers = ref<any[]>([]);
const items = ref<any[]>([]);
const customerId = ref<number>();
const statusFilter = ref<string>();

function statusTag(s: string) {
  if (s === "到期" || s === "欠费") return "danger";
  if (s === "数量正常") return "success";
  return "info";
}

async function loadCustomers() {
  const page = await request.get("/customers", {
    params: { elderlyType: "all", residence: "active", page: 1, size: 200 },
  });
  customers.value = page.records || [];
}

async function loadItems() {
  if (!customerId.value) return;
  loading.value = true;
  try {
    const page = await request.get("/health/service-items", {
      params: {
        customerId: customerId.value,
        status: statusFilter.value || undefined,
        page: 1,
        size: 100,
      },
    });
    items.value = page.records || [];
  } finally {
    loading.value = false;
  }
}

async function renew(row: any) {
  await ElMessageBox.confirm(`确认为「${row.nursingName}」续费？将按原服务周期延长到期日并增加次数。`, "续费");
  await request.put(`/nurse/customer-items/${row.id}/renew`, { addCount: 1 });
  ElMessage.success("续费成功");
  loadItems();
}

onMounted(loadCustomers);
</script>

<style scoped>
.mb {
  margin-bottom: 12px;
}
</style>
