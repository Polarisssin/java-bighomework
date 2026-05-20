<template>
  <el-card>
    <template #header>
      <div class="toolbar">
        <span>护理记录（我的老人）</span>
        <el-button type="primary" @click="openDialog">登记护理</el-button>
      </div>
    </template>
    <el-table :data="list" border stripe v-loading="loading" size="small">
      <el-table-column label="老人" width="90">
        <template #default="{ row }">{{ displayCustomerName(row) }}</template>
      </el-table-column>
      <el-table-column label="项目" min-width="120">
        <template #default="{ row }">{{ row.serialNumber }} {{ row.nursingName }}</template>
      </el-table-column>
      <el-table-column prop="nursingCount" label="次数" width="60" />
      <el-table-column label="时间" width="150">
        <template #default="{ row }">{{ formatDateTime(row.nursingTime) }}</template>
      </el-table-column>
      <el-table-column prop="nursingContent" label="内容" show-overflow-tooltip />
    </el-table>
  </el-card>

  <el-dialog v-model="visible" title="登记护理" width="500px">
    <el-form :model="form" label-width="90px">
      <el-form-item label="老人" required>
        <el-select v-model="form.customerId" filterable style="width: 100%" @change="onCustomerChange">
          <el-option v-for="c in myElders" :key="c.id" :label="c.customerName" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="项目" required>
        <el-select v-model="form.itemId" filterable style="width: 100%">
          <el-option
            v-for="n in itemOptions"
            :key="n.itemId || n.id"
            :label="`${n.serialNumber || ''} ${n.nursingName}`.trim()"
            :value="n.itemId || n.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="时间">
        <el-date-picker v-model="form.nursingTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
      </el-form-item>
      <el-form-item label="次数"><el-input-number v-model="form.nursingCount" :min="1" /></el-form-item>
      <el-form-item label="内容"><el-input v-model="form.nursingContent" type="textarea" :rows="2" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import request from "@/utils/request";
import { confirmDanger } from "@/utils/confirm-danger";
import { nurseItemExecuteHint } from "@/utils/nurse-item";
import { UI_TEXT } from "@/constants/ui-text";
import { formatDateTime } from "@/utils/date";
import { displayCustomerName } from "@/utils/customer";
import { useUserStore } from "@/stores/user";

const store = useUserStore();
const myUserId = computed(() => (store.user as { id?: number })?.id);
const loading = ref(false);
const visible = ref(false);
const list = ref<any[]>([]);
const myElders = ref<any[]>([]);
const itemOptions = ref<any[]>([]);
const form = reactive<any>({ nursingCount: 1 });

async function loadElders() {
  const data = await request.get("/caregiver/elders-status");
  myElders.value = data.records || [];
}

async function load() {
  if (!myUserId.value) return;
  loading.value = true;
  try {
    const page = await request.get("/nurse/records", {
      params: { caregiverUserId: myUserId.value, page: 1, size: 50 },
    });
    list.value = page.records;
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
  const page = await request.get("/nurse/customer-items", { params: { customerId } });
  itemOptions.value = page.records.filter((r: any) => {
    if (r.isLevelTemplate || !r.id) return false;
    return nurseItemExecuteHint(r).ok;
  });
}

function openDialog() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const nursingTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
  Object.assign(form, {
    customerId: undefined,
    itemId: undefined,
    nursingTime,
    nursingCount: 1,
    nursingContent: "",
    userId: myUserId.value,
  });
  visible.value = true;
}

async function save() {
  if (!form.customerId || !form.itemId) {
    ElMessage.warning("请选择老人与护理项目");
    return;
  }
  const item = itemOptions.value.find((n) => (n.itemId || n.id) === form.itemId);
  const check = item ? nurseItemExecuteHint(item) : { ok: false, reason: "项目不可用" };
  if (!check.ok) {
    ElMessage.warning(check.reason || "当前不可登记");
    return;
  }
  await confirmDanger(UI_TEXT.confirmNurseRecord, "登记护理");
  await request.post("/nurse/records", form);
  ElMessage.success("已登记");
  visible.value = false;
  load();
}

onMounted(async () => {
  await loadElders();
  load();
});
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
