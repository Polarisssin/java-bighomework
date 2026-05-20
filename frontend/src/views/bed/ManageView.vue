<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="toolbar">
        <span>床位管理</span>
        <el-button @click="load">刷新</el-button>
      </div>
    </template>

    <el-row :gutter="16" class="stats">
      <el-col :span="6"><el-statistic title="总床位" :value="stats.total" /></el-col>
      <el-col :span="6"><el-statistic title="空闲" :value="stats.free" /></el-col>
      <el-col :span="6"><el-statistic title="有人" :value="stats.occupied" /></el-col>
      <el-col :span="6"><el-statistic title="外出" :value="stats.out" /></el-col>
    </el-row>

    <el-divider content-position="left">床位使用记录（beddetails）</el-divider>
    <el-form :inline="true" class="mb">
      <el-form-item label="老人姓名">
        <el-input v-model="detailQuery.customerName" clearable placeholder="模糊查询" />
      </el-form-item>
      <el-form-item label="入住日期">
        <el-date-picker
          v-model="detailQuery.checkinDate"
          type="date"
          value-format="YYYY-MM-DD"
          clearable
          placeholder="开始日期"
        />
      </el-form-item>
      <el-form-item label="使用状态">
        <el-select v-model="detailQuery.useStatus" clearable placeholder="全部" style="width: 120px">
          <el-option label="正在使用" :value="1" />
          <el-option label="历史" :value="2" />
        </el-select>
      </el-form-item>
      <el-button type="primary" @click="loadDetails">查询</el-button>
    </el-form>
    <el-table :data="bedDetails" border stripe size="small" max-height="220" v-loading="detailsLoading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="customerName" label="老人" width="90" />
      <el-table-column prop="bedLabel" label="床位" width="100" />
      <el-table-column label="开始" width="110">
        <template #default="{ row }">{{ formatDate(row.startDate) }}</template>
      </el-table-column>
      <el-table-column label="结束" width="110">
        <template #default="{ row }">{{ formatDate(row.endDate) || "-" }}</template>
      </el-table-column>
      <el-table-column prop="useStatusLabel" label="状态" width="90" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button v-if="row.useStatus === 1" link type="primary" @click="openEndEdit(row)">改结束日</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-divider content-position="left">入住老人（含床位 ID）</el-divider>
    <el-table :data="occupied" border stripe size="small" max-height="220">
      <el-table-column prop="customerId" label="老人 ID" width="80" />
      <el-table-column prop="customerName" label="姓名" min-width="90" />
      <el-table-column prop="bedId" label="床位 ID" width="80" />
      <el-table-column prop="bedLabel" label="床位" width="100" />
      <el-table-column prop="roomNo" label="房间" width="70" />
      <el-table-column prop="bedStatusLabel" label="状态" width="80" />
    </el-table>

    <el-divider content-position="left">空闲床位</el-divider>
    <el-table :data="free" border stripe size="small" max-height="180">
      <el-table-column prop="bedId" label="床位 ID" width="90" />
      <el-table-column prop="bedLabel" label="床位" width="110" />
      <el-table-column prop="roomNo" label="房间" width="80" />
    </el-table>

    <el-divider content-position="left">当天床位调换</el-divider>
    <el-form :inline="true">
      <el-form-item label="老人">
        <el-select v-model="swapCustomerId" filterable placeholder="选择老人" style="width: 220px">
          <el-option
            v-for="r in occupied.filter((x) => x.customerId)"
            :key="r.customerId"
            :label="`ID${r.customerId} ${r.customerName}（床位${r.bedId}）`"
            :value="r.customerId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="调至空床">
        <el-select v-model="swapBedId" filterable placeholder="选择空闲床位" style="width: 220px">
          <el-option
            v-for="b in free"
            :key="b.bedId"
            :label="`床位ID ${b.bedId} · ${b.bedLabel}`"
            :value="b.bedId"
          />
        </el-select>
      </el-form-item>
      <el-button type="primary" :loading="swapping" @click="swap">当天调换</el-button>
    </el-form>
  </el-card>

  <el-dialog v-model="endVisible" title="修改结束日期" width="400px">
    <el-date-picker v-model="endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
    <template #footer>
      <el-button @click="endVisible = false">取消</el-button>
      <el-button type="primary" @click="saveEndDate">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import request from "@/utils/request";
import { confirmDanger } from "@/utils/confirm-danger";
import { UI_TEXT } from "@/constants/ui-text";
import { formatDate } from "@/utils/date";

const loading = ref(false);
const detailsLoading = ref(false);
const swapping = ref(false);
const occupied = ref<any[]>([]);
const free = ref<any[]>([]);
const bedDetails = ref<any[]>([]);
const stats = reactive({ total: 0, free: 0, occupied: 0, out: 0 });
const swapCustomerId = ref<number>();
const swapBedId = ref<number>();
const detailQuery = reactive<{ customerName?: string; checkinDate?: string; useStatus?: number }>({});
const endVisible = ref(false);
const endDate = ref("");
const editingDetailId = ref<number>();

async function load() {
  loading.value = true;
  try {
    const data = await request.get("/beds/overview");
    Object.assign(stats, data.statistics);
    occupied.value = data.occupied;
    free.value = data.free;
    await loadDetails();
  } finally {
    loading.value = false;
  }
}

async function loadDetails() {
  detailsLoading.value = true;
  try {
    const page = await request.get("/beds/details", {
      params: { page: 1, size: 50, ...detailQuery },
    });
    bedDetails.value = page.records || [];
  } finally {
    detailsLoading.value = false;
  }
}

function openEndEdit(row: any) {
  editingDetailId.value = row.id;
  endDate.value = formatDate(row.endDate) || new Date().toISOString().slice(0, 10);
  endVisible.value = true;
}

async function saveEndDate() {
  if (!editingDetailId.value || !endDate.value) return;
  await request.put(`/beds/details/${editingDetailId.value}`, { endDate: endDate.value });
  ElMessage.success("已更新结束日期");
  endVisible.value = false;
  loadDetails();
}

async function swap() {
  if (!swapCustomerId.value || !swapBedId.value) {
    ElMessage.warning("请选择老人和空闲床位");
    return;
  }
  await confirmDanger(UI_TEXT.confirmSwapBed, "床位调换");
  swapping.value = true;
  try {
    await request.post("/beds/swap", null, {
      params: { customerId: swapCustomerId.value, newBedId: swapBedId.value },
    });
    ElMessage.success("调换成功");
    swapCustomerId.value = undefined;
    swapBedId.value = undefined;
    load();
  } finally {
    swapping.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stats {
  margin-bottom: 8px;
}
.mb {
  margin-bottom: 12px;
}
</style>
