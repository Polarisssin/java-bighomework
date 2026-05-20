<template>
  <el-card header="老人状态一览（我的服务对象）">
    <el-alert
      v-if="!loading && list.length === 0"
      type="info"
      :closable="false"
      show-icon
      title="暂无服务对象"
      description="请联系管理员在「健康管家 → 设置服务对象」中为您分配老人。"
      class="mb"
    />
    <el-table :data="list" border stripe v-loading="loading" size="small" :default-sort="{ prop: 'id', order: 'descending' }">
      <el-table-column prop="id" label="老人ID" width="75" sortable />
      <el-table-column prop="customerName" label="姓名" width="90" />
      <el-table-column prop="customerAge" label="年龄" width="60" />
      <el-table-column label="性别" width="60">
        <template #default="{ row }">{{ row.customerSex === 0 ? "男" : "女" }}</template>
      </el-table-column>
      <el-table-column prop="bedLabel" label="床位" width="90" />
      <el-table-column prop="elderType" label="类型" width="70" />
      <el-table-column prop="levelName" label="护理级别" width="90" />
      <el-table-column prop="residenceStatus" label="在院状态" width="90">
        <template #default="{ row }">
          <el-tag
            :type="row.residenceStatus === '在院' ? 'success' : row.residenceStatus === '外出中' ? 'warning' : 'info'"
            size="small"
          >
            {{ row.residenceStatus }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="护理项目" width="80">
        <template #default="{ row }">{{ row.purchasedItemCount }}</template>
      </el-table-column>
      <el-table-column label="今日记录" width="80">
        <template #default="{ row }">{{ row.todayRecordCount }}</template>
      </el-table-column>
      <el-table-column prop="contactTel" label="联系电话" min-width="110" />
      <el-table-column label="入住" width="100">
        <template #default="{ row }">{{ formatDate(row.checkinDate) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="success" @click="openBodyDetail(row)">身体详情</el-button>
          <el-button link type="primary" @click="goDaily(row.id)">日常护理</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <CustomerBodyDetailDrawer ref="bodyDrawerRef" />
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import CustomerBodyDetailDrawer from "@/components/customer/CustomerBodyDetailDrawer.vue";
import request from "@/utils/request";
import { formatDate } from "@/utils/date";

const router = useRouter();
const loading = ref(false);
const list = ref<any[]>([]);
const bodyDrawerRef = ref<InstanceType<typeof CustomerBodyDetailDrawer> | null>(null);

async function load() {
  loading.value = true;
  try {
    const data = await request.get("/caregiver/elders-status");
    list.value = data.records || [];
  } finally {
    loading.value = false;
  }
}

function goDaily(customerId: number) {
  router.push({ path: "/caregiver/daily", query: { customerId: String(customerId) } });
}

function openBodyDetail(row: Record<string, unknown>) {
  bodyDrawerRef.value?.open(row as never);
}

onMounted(load);
</script>

<style scoped>
.mb {
  margin-bottom: 12px;
}
</style>
