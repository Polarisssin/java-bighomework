<template>
  <el-card>
    <template #header>
      <div class="toolbar">
        <span>护理级别模板（定义各级别应含哪些项目，不直接改老人数据）</span>
        <el-button type="primary" @click="openAddLevel">新增级别</el-button>
      </div>
    </template>
    <el-table :data="list" border v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="levelName" label="级别名称" />
      <el-table-column prop="levelStatus" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.levelStatus === 1 ? 'success' : 'info'" size="small">
            {{ row.levelStatus === 1 ? "启用" : "停用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="含项目数" width="100">
        <template #default="{ row }">{{ effectiveCount[row.id] ?? "-" }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="openItems(row)">配置项目</el-button>
          <el-button link @click="toggleStatus(row)">
            {{ row.levelStatus === 1 ? "停用" : "启用" }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="levelVisible" :title="levelForm.id ? '编辑级别' : '新增级别'" width="400px">
    <el-form label-width="80px">
      <el-form-item label="名称" required>
        <el-input v-model="levelForm.levelName" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="levelVisible = false">取消</el-button>
      <el-button type="primary" :loading="levelSaving" @click="saveLevel">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="itemVisible" :title="`配置护理项目 - ${currentLevel?.levelName}`" width="640px">
    <el-alert
      v-if="prevIds.length"
      type="info"
      :closable="false"
      class="mb"
      :title="`上一级（${currentLevel?.id ? currentLevel.id - 1 : ''}级）项目须全部勾选，保存时将先清空本级再写入`"
    />
    <el-checkbox-group v-model="selectedIds">
      <el-checkbox
        v-for="item in allItems"
        :key="item.id"
        :label="item.id"
        :disabled="prevIds.includes(item.id)"
        style="display: block; margin: 6px 0"
      >
        {{ item.serialNumber }} · {{ item.nursingName }}
        <el-tag v-if="prevIds.includes(item.id)" size="small" type="info">上级必选</el-tag>
      </el-checkbox>
    </el-checkbox-group>
    <template #footer>
      <el-button @click="itemVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="saveItems">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import request from "@/utils/request";

const loading = ref(false);
const saving = ref(false);
const levelSaving = ref(false);
const list = ref<any[]>([]);
const effectiveCount = reactive<Record<number, number>>({});
const itemVisible = ref(false);
const levelVisible = ref(false);
const levelForm = reactive<{ id?: number; levelName: string }>({ levelName: "" });
const currentLevel = ref<any>();
const allItems = ref<any[]>([]);
const selectedIds = ref<number[]>([]);
const prevIds = ref<number[]>([]);

async function load() {
  loading.value = true;
  try {
    const page = await request.get("/nurse/level", { params: { page: 1, size: 20, status: "" } });
    list.value = page.records;
    for (const lv of list.value) {
      const detail = await request.get(`/nurse/level/${lv.id}/items`);
      effectiveCount[lv.id] = detail.effectiveItemIds?.length ?? 0;
    }
  } finally {
    loading.value = false;
  }
}

function openAddLevel() {
  levelForm.id = undefined;
  levelForm.levelName = "";
  levelVisible.value = true;
}

async function saveLevel() {
  if (!levelForm.levelName.trim()) {
    ElMessage.warning("请输入级别名称");
    return;
  }
  levelSaving.value = true;
  try {
    if (levelForm.id) {
      await request.put(`/nurse/level/${levelForm.id}`, { levelName: levelForm.levelName });
    } else {
      await request.post("/nurse/level", { levelName: levelForm.levelName, levelStatus: 1 });
    }
    ElMessage.success("已保存");
    levelVisible.value = false;
    load();
  } finally {
    levelSaving.value = false;
  }
}

async function toggleStatus(row: any) {
  const next = row.levelStatus === 1 ? 2 : 1;
  await ElMessageBox.confirm(
    next === 1 ? `确认启用级别「${row.levelName}」？` : `确认停用级别「${row.levelName}」？`,
    "级别状态",
    { type: "warning" }
  );
  await request.put(`/nurse/level/${row.id}`, { levelStatus: next });
  ElMessage.success(next === 1 ? "已启用" : "已停用");
  load();
}

async function openItems(row: any) {
  currentLevel.value = row;
  const detail = await request.get(`/nurse/level/${row.id}/items`);
  allItems.value = detail.items || [];
  prevIds.value = detail.prevLevelItemIds || [];
  selectedIds.value = [...(detail.effectiveItemIds || [])];
  itemVisible.value = true;
}

async function saveItems() {
  const missing = prevIds.value.filter((id) => !selectedIds.value.includes(id));
  if (missing.length) {
    ElMessage.warning("请保留上一级全部护理项目");
    return;
  }
  await ElMessageBox.confirm(
    `确认保存级别「${currentLevel.value?.levelName}」的护理项目配置？将先清空本级再写入。`,
    "保存配置",
    { type: "warning" }
  );
  saving.value = true;
  try {
    await request.put(`/nurse/level/${currentLevel.value.id}/items`, { itemIds: selectedIds.value });
    ElMessage.success("已保存（已先清空本级再写入）");
    itemVisible.value = false;
    load();
  } finally {
    saving.value = false;
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
.mb {
  margin-bottom: 12px;
}
</style>
