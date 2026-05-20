<template>
  <el-card>
    <template #header>客户护理设置（购买与级别）</template>
    <el-alert type="info" :closable="false" show-icon class="mb">
      <template #title>本页负责：为老人设置护理级别、购买/改期/删除护理项目</template>
      <p class="hint">
        流程：① 选择老人 → ② 应用护理级别（仅更新级别，下方会显示该级别应含项目）
        → ③ 点「批量购买级别项目」或单独「购买护理项目」。到期续费请到「服务关注」；日常执行请到「护理记录」。
      </p>
    </el-alert>
    <el-form :inline="true" class="mb">
      <el-form-item label="选择老人">
        <el-select v-model="customerId" filterable placeholder="选择客户" style="width: 220px" @change="loadItems">
          <el-option
            v-for="c in customers"
            :key="c.id"
            :label="`${c.customerName}（ID${c.id} · ${c.roomNo}房 · ${c.levelId ? '护理' : '自理'}）`"
            :value="c.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="护理级别">
        <el-select
          v-model="levelId"
          clearable
          placeholder="选择级别"
          style="width: 140px"
          :disabled="!customerId"
        >
          <el-option v-for="l in levels" :key="l.id" :label="l.levelName" :value="l.id" />
        </el-select>
      </el-form-item>
      <el-button type="warning" :disabled="!customerId" @click="applyLevel">应用级别</el-button>
      <el-button type="primary" :disabled="!customerId" @click="openAdd">购买护理项目</el-button>
      <el-button type="success" :disabled="!customerId || !levelId" @click="batchPurchase">批量购买级别项目</el-button>
      <el-button type="danger" :disabled="!customerId || !levelId" plain @click="removeLevel">移除护理级别</el-button>
    </el-form>

    <el-table v-if="customerId" :data="items" border v-loading="loading">
      <el-table-column prop="id" label="记录ID" width="80">
        <template #default="{ row }">{{ row.id ?? "-" }}</template>
      </el-table-column>
      <el-table-column prop="serialNumber" label="编号" width="90" />
      <el-table-column prop="nursingName" label="项目名称">
        <template #default="{ row }">
          {{ row.nursingName }}
          <el-tag v-if="row.isExtraPurchase" type="warning" size="small" class="ml">加购</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="次数" width="70">
        <template #default="{ row }">{{ row.nurseNumber ?? "-" }}</template>
      </el-table-column>
      <el-table-column label="购买日期" width="110">
        <template #default="{ row }">{{ formatDate(row.buyTime) || "-" }}</template>
      </el-table-column>
      <el-table-column label="到期日期" width="110">
        <template #default="{ row }">{{ formatDate(row.maturityTime) || "-" }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <template v-if="!row.isLevelTemplate">
            <el-button link @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row.id)">删除</el-button>
          </template>
          <el-tag v-else type="info" size="small">级别包含·待购买</el-tag>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-else description="请先选择老人" />
  </el-card>

  <el-card v-if="customerId" class="organ-card">
    <template #header>
      <span>器官隐患状态</span>
      <span v-if="selectedCustomer" class="sub">（{{ selectedCustomer.customerName }}）</span>
    </template>
    <OrganStatusEditor :customer-id="customerId" />
  </el-card>

  <el-dialog v-model="visible" :title="form.id ? '编辑项目' : '购买护理项目'" width="480px">
    <el-form :model="form" label-width="100px">
      <el-form-item label="护理项目" required>
        <el-select v-model="form.itemId" style="width: 100%">
          <el-option
            v-for="n in purchasableContents.length ? purchasableContents : nurseContents"
            :key="n.id"
            :label="`${n.serialNumber} ${n.nursingName}`"
            :value="n.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="次数"><el-input-number v-model="form.nurseNumber" :min="1" /></el-form-item>
      <el-form-item label="购买日期">
        <el-date-picker v-model="form.buyTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item label="到期日期">
        <el-date-picker
          v-model="form.maturityTime"
          type="date"
          value-format="YYYY-MM-DD"
          style="width: 100%"
          :disabled-date="disableBeforeBuy"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="saveItem">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import OrganStatusEditor from "@/components/customer/OrganStatusEditor.vue";
import request from "@/utils/request";
import { formatDate } from "@/utils/date";

const loading = ref(false);
const customers = ref<any[]>([]);
const levels = ref<any[]>([]);
const nurseContents = ref<any[]>([]);
const items = ref<any[]>([]);
const customerId = ref<number>();
const levelId = ref<number>();
const visible = ref(false);
const form = reactive<any>({ nurseNumber: 1 });

