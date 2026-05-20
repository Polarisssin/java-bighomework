<template>
  <el-row :gutter="16">
    <el-col :span="7">
      <el-card header="我的老人" shadow="never">
        <el-table
          :data="elders"
          highlight-current-row
          size="small"
          v-loading="eldersLoading"
          @current-change="onSelectElder"
        >
          <el-table-column prop="customerName" label="姓名" />
          <el-table-column prop="todayRecordCount" label="今日" width="50" />
        </el-table>
      </el-card>
    </el-col>
    <el-col :span="17">
      <el-card shadow="never">
        <template #header>
          <div class="toolbar">
            <span v-if="plan?.customer">{{ plan.customer.customerName }} · 日常护理</span>
            <span v-else>请选择老人</span>
            <el-date-picker
              v-model="workDate"
              type="date"
              value-format="YYYY-MM-DD"
              size="small"
              :disabled="!customerId"
              @change="loadPlan"
            />
          </div>
        </template>
        <el-empty v-if="!customerId" description="请从左侧选择老人" />
        <template v-else>
          <el-descriptions :column="3" border size="small" class="mb">
            <el-descriptions-item label="类型">{{ plan?.customer?.levelId ? "护理" : "自理" }}</el-descriptions-item>
            <el-descriptions-item label="级别">{{ plan?.levelName || "-" }}</el-descriptions-item>
            <el-descriptions-item label="在院">{{ elderRow?.residenceStatus || "-" }}</el-descriptions-item>
          </el-descriptions>

          <el-divider content-position="left">已购护理项目（与管理员端客户护理设置同步）</el-divider>
          <el-table :data="plan?.items || []" border size="small" v-loading="planLoading" class="mb">
            <el-table-column prop="serialNumber" label="编号" width="80" />
            <el-table-column prop="nursingName" label="项目" />
            <el-table-column prop="executionCycle" label="周期" width="80" />
            <el-table-column prop="nurseNumber" label="购买次数" width="80" />
            <el-table-column prop="todayDoneCount" label="今日已做" width="80" />
            <el-table-column prop="serviceStatus" label="状态" width="88" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  :disabled="row.canExecute === false"
                  @click="openRecord(row)"
                >
                  登记
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!planLoading && !(plan?.items?.length)" description="请管理员在「客户护理设置」中为该老人购买护理项目" />

          <el-divider content-position="left">今日护理记录（同步至管理员「护理记录」）</el-divider>
          <el-table :data="plan?.todayRecords || []" border size="small">
            <el-table-column label="项目" min-width="120">
              <template #default="{ row }">{{ row.serialNumber }} {{ row.nursingName }}</template>
            </el-table-column>
            <el-table-column prop="nursingCount" label="次数" width="60" />
            <el-table-column label="时间" width="150">
              <template #default="{ row }">{{ formatDateTime(row.nursingTime) }}</template>
            </el-table-column>
            <el-table-column prop="nursingContent" label="内容" show-overflow-tooltip />
          </el-table>
        </template>
      </el-card>
    </el-col>
  </el-row>

  <el-dialog v-model="visible" title="登记日常护理" width="480px">
    <el-form :model="form" label-width="90px">
      <el-form-item label="项目">
        <el-input :model-value="form.nursingLabel" disabled />
      </el-form-item>
      <el-form-item label="时间">
        <el-date-picker v-model="form.nursingTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
      </el-form-item>
      <el-form-item label="次数"><el-input-number v-model="form.nursingCount" :min="1" /></el-form-item>
      <el-form-item label="内容"><el-input v-model="form.nursingContent" type="textarea" :rows="2" placeholder="护理情况说明" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="saveRecord">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import request from "@/utils/request";
import { confirmDanger } from "@/utils/confirm-danger";
import { nurseItemExecuteHint } from "@/utils/nurse-item";
import { UI_TEXT } from "@/constants/ui-text";
import { formatDateTime } from "@/utils/date";
import { useUserStore } from "@/stores/user";

const route = useRoute();
const store = useUserStore();
const myUserId = computed(() => (store.user as { id?: number })?.id);

const eldersLoading = ref(false);
const planLoading = ref(false);
const elders = ref<any[]>([]);
const elderRow = ref<any>();
const customerId = ref<number>();
const workDate = ref(new Date().toISOString().slice(0, 10));
const plan = ref<any>();
const visible = ref(false);
const form = reactive<any>({ nursingCount: 1 });

async function loadElders() {
  eldersLoading.value = true;
  try {
    const data = await request.get("/caregiver/elders-status");
    elders.value = data.records || [];
    const qid = route.query.customerId ? Number(route.query.customerId) : undefined;
    if (qid && elders.value.some((e) => e.id === qid)) {
      customerId.value = qid;
      elderRow.value = elders.value.find((e) => e.id === qid);
      loadPlan();
    }
  } finally {
    eldersLoading.value = false;
  }
}

async function loadPlan() {
  if (!customerId.value) return;
  planLoading.value = true;
  try {
    plan.value = await request.get("/caregiver/daily-plan", {
      params: { customerId: customerId.value, date: workDate.value },
    });
  } finally {
    planLoading.value = false;
  }
}

function onSelectElder(row: any) {
  if (!row) return;
  elderRow.value = row;
  customerId.value = row.id;
  loadPlan();
}

function openRecord(item: any) {
  const check = nurseItemExecuteHint(item);
  if (!check.ok) {
    ElMessage.warning(check.reason || "当前不可登记");
    return;
  }
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const nursingTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
  Object.assign(form, {
    customerId: customerId.value,
    itemId: item.itemId,
    nursingLabel: `${item.serialNumber || ""} ${item.nursingName}`.trim(),
    nursingTime,
    nursingCount: 1,
    nursingContent: "",
    userId: myUserId.value,
  });
  visible.value = true;
}

async function saveRecord() {
  await confirmDanger(UI_TEXT.confirmNurseRecord, "登记护理");
  await request.post("/nurse/records", {
    customerId: form.customerId,
    itemId: form.itemId,
    nursingTime: form.nursingTime,
    nursingCount: form.nursingCount,
    nursingContent: form.nursingContent,
    userId: form.userId,
  });
  ElMessage.success("护理记录已保存，管理员端可查看");
  visible.value = false;
  loadPlan();
  loadElders();
}

watch(
  () => route.query.customerId,
  (id) => {
    if (id) {
      customerId.value = Number(id);
      elderRow.value = elders.value.find((e) => e.id === customerId.value);
      loadPlan();
    }
  }
);

onMounted(loadElders);
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
