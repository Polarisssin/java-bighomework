<template>
  <el-card>
    <template #header>
      <div class="toolbar">
        <span>护理项目字典（全院共用目录，在此维护名称与单价）</span>
        <el-button type="primary" @click="open()">新增</el-button>
      </div>
    </template>
    <el-table :data="list" border v-loading="loading">
      <el-table-column prop="serialNumber" label="编号" width="100" />
      <el-table-column prop="nursingName" label="名称" />
      <el-table-column prop="servicePrice" label="价格" width="90" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">{{ row.status === 1 ? "启用" : "停用" }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button link @click="open(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
  <el-dialog v-model="visible" title="护理项目" width="520px">
    <el-form :model="form" label-width="90px">
      <el-form-item label="编号"><el-input v-model="form.serialNumber" /></el-form-item>
      <el-form-item label="名称"><el-input v-model="form.nursingName" /></el-form-item>
      <el-form-item label="价格"><el-input v-model="form.servicePrice" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status"><el-option :value="1" label="启用" /><el-option :value="2" label="停用" /></el-select>
      </el-form-item>
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
import { UI_TEXT } from "@/constants/ui-text";

const loading = ref(false);
const list = ref<any[]>([]);
const visible = ref(false);
const form = reactive<any>({ status: 1 });

async function load() {
  loading.value = true;
  const page = await request.get("/nurse/content", { params: { page: 1, size: 50 } });
  list.value = page.records;
  loading.value = false;
}

function open(row?: any) {
  Object.assign(form, { status: 1, ...row });
  visible.value = true;
}

async function save() {
  if (!form.nursingName || !form.serialNumber) {
    ElMessage.warning("请填写编号和名称");
    return;
  }
  try {
    if (form.id) await request.put(`/nurse/content/${form.id}`, form);
    else await request.post("/nurse/content", form);
    ElMessage.success("保存成功");
    visible.value = false;
    load();
  } catch {
    /* handled by interceptor */
  }
}

async function remove(id: number) {
  await ElMessageBox.confirm(UI_TEXT.confirmDeleteNurseContent, "删除护理项目", { type: "warning" });
  await request.delete(`/nurse/content/${id}`);
  load();
}

onMounted(load);
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
}
</style>