const selectedCustomer = computed(() => customers.value.find((x) => x.id === customerId.value));

const purchasableContents = computed(() => {
  const owned = new Set(
    items.value.filter((i) => i.id && !i.isLevelTemplate).map((i: any) => i.itemId)
  );
  return nurseContents.value.filter((n) => !owned.has(n.id));
});

function disableBeforeBuy(date: Date) {
  if (!form.buyTime) return false;
  return date.getTime() < new Date(form.buyTime).getTime();
}

async function loadBase() {
  const [cp, lp, np] = await Promise.all([
    request.get("/customers", { params: { elderlyType: "all", residence: "active", page: 1, size: 200 } }),
    request.get("/nurse/level", { params: { page: 1, size: 20, status: "" } }),
    request.get("/nurse/content", { params: { page: 1, size: 50, status: "" } }),
  ]);
  customers.value = cp.records;
  levels.value = lp.records;
  nurseContents.value = np.records;
}

async function loadItems() {
  if (!customerId.value) return;
  loading.value = true;
  try {
    const page = await request.get("/nurse/customer-items", { params: { customerId: customerId.value } });
    items.value = page.records;
    const c = customers.value.find((x) => x.id === customerId.value);
    levelId.value = c?.levelId ?? undefined;
  } finally {
    loading.value = false;
  }
}

async function applyLevel() {
  if (!customerId.value) return;
  const c = customers.value.find((x) => x.id === customerId.value);
  const prev = c?.levelId ?? null;
  const next = levelId.value ?? null;
  if (prev === next) {
    ElMessage.info("护理级别未变化");
    return;
  }
  const msg = next
    ? "将更新护理级别；若更换级别，原级别下已购项目会作废。更新后请再点「批量购买级别项目」完成购买。"
    : "将清除护理级别（请用「移除护理级别」若需同时删除已购项目）";
  await ElMessageBox.confirm(msg, "应用护理级别", { type: "warning" });
  await request.put(`/nurse/customer/${customerId.value}/level`, { levelId: next });
  if (c) c.levelId = next ?? undefined;
  ElMessage.success("护理级别已更新，请按需批量或单独购买项目");
  loadItems();
}

function openAdd() {
  const c = selectedCustomer.value;
  const today = new Date().toISOString().slice(0, 10);
  const maturity = formatDate(c?.expirationDate) || today;
  Object.assign(form, {
    id: undefined,
    customerId: customerId.value,
    itemId: undefined,
    nurseNumber: 1,
    buyTime: today,
    maturityTime: maturity >= today ? maturity : today,
  });
  visible.value = true;
}

function openEdit(row: any) {
  Object.assign(form, {
    ...row,
    buyTime: formatDate(row.buyTime) || undefined,
    maturityTime: formatDate(row.maturityTime) || undefined,
  });
  visible.value = true;
}

async function saveItem() {
  if (!form.itemId) {
    ElMessage.warning("请选择护理项目");
    return;
  }
  if (form.buyTime && form.maturityTime && form.maturityTime < form.buyTime) {
    ElMessage.warning("到期日期不能早于购买日期");
    return;
  }
  const payload = { ...form, customerId: customerId.value, levelId: levelId.value };
  if (form.id) await request.put(`/nurse/customer-items/${form.id}`, payload);
  else await request.post("/nurse/customer-items", payload);
  ElMessage.success("保存成功");
  visible.value = false;
  loadItems();
}

async function remove(id: number) {
  await ElMessageBox.confirm("确认删除该护理项目？");
  await request.delete(`/nurse/customer-items/${id}`);
  ElMessage.success("已删除");
  loadItems();
}

async function removeLevel() {
  if (!customerId.value) return;
  await ElMessageBox.confirm("移除护理级别将同时删除该级别下已购项目，是否继续？", "移除级别");
  await request.delete(`/nurse/customer/${customerId.value}/level`);
  levelId.value = undefined;
  const c = customers.value.find((x) => x.id === customerId.value);
  if (c) c.levelId = undefined;
  ElMessage.success("已移除护理级别");
  loadItems();
}

async function batchPurchase() {
  if (!customerId.value) return;
  const res = await request.post(`/nurse/customer/${customerId.value}/level-items-batch`);
  ElMessage.success(res.message || "批量购买完成");
  loadItems();
}

onMounted(loadBase);
</script>

<style scoped>
.mb {
  margin-bottom: 12px;
}

.hint {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.5;
}

.organ-card {
  margin-top: 12px;
}

.organ-card .sub {
  margin-left: 8px;
  font-size: 13px;
  color: #909399;
  font-weight: normal;
}
.ml {
  margin-left: 6px;
}
</style>
