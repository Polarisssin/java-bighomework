<template>
  <el-card>
    <template #header>床位示意图</template>
    <el-row :gutter="16" class="stats">
      <el-col :span="6"><el-statistic title="总床位" :value="stats.total" /></el-col>
      <el-col :span="6"><el-statistic title="空闲" :value="stats.free" /></el-col>
      <el-col :span="6"><el-statistic title="有人" :value="stats.occupied" /></el-col>
      <el-col :span="6"><el-statistic title="外出" :value="stats.out" /></el-col>
    </el-row>
    <el-form :inline="true" class="mt">
      <el-form-item label="楼层">
        <el-select v-model="floor" @change="load">
          <el-option v-for="f in floors" :key="f" :label="f + 'F'" :value="f" />
        </el-select>
      </el-form-item>
    </el-form>
    <el-row :gutter="12">
      <el-col v-for="item in diagram" :key="item.room.id" :span="8" class="mb">
        <el-card shadow="hover">
          <template #header>房间 {{ item.room.roomNo }}</template>
          <el-tag
            v-for="bed in item.beds"
            :key="bed.id"
            :type="bedTag(bed.bedStatus)"
            class="bed-tag"
          >
            ID{{ bed.id }} · {{ bed.roomNo }}-{{ bed.bedNo }} · {{ bedLabel(bed.bedStatus) }}
          </el-tag>
        </el-card>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import request from "@/utils/request";

const stats = reactive({ total: 0, free: 0, occupied: 0, out: 0 });
const floor = ref("1");
const floors = ["1", "2", "3"];
const diagram = ref<any[]>([]);

function bedStatus(s: unknown) {
  return Number(s);
}
function bedLabel(s: unknown) {
  const n = bedStatus(s);
  return n === 1 ? "空闲" : n === 2 ? "有人" : "外出";
}
function bedTag(s: unknown) {
  const n = bedStatus(s);
  return n === 1 ? "success" : n === 2 ? "danger" : "warning";
}

async function loadStats() {
  try {
    Object.assign(stats, await request.get("/beds/statistics"));
  } catch {
    Object.assign(stats, { total: 0, free: 0, occupied: 0, out: 0 });
  }
}

async function load() {
  try {
    diagram.value = await request.get("/beds/diagram", { params: { floor: floor.value } });
  } catch (e: any) {
    diagram.value = [];
    const msg = e?.message || e?.response?.data?.message;
    if (msg) console.error("beds/diagram", msg);
  }
}

onMounted(async () => {
  await loadStats();
  await load();
});
</script>

<style scoped>
.stats {
  margin-bottom: 8px;
}
.mt {
  margin-top: 12px;
}
.mb {
  margin-bottom: 12px;
}
.bed-tag {
  margin: 4px 6px 4px 0;
}
</style>
