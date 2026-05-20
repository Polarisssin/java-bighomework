<template>
  <el-card>
    <template #header>
      <div class="toolbar">
        <span>退住登记</span>
        <el-button type="primary" @click="openDialog">新增退住登记</el-button>
      </div>
    </template>
    <el-table :data="list" border stripe v-loading="loading">
      <el-table-column label="客户" min-width="100">
        <template #default="{ row }">{{ displayCustomerName(row) }}</template>
      </el-table-column>
      <el-table-column prop="retreattype" label="类型" width="110">
        <template #default="{ row }">{{ ["正常退住", "死亡退住", "保留床位"][row.retreattype] ?? "-" }}</template>
      </el-table-column>
      <el-table-column label="退住时间" width="120">
        <template #default="{ row }">{{ formatDate(row.retreatTime || row.retreattime) }}</template>
      </el-table-column>
      <el-table-column prop="retreatreason" label="原因" />
      <el-table-column prop="auditstatus" label="状态" width="90">
        <template #default="{ row }">{{ ["已提交", "通过", "拒绝"][row.auditstatus] ?? "-" }}</template>
      </el-table-column>
      <el-table-column prop="auditperson" label="审批人" width="90" />
      <el-table-column label="审批时间" width="160">
        <template #default="{ row }">{{ row.audittime || row.auditTime || "-" }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button v-if="row.auditstatus === 0" link type="success" @click="audit(row.id, true)">通过</el-button>
          <el-button v-if="row.auditstatus === 0" link type="danger" @click="audit(row.id, false)">拒绝</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="visible" title="新增退住登记" width="520px" @closed="resetForm">
    <el-form :model="form" label-width="100px">
      <el-form-item label="客户" required>
        <el-select v-model="form.customerId" filterable placeholder="选择老人" style="width: 100%">
          <el-option
            v-for="c in customers"
            :key="c.id"
            :label="`${c.customerName}（${c.roomNo}房）`"
            :value="c.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="退住类型" required>
        <el-select v-model="form.retreattype" style="width: 100%">
          <el-option :value="0" label="正常退住" />
          <el-option :value="1" label="死亡退住" />
          <el-option :value="2" label="保留床位" />
        </el-select>
      </el-form-item>
      <el-form-item label="退住时间" required>
        <el-date-picker v-model="form.retreattime" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item label="退住原因">
        <el-input v-model="form.retreatreason" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import request from "@/utils/request";
import { formatDate } from "@/utils/date";
import { displayCustomerName } from "@/utils/customer";

const loading = ref(false);
const saving = ref(false);
const visible = ref(false);
const list = ref<any[]>([]);
const customers = ref<any[]>([]);

const form = reactive<any>({
  customerId: undefined,
  retreattype: 0,
  retreattime: "",
  retreatreason: "",
});

async function loadCustomers() {
  const page = await request.get("/customers", { params: { elderlyType: "all", residence: "active", page: 1, size: 100 } });
  customers.value = page.records;
}

async function load() {
  loading.value = true;
  try {
    const page = await request.get("/approval/backdown", { params: { page: 1, size: 50 } });
    list.value = page.records;
  } finally {
    loading.value = false;
  }
}

function openDialog() {
  resetForm();
  visible.value = true;
}

function resetForm() {
  Object.assign(form, {
    customerId: undefined,
    retreattype: 0,
    retreattime: "",
    retreatreason: "",
  });
}

async function submit() {
  if (!form.customerId || !form.retreattime) {
    ElMessage.warning("请填写客户和退住时间");
    return;
  }
  saving.value = true;
  try {
    await request.post("/approval/backdown", { ...form });
    ElMessage.success("退住登记已提交，待审核");
    visible.value = false;
    load();
  } finally {
    saving.value = false;
  }
}

async function audit(id: number, pass: boolean) {
  await request.put(`/approval/backdown/${id}/audit`, null, { params: { pass } });
  ElMessage.success(pass ? "已通过" : "已拒绝");
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
  align-items: center;
  justify-content: space-between;
}
</style>
