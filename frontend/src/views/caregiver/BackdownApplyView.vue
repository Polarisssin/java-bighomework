<template>
  <el-row :gutter="16">
    <el-col :span="10">
      <el-card header="提交退住申请">
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
          <el-form-item label="原因"><el-input v-model="form.retreatreason" /></el-form-item>
          <el-button type="primary" :loading="saving" @click="submit">提交申请</el-button>
        </el-form>
      </el-card>
    </el-col>
    <el-col :span="14">
      <el-card header="我的退住申请">
        <el-table :data="myList" border size="small" v-loading="listLoading">
          <el-table-column prop="customerName" label="客户" width="90" />
          <el-table-column label="类型" width="100">
            <template #default="{ row }">{{ ["正常退住", "死亡退住", "保留床位"][row.retreattype] }}</template>
          </el-table-column>
          <el-table-column label="退住时间" width="100">
            <template #default="{ row }">{{ formatDate(row.retreatTime || row.retreattime) }}</template>
          </el-table-column>
          <el-table-column prop="retreatreason" label="原因" show-overflow-tooltip />
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
import { formatDate } from "@/utils/date";
import { useUserStore } from "@/stores/user";

const store = useUserStore();
const saving = ref(false);
const listLoading = ref(false);
const customers = ref<any[]>([]);
const myList = ref<any[]>([]);
const form = reactive<any>({ retreattype: 0 });

const myUserId = computed(() => (store.user as { id?: number })?.id);

function auditLabel(s: number) {
  return ["已提交", "通过", "拒绝"][s] ?? "-";
}

async function loadCustomers() {
  const page = await request.get("/customers", { params: { elderlyType: "all", residence: "active", page: 1, size: 100 } });
  customers.value = page.records;
}

async function loadMyList() {
  if (!myUserId.value) return;
  listLoading.value = true;
  try {
    const page = await request.get("/approval/backdown", { params: { submitUserId: myUserId.value } });
    myList.value = page.records;
  } finally {
    listLoading.value = false;
  }
}

async function submit() {
  if (!form.customerId || !form.retreattime) {
    ElMessage.warning("请填写客户和退住时间");
    return;
  }
  saving.value = true;
  try {
    await request.post("/approval/backdown", { ...form, submitUserId: myUserId.value });
    ElMessage.success("已提交，请等待管理员审核");
    Object.assign(form, { customerId: undefined, retreattype: 0, retreattime: "", retreatreason: "" });
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
