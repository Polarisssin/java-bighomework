<template>
  <el-row :gutter="16">
    <el-col :span="10">
      <el-card header="提交外出申请">
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
          <el-form-item label="外出事由" required><el-input v-model="form.outgoingreason" /></el-form-item>
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
          <el-button type="primary" :loading="saving" @click="submit">提交申请</el-button>
        </el-form>
      </el-card>
    </el-col>
    <el-col :span="14">
      <el-card header="我的外出申请">
        <el-table :data="myList" border size="small" v-loading="listLoading">
          <el-table-column prop="customerName" label="客户" width="90" />
          <el-table-column prop="outgoingreason" label="事由" show-overflow-tooltip />
          <el-table-column prop="outgoingtime" label="外出" width="100" />
          <el-table-column prop="expectedreturntime" label="预计回院" width="100" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">{{ auditLabel(row.auditstatus) }}</template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import request from "@/utils/request";
import { useUserStore } from "@/stores/user";

const store = useUserStore();
const saving = ref(false);
const listLoading = ref(false);
const customers = ref<any[]>([]);
const myList = ref<any[]>([]);
const form = reactive<any>({});

const myUserId = computed(() => (store.user as { id?: number })?.id);

function auditLabel(s: number) {
  return ["已提交", "通过", "拒绝"][s] ?? "-";
}

function disableBeforeOutgoing(date: Date) {
  if (!form.outgoingtime) return false;
  return date.getTime() < new Date(form.outgoingtime).getTime();
}

async function loadCustomers() {
  const page = await request.get("/customers", { params: { elderlyType: "all", residence: "active", page: 1, size: 100 } });
  customers.value = page.records;
}

async function loadMyList() {
  if (!myUserId.value) return;
  listLoading.value = true;
  try {
    const page = await request.get("/approval/outward", { params: { submitUserId: myUserId.value } });
    myList.value = page.records;
  } finally {
    listLoading.value = false;
  }
}

async function submit() {
  if (!form.customerId || !form.outgoingreason || !form.outgoingtime || !form.expectedreturntime) {
    ElMessage.warning("请填写完整信息");
    return;
  }
  if (form.expectedreturntime < form.outgoingtime) {
    ElMessage.warning("预计回院不能早于外出时间");
    return;
  }
  saving.value = true;
  try {
    await request.post("/approval/outward", { ...form, submitUserId: myUserId.value });
    ElMessage.success("已提交，请等待管理员审核");
    Object.assign(form, { customerId: undefined, outgoingreason: "", outgoingtime: "", expectedreturntime: "" });
    loadMyList();
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await loadCustomers();
  loadMyList();
});
</script>
