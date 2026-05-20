<template>
  <el-card>
    <template #header>
      <div class="toolbar">
        <span>设置服务对象（分配健康管家）</span>
        <el-button @click="load">刷新</el-button>
      </div>
    </template>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="mb"
      title="说明"
      description="为在住老人指定健康管家后，管家端「老人状态」「日常护理」仅显示其负责的老人；管家登记的护理记录会同步到管理员「护理管理 → 护理记录」。"
    />
    <el-table :data="customers" border stripe v-loading="loading">
      <el-table-column prop="id" label="老人ID" width="80" />
      <el-table-column prop="customerName" label="姓名" width="100" />
      <el-table-column prop="roomNo" label="房间" width="80" />
      <el-table-column label="类型" width="80">
        <template #default="{ row }">{{ row.levelId ? "护理" : "自理" }}</template>
      </el-table-column>
      <el-table-column label="当前管家" width="120">
        <template #default="{ row }">{{ caregiverName(row.userId) }}</template>
      </el-table-column>
      <el-table-column label="分配管家" min-width="200">
        <template #default="{ row }">
          <el-select
            v-model="row._assignUserId"
            filterable
            clearable
            placeholder="选择健康管家"
            style="width: 180px"
            @change="(v: number) => onAssign(row, v)"
          >
            <el-option label="未分配" :value="-1" />
            <el-option v-for="n in nurses" :key="n.id" :label="n.nickname" :value="n.id" />
          </el-select>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import request from "@/utils/request";

const loading = ref(false);
const customers = ref<any[]>([]);
const nurses = ref<any[]>([]);
const nurseMap = ref<Map<number, string>>(new Map());

function caregiverName(userId: number) {
  if (!userId || userId < 0) return "未分配";
  return nurseMap.value.get(userId) || `管家#${userId}`;
}

async function load() {
  loading.value = true;
  try {
    const [cp, np] = await Promise.all([
      request.get("/customers", { params: { residence: "active", elderlyType: "all", page: 1, size: 200 } }),
      request.get("/users", { params: { roleId: 2, page: 1, size: 50 } }),
    ]);
    nurses.value = np.records || [];
    nurseMap.value = new Map(nurses.value.map((n: any) => [n.id, n.nickname]));
    customers.value = (cp.records || []).map((c: any) => ({
      ...c,
      _assignUserId: c.userId > 0 ? c.userId : -1,
    }));
  } finally {
    loading.value = false;
  }
}

async function onAssign(row: any, userId: number) {
  await request.put("/caregiver/assign", { customerId: row.id, userId: userId > 0 ? userId : -1 });
  row.userId = userId > 0 ? userId : -1;
  ElMessage.success("分配已保存");
}

onMounted(load);
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mb {
  margin-bottom: 12px;
}
</style>
