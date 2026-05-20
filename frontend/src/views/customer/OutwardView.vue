<template>
  <el-card>
    <template #header>
      <div class="toolbar">
        <span>外出登记</span>
        <el-button type="primary" @click="openDialog">新增外出登记</el-button>
      </div>
    </template>
    <el-table :data="list" border stripe v-loading="loading">
      <el-table-column label="客户" min-width="100">
        <template #default="{ row }">{{ displayCustomerName(row) }}</template>
      </el-table-column>
      <el-table-column prop="outgoingreason" label="事由" />
      <el-table-column label="外出时间" width="120">
        <template #default="{ row }">{{ formatDate(row.outgoingtime) }}</template>
      </el-table-column>
      <el-table-column label="预计回院" width="120">
        <template #default="{ row }">{{ formatDate(row.expectedreturntime) }}</template>
      </el-table-column>
      <el-table-column prop="auditstatus" label="状态" width="90">
        <template #default="{ row }">{{ ["已提交", "通过", "拒绝"][row.auditstatus] ?? "-" }}</template>
      </el-table-column>
      <el-table-column prop="auditperson" label="审批人" width="90" />
      <el-table-column label="审批时间" width="160">
        <template #default="{ row }">{{ row.audittime || row.auditTime || "-" }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <template v-if="row.auditstatus === 0">
            <el-button link type="success" @click="audit(row.id, true)">通过</el-button>
            <el-button link type="danger" @click="audit(row.id, false)">拒绝</el-button>
          </template>
          <el-tag v-else type="info" size="small">已审批</el-tag>
          <el-button
            v-if="row.auditstatus === 1 && !row.actualreturntime"
            link
            type="primary"
            @click="registerReturn(row)"
          >
            登记回院
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="visible" title="新增外出登记" width="520px" @closed="resetForm">
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
      <el-form-item label="外出事由" required>
        <el-input v-model="form.outgoingreason" placeholder="如：家属接回过节" />
      </el-form-item>
      <el-form-item label="外出时间" required>
        <el-date-picker v-model="form.outgoingtime" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item label="预计回院" required>
        <el-date-picker
          v-model="form.expectedreturntime"
          type="date"
          value-format="YYYY-MM-DD"
          style="width: 100%"
          :disabled-date="disableBeforeOutgoing"
        />
      </el-form-item>
      <el-form-item label="陪同人"><el-input v-model="form.escorted" /></el-form-item>
      <el-form-item label="与老人关系"><el-input v-model="form.relation" /></el-form-item>
      <el-form-item label="陪同人电话"><el-input v-model="form.escortedtel" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import request from "@/utils/request";
import { formatDate } from "@/utils/date";
import { displayCustomerName } from "@/utils/customer";
import { UI_TEXT } from "@/constants/ui-text";

const loading = ref(false);
const saving = ref(false);
const visible = ref(false);
const list = ref<any[]>([]);
const customers = ref<any[]>([]);

const form = reactive<any>({
  customerId: undefined,
  outgoingreason: "",
  outgoingtime: "",
  expectedreturntime: "",
  escorted: "",
  relation: "",
  escortedtel: "",
});

async function loadCustomers() {
  const page = await request.get("/customers", { params: { elderlyType: "all", residence: "active", page: 1, size: 100 } });
  customers.value = page.records;
}

async function load() {
  loading.value = true;
  try {
    const page = await request.get("/approval/outward", { params: { page: 1, size: 50 } });
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
    outgoingreason: "",
    outgoingtime: "",
    expectedreturntime: "",
    escorted: "",
    relation: "",
    escortedtel: "",
  });
}

function disableBeforeOutgoing(date: Date) {
  if (!form.outgoingtime) return false;
  return date.getTime() < new Date(form.outgoingtime).getTime();
}

async function submit() {
  if (!form.customerId || !form.outgoingreason || !form.outgoingtime || !form.expectedreturntime) {
    ElMessage.warning("请填写客户、事由和日期");
    return;
  }
  if (form.expectedreturntime < form.outgoingtime) {
    ElMessage.warning("预计回院不能早于外出时间");
    return;
  }
  saving.value = true;
  try {
    await request.post("/approval/outward", { ...form });
    ElMessage.success("外出登记已提交，待审核");
    visible.value = false;
    load();
  } finally {
    saving.value = false;
  }
}

async function audit(id: number, pass: boolean) {
  await ElMessageBox.confirm(
    pass ? UI_TEXT.confirmAuditPass : UI_TEXT.confirmAuditReject,
    "审批确认",
    { type: "warning" }
  );
  await request.put(`/approval/outward/${id}/audit`, null, { params: { pass } });
  ElMessage.success(pass ? "已通过" : "已拒绝");
  load();
}

async function registerReturn(row: any) {
  const today = new Date().toISOString().slice(0, 10);
  await ElMessageBox.confirm(`确认为 ${displayCustomerName(row)} 登记今日回院？`, "登记回院");
  await request.put(`/approval/outward/${row.id}/return`, null, { params: { actualReturnTime: today } });
  ElMessage.success("已登记回院");
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
