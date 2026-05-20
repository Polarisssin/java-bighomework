<template>
  <el-card>
    <template #header>
      <div class="toolbar">
        <span>护理记录</span>
        <el-button type="primary" @click="openDialog">新增记录</el-button>
      </div>
    </template>
    <el-form :inline="true" class="mb">
      <el-form-item label="老人">
        <el-select v-model="filterCustomerId" clearable filterable placeholder="全部" style="width: 200px" @change="load">
          <el-option
            v-for="c in customers"
            :key="c.id"
            :label="`${c.customerName}（ID${c.id}）`"
            :value="c.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <el-alert
      v-if="!loading && list.length === 0"
      type="info"
      :closable="false"
      show-icon
      class="mb"
      title="暂无护理记录"
      description="管理员可在此新增；健康管家在「日常护理」中登记后也会同步显示。"
    />
    <el-table :data="list" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="老人" width="100">
        <template #default="{ row }">{{ displayCustomerName(row) }}</template>
      </el-table-column>
      <el-table-column label="护理项目" min-width="140">
        <template #default="{ row }">{{ row.serialNumber }} {{ row.nursingName }}</template>
      </el-table-column>
      <el-table-column prop="nursingCount" label="次数" width="70" />
      <el-table-column label="护理时间" width="160">
        <template #default="{ row }">{{ formatDateTime(row.nursingTime) }}</template>
      </el-table-column>
      <el-table-column prop="nursingContent" label="内容" show-overflow-tooltip />
      <el-table-column prop="nurseName" label="执行人" width="90" />
      <el-table-column label="操作" width="90">
        <template #default="{ row }">
          <el-button link type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      class="mt"
      background
      layout="total, prev, pager, next"
      :total="total"
      v-model:current-page="page"
      @current-change="load"
    />
  </el-card>

  <el-dialog v-model="visible" title="新增护理记录" width="520px">
    <el-form :model="form" label-width="100px">
      <el-form-item label="老人" required>
        <el-select v-model="form.customerId" filterable style="width: 100%" @change="onCustomerChange">
          <el-option v-for="c in customers" :key="c.id" :label="c.customerName" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="护理项目" required>
        <el-select v-model="form.itemId" filterable style="width: 100%">
          <el-option
            v-for="n in itemOptions"
            :key="n.itemId || n.id"
            :label="`${n.serialNumber || ''} ${n.nursingName}`.trim()"
            :value="n.itemId || n.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="护理时间">
        <el-date-picker
          v-model="form.nursingTime"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="次数"><el-input-number v-model="form.nursingCount" :min="1" /></el-form-item>
      <el-form-item label="护理内容"><el-input v-model="form.nursingContent" type="textarea" :rows="2" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import request from "@/utils/request";
import { formatDateTime } from "@/utils/date";
import { displayCustomerName } from "@/utils/customer";
import { useUserStore } from "@/stores/user";

const store = useUserStore();
const loading = ref(false);
const visible = ref(false);
const list = ref<any[]>([]);
const customers = ref<any[]>([]);
const itemOptions = ref<any[]>([]);
const filterCustomerId = ref<number>();
const page = ref(1);
const total = ref(0);
const form = reactive<any>({ nursingCount: 1 });

async function loadCustomers() {
  const pageData = await request.get("/customers", {
    params: { elderlyType: "all", residence: "all", page: 1, size: 200 },
  });
  customers.value = pageData.records;
}

async function load() {
  loading.value = true;
  try {
    const pageData = await request.get("/nurse/records", {
      params: {
        customerId: filterCustomerId.value || undefined,
        page: page.value,
        size: 10,
      },
    });
    list.value = pageData.records;
    total.value = pageData.total;
  } finally {
    loading.value = false;
  }
}

async function onCustomerChange(customerId?: number) {
  form.itemId = undefined;
  if (!customerId) {
    itemOptions.value = [];
    return;
  }
  const pageData = await request.get("/nurse/customer-items", { params: { customerId } });
  itemOptions.value = pageData.records.filter((r: any) => !r.isLevelTemplate);
}

function openDialog() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const nursingTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
  Object.assign(form, {
    customerId: filterCustomerId.value,
    itemId: undefined,
    nursingTime,
    nursingCount: 1,
    nursingContent: "",
    userId: (store.user as { id?: number })?.id,
  });
  if (form.customerId) onCustomerChange(form.customerId);
  visible.value = true;
}

async function save() {
  if (!form.customerId || !form.itemId) {
    ElMessage.warning("请选择老人与护理项目");
    return;
  }
  await request.post("/nurse/records", form);
  ElMessage.success("已保存");
  visible.value = false;
  load();
}

async function remove(id: number) {
  await ElMessageBox.confirm("确认删除该护理记录？");
  await request.delete(`/nurse/records/${id}`);
  ElMessage.success("已删除");
  load();
}

onMounted(async () => {
  await loadCustomers();
  load();
});
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
.mt {
  margin-top: 12px;
}
</style>
