<template>
  <div class="organ-status-editor" :class="variant">
    <div class="editor-head">
      <span class="editor-title">器官隐患状态</span>
      <div class="legend">
        <span v-for="opt in ORGAN_STATUS_OPTIONS" :key="opt.value" class="legend-item">
          <i class="dot" :style="{ background: opt.color }" />
          {{ opt.label }}
        </span>
      </div>
    </div>
    <el-table :data="rows" border size="small" class="organ-table">
      <el-table-column prop="label" label="器官" width="72" />
      <el-table-column label="状态" min-width="150">
        <template #default="{ row }">
          <el-select v-model="local[row.key].status" size="small" @change="emitChange">
            <el-option
              v-for="opt in ORGAN_STATUS_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            >
              <span class="opt-row">
                <i class="dot" :style="{ background: opt.color }" />
                {{ opt.label }}
              </span>
            </el-option>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="140">
        <template #default="{ row }">
          <el-input
            v-model="local[row.key].note"
            size="small"
            placeholder="如：发现隐患 / 隐患已排除"
            @input="emitChange"
          />
        </template>
      </el-table-column>
    </el-table>
    <div v-if="showSave" class="actions">
      <el-button type="primary" :loading="saving" @click="save">保存器官状态</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { ORGAN_HOTSPOTS } from "@/config/organ-hotspots";
import request from "@/utils/request";
import {
  ORGAN_STATUS_OPTIONS,
  defaultOrganStatusMap,
  normalizeOrganStatusMap,
  type CustomerOrganStatusMap,
} from "@/lib/organ-status";

const props = withDefaults(
  defineProps<{
    customerId?: number;
    modelValue?: CustomerOrganStatusMap;
    showSave?: boolean;
    variant?: "light" | "dark";
  }>(),
  { showSave: true, variant: "light" }
);

const emit = defineEmits<{
  "update:modelValue": [CustomerOrganStatusMap];
  saved: [CustomerOrganStatusMap];
}>();

const local = ref<CustomerOrganStatusMap>(defaultOrganStatusMap());
const saving = ref(false);

const rows = computed(() =>
  ORGAN_HOTSPOTS.map((d) => ({ key: d.key, label: d.label }))
);

watch(
  () => props.modelValue,
  (v) => {
    if (v) local.value = normalizeOrganStatusMap(v);
  },
  { immediate: true, deep: true }
);

watch(
  () => props.customerId,
  (id) => {
    if (id) load(id);
  },
  { immediate: true }
);

function emitChange() {
  emit("update:modelValue", { ...local.value });
}

async function load(customerId: number) {
  try {
    const data = await request.get(`/customers/${customerId}/organ-status`);
    local.value = normalizeOrganStatusMap(data?.organs ?? data);
    emitChange();
  } catch {
    local.value = defaultOrganStatusMap();
    emitChange();
  }
}

async function save() {
  if (!props.customerId) {
    ElMessage.warning("请先保存老人信息后再编辑器官状态");
    return;
  }
  saving.value = true;
  try {
    const data = await request.put(`/customers/${props.customerId}/organ-status`, {
      organs: local.value,
    });
    local.value = normalizeOrganStatusMap(data?.organs ?? local.value);
    emitChange();
    emit("saved", local.value);
    ElMessage.success("器官状态已保存");
  } finally {
    saving.value = false;
  }
}

defineExpose({ load, save, local });
</script>

<style scoped>
.organ-status-editor {
  margin-top: 12px;
}

.editor-head {
  margin-bottom: 8px;
}

.editor-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
}

.organ-status-editor.light .editor-title {
  color: #303133;
}

.organ-status-editor.dark .editor-title {
  color: #e2e8f0;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  font-size: 11px;
}

.organ-status-editor.light .legend {
  color: #606266;
}

.organ-status-editor.dark .legend {
  color: #94a3b8;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.organ-table {
  width: 100%;
}

.organ-status-editor.dark .organ-table :deep(.el-table) {
  --el-table-bg-color: #0f172a;
  --el-table-tr-bg-color: #0f172a;
  --el-table-header-bg-color: #1e293b;
  --el-table-row-hover-bg-color: #1e293b;
  --el-table-text-color: #e2e8f0;
  --el-table-header-text-color: #cbd5e1;
  --el-table-border-color: #334155;
}

.opt-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.actions {
  margin-top: 10px;
  text-align: right;
}
</style>
