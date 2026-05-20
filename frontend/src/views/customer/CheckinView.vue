<template>
  <el-card>
    <template #header>
      <div class="toolbar">
        <span>入住登记</span>
        <el-button type="primary" @click="openDialog()">新增入住</el-button>
      </div>
    </template>
    <el-form :inline="true" :model="query" class="mb">
      <el-form-item label="姓名">
        <el-input v-model="query.name" clearable placeholder="模糊查询" />
      </el-form-item>
      <el-form-item label="入住状态">
        <el-select v-model="query.residence" style="width: 120px" @change="onFilterChange">
          <el-option label="在住" value="active" />
          <el-option label="已退住" value="retreated" />
          <el-option label="全部" value="all" />
        </el-select>
      </el-form-item>
      <el-form-item label="老人类型">
        <el-select v-model="query.elderlyType" style="width: 140px" @change="onFilterChange">
          <el-option label="全部" value="all" />
          <el-option label="自理老人" value="self" />
          <el-option label="护理老人" value="nursing" />
        </el-select>
      </el-form-item>
    </el-form>
    <el-table
      :data="tableData"
      border
      stripe
      v-loading="loading"
      :default-sort="{ prop: 'id', order: 'descending' }"
    >
      <el-table-column prop="id" label="老人 ID" width="80" sortable />
      <el-table-column prop="customerName" label="姓名" min-width="90" />
      <el-table-column label="入住状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.residentStatus === 2 ? 'info' : 'success'" size="small">
            {{ row.residentStatus === 2 ? "已退住" : "在住" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="customerAge" label="年龄" width="70" />
      <el-table-column prop="customerSex" label="性别" width="70">
        <template #default="{ row }">{{ row.customerSex === 0 ? "男" : "女" }}</template>
      </el-table-column>
      <el-table-column prop="bedId" label="床位 ID" width="80">
        <template #default="{ row }">{{ row.bedId ?? "-" }}</template>
      </el-table-column>
      <el-table-column label="床位" width="100">
        <template #default="{ row }">{{ bedLabelOf(row) }}</template>
      </el-table-column>
      <el-table-column prop="roomNo" label="房间" width="80" />
      <el-table-column label="类型" width="90">
        <template #default="{ row }">{{ row.levelId ? "护理" : "自理" }}</template>
      </el-table-column>
      <el-table-column prop="buildingNo" label="楼栋" width="80" />
      <el-table-column label="入住时间" width="110">
        <template #default="{ row }">{{ formatDate(row.checkinDate) }}</template>
      </el-table-column>
      <el-table-column label="合同到期" width="110">
        <template #default="{ row }">{{ formatDate(row.expirationDate) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="success" @click="openBodyDetail(row)">身体详情</el-button>
          <el-button link type="primary" @click="openDialog(row)">
            {{ row.residentStatus === 2 ? "查看" : "编辑" }}
          </el-button>
          <el-button
            v-if="row.residentStatus !== 2"
            link
            type="warning"
            @click="onRetreat(row)"
          >
            退住归档
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      class="mt"
      background
      layout="total, prev, pager, next"
      :total="total"
      v-model:current-page="query.page"
      @current-change="load"
    />
  </el-card>

  <el-dialog
    v-model="visible"
    :title="form.id ? '编辑客户' : '入住登记'"
    :width="form.id ? '720px' : '640px'"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item v-if="form.id" label="老人 ID">
        <el-input :model-value="String(form.id)" disabled />
      </el-form-item>
      <el-form-item label="姓名" required><el-input v-model="form.customerName" /></el-form-item>
      <el-form-item label="性别">
        <el-radio-group v-model="form.customerSex">
          <el-radio :value="0">男</el-radio>
          <el-radio :value="1">女</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="出生日期">
        <el-date-picker
          v-model="form.birthday"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择出生日期"
          :disabled-date="disableFutureDate"
        />
      </el-form-item>
      <el-form-item label="身份证号"><el-input v-model="form.idcard" /></el-form-item>
      <el-form-item label="血型"><el-input v-model="form.bloodType" /></el-form-item>
      <el-form-item label="家属"><el-input v-model="form.familyMember" /></el-form-item>
      <el-form-item label="联系电话"><el-input v-model="form.contactTel" /></el-form-item>
      <el-form-item label="房间号">
        <el-select v-model="selectedRoomNo" clearable placeholder="全部楼层可选" @change="onRoomChange">
          <el-option-group v-for="g in roomGroups" :key="g.floor" :label="g.floor">
            <el-option v-for="r in g.rooms" :key="r.id" :label="`${r.roomNo} 房`" :value="r.roomNo" />
          </el-option-group>
        </el-select>
      </el-form-item>
      <el-form-item label="床位" required>
        <el-select v-model="form.bedId" filterable placeholder="选择空闲床位（含床位 ID）" style="width: 100%">
          <el-option
            v-for="b in freeBeds"
            :key="b.id"
            :label="`床位ID ${b.id} · ${b.roomNo}房-${b.bedNo}床`"
            :value="b.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="入住时间">
        <el-date-picker
          v-model="form.checkinDate"
          type="date"
          value-format="YYYY-MM-DD"
          @change="onCheckinDateChange"
        />
      </el-form-item>
      <el-form-item label="合同到期">
        <el-date-picker
          v-model="form.expirationDate"
          type="date"
          value-format="YYYY-MM-DD"
          :disabled-date="disableBeforeCheckin"
        />
      </el-form-item>
      <template v-if="form.id">
        <el-divider content-position="left">器官隐患状态</el-divider>
        <OrganStatusEditor :customer-id="form.id" />
      </template>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>

  <CustomerBodyDetailDrawer ref="bodyDrawerRef" />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import CustomerBodyDetailDrawer from "@/components/customer/CustomerBodyDetailDrawer.vue";
import OrganStatusEditor from "@/components/customer/OrganStatusEditor.vue";
import request from "@/utils/request";
import { formatDate } from "@/utils/date";

const loading = ref(false);
const visible = ref(false);
const bodyDrawerRef = ref<InstanceType<typeof CustomerBodyDetailDrawer> | null>(null);
const tableData = ref<any[]>([]);
const total = ref(0);
const rooms = ref<any[]>([]);
const freeBeds = ref<any[]>([]);
const bedIndex = ref<Map<number, { roomNo: number; bedNo: string }>>(new Map());
const selectedRoomNo = ref<number>();

const query = reactive({ name: "", elderlyType: "self", residence: "active", page: 1, size: 10 });
const form = reactive<any>({
  customerSex: 0,
  bloodType: "A",
  buildingNo: "606",
  filepath: "/avatar/default.png",
});

function disableFutureDate(date: Date) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return date.getTime() > end.getTime();
}

function disableBeforeCheckin(date: Date) {
  if (!form.checkinDate) return false;
  const start = new Date(form.checkinDate);
  start.setHours(0, 0, 0, 0);
  return date.getTime() < start.getTime();
}

function onCheckinDateChange() {
  if (form.checkinDate && form.expirationDate && form.expirationDate < form.checkinDate) {
    form.expirationDate = form.checkinDate;
  }
}

function openBodyDetail(row: Record<string, unknown>) {
  bodyDrawerRef.value?.open(row as never);
}

function bedLabelOf(row: { bedId?: number; roomNo?: string }) {
  if (!row.bedId) return "-";
  const b = bedIndex.value.get(row.bedId);
  if (b) return `${b.roomNo}-${b.bedNo}`;
  return row.roomNo ? `${row.roomNo}-?` : `床位${row.bedId}`;
}

const roomGroups = computed(() => {
  const map = new Map<string, any[]>();
  rooms.value.forEach((r) => {
    const f = r.roomFloor + "F";
    if (!map.has(f)) map.set(f, []);
    map.get(f)!.push(r);
  });
  return [...map.entries()].map(([floor, rs]) => ({ floor, rooms: rs }));
});

async function loadBedIndex() {
  const data = await request.get("/beds/overview");
  const idx = new Map<number, { roomNo: number; bedNo: string }>();
  [...data.occupied, ...data.free].forEach((b: any) => {
    idx.set(b.bedId, { roomNo: b.roomNo, bedNo: b.bedNo });
  });
  bedIndex.value = idx;
}

async function load() {
  loading.value = true;
  try {
    const page = await request.get("/customers", {
      params: {
        name: query.name || undefined,
        elderlyType: query.elderlyType,
        residence: query.residence,
        page: query.page,
        size: query.size,
      },
    });
    tableData.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

function onFilterChange() {
  query.page = 1;
  load();
}

let nameSearchTimer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => query.name,
  () => {
    clearTimeout(nameSearchTimer);
    nameSearchTimer = setTimeout(() => {
      query.page = 1;
      load();
    }, 400);
  }
);

async function loadRooms() {
  rooms.value = await request.get("/beds/rooms");
}

async function loadFreeBeds(roomNo?: number) {
  freeBeds.value = await request.get("/beds/free", {
    params: roomNo ? { roomNo } : undefined,
  });
}

async function onRoomChange(roomNo?: number) {
  if (roomNo) form.roomNo = String(roomNo);
  const keepBedId = form.bedId;
  await loadFreeBeds(roomNo);
  if (keepBedId && !freeBeds.value.some((b) => b.id === keepBedId)) {
    const cur = bedIndex.value.get(keepBedId);
    if (cur && (!roomNo || cur.roomNo === roomNo)) {
      freeBeds.value = [{ id: keepBedId, roomNo: cur.roomNo, bedNo: cur.bedNo }, ...freeBeds.value];
    } else {
      form.bedId = undefined;
    }
  }
}

async function openDialog(row?: any) {
  Object.assign(form, {
    id: undefined,
    customerSex: 0,
    bloodType: "A",
    buildingNo: "606",
    filepath: "/avatar/default.png",
    ...row,
  });
  if (row) {
    form.birthday = formatDate(row.birthday) || undefined;
    form.checkinDate = formatDate(row.checkinDate) || undefined;
    form.expirationDate = formatDate(row.expirationDate) || undefined;
  }
  selectedRoomNo.value = row?.roomNo ? Number(row.roomNo) : undefined;
  visible.value = true;
  await loadFreeBeds(selectedRoomNo.value);
  if (form.bedId && !freeBeds.value.some((b) => b.id === form.bedId)) {
    const cur = bedIndex.value.get(form.bedId);
    if (cur) {
      freeBeds.value = [{ id: form.bedId, roomNo: cur.roomNo, bedNo: cur.bedNo }, ...freeBeds.value];
    }
  }
}

async function save() {
  if (!form.bedId) {
    ElMessage.warning("请选择床位");
    return;
  }
  if (form.checkinDate && form.expirationDate && form.expirationDate < form.checkinDate) {
    ElMessage.warning("合同到期日不能早于入住日期");
    return;
  }
  if (form.id) {
    await request.put(`/customers/${form.id}`, form);
  } else {
    await request.post("/customers/checkin", form);
  }
  ElMessage.success("保存成功");
  visible.value = false;
  await loadBedIndex();
  load();
}

async function onRetreat(row: { id: number; customerName?: string }) {
  await ElMessageBox.confirm(
    `确认为「${row.customerName || "该老人"}」办理退住归档？\n数据将保留，可在「已退住」筛选中查看，历史护理/外出记录仍会显示姓名。`,
    "退住归档",
    { type: "warning" }
  );
  await request.delete(`/customers/${row.id}`);
  ElMessage.success("已退住归档");
  await loadBedIndex();
  load();
}

onMounted(async () => {
  await loadRooms();
  await loadBedIndex();
  load();
});
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
.mt {
  margin-top: 12px;
}
</style>
