<template>
  <el-card>
    <template #header>
      <div class="toolbar">
        <span>{{ UI_TEXT.userManageTitle }}</span>
        <div class="toolbar-right">
          <el-button type="primary" @click="openCreate">新增用户</el-button>
          <el-checkbox v-model="includeDisabled" @change="load">{{ UI_TEXT.userShowDisabled }}</el-checkbox>
        </div>
      </div>
    </template>
    <el-table :data="list" border v-loading="loading">
      <el-table-column prop="username" :label="UI_TEXT.colUsername" width="120" />
      <el-table-column prop="nickname" :label="UI_TEXT.colNickname" width="120" />
      <el-table-column prop="phoneNumber" :label="UI_TEXT.colPhone" width="130" />
      <el-table-column prop="roleId" :label="UI_TEXT.colRole" width="110">
        <template #default="{ row }">
          {{ row.roleId === 1 ? UI_TEXT.roleAdmin : UI_TEXT.roleNurse }}
        </template>
      </el-table-column>
      <el-table-column :label="UI_TEXT.colStatus" width="90">
        <template #default="{ row }">
          <el-tag :type="row.isDeleted ? 'info' : 'success'" size="small">
            {{ row.isDeleted ? UI_TEXT.userDisabled : UI_TEXT.userActive }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="UI_TEXT.colActions" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openReset(row)">{{ UI_TEXT.userResetPwd }}</el-button>
          <el-button
            v-if="!row.isDeleted"
            link
            type="danger"
            @click="toggleStatus(row, true)"
          >
            {{ UI_TEXT.userDisable }}
          </el-button>
          <el-button v-else link type="success" @click="toggleStatus(row, false)">
            {{ UI_TEXT.userEnable }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="resetVisible" :title="UI_TEXT.userResetPwd" width="400px">
    <p class="reset-hint">{{ resetTarget?.nickname }}（{{ resetTarget?.username }}）</p>
    <el-input v-model="newPassword" type="password" show-password :placeholder="UI_TEXT.newPasswordHint" />
    <template #footer>
      <el-button @click="resetVisible = false">{{ UI_TEXT.cancel }}</el-button>
      <el-button type="primary" :loading="resetLoading" @click="confirmReset">{{ UI_TEXT.confirm }}</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="createVisible" title="新增用户" width="440px">
    <el-form :model="createForm" label-width="90px">
      <el-form-item label="用户名" required>
        <el-input v-model="createForm.username" />
      </el-form-item>
      <el-form-item label="昵称" required>
        <el-input v-model="createForm.nickname" />
      </el-form-item>
      <el-form-item label="手机号" required>
        <el-input v-model="createForm.phoneNumber" placeholder="默认密码为手机号后6位" />
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="createForm.roleId" style="width: 100%">
          <el-option :label="UI_TEXT.roleAdmin" :value="1" />
          <el-option :label="UI_TEXT.roleNurse" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="密码">
        <el-input v-model="createForm.password" type="password" show-password placeholder="留空则用手机号后6位" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">{{ UI_TEXT.cancel }}</el-button>
      <el-button type="primary" :loading="createLoading" @click="confirmCreate">{{ UI_TEXT.confirm }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { UI_TEXT } from "@/constants/ui-text";
import request from "@/utils/request";

interface UserRow {
  id: number;
  username: string;
  nickname: string;
  phoneNumber?: string;
  roleId: number;
  isDeleted?: number;
}

const loading = ref(false);
const list = ref<UserRow[]>([]);
const includeDisabled = ref(false);
const resetVisible = ref(false);
const resetLoading = ref(false);
const resetTarget = ref<UserRow | null>(null);
const newPassword = ref("");
const createVisible = ref(false);
const createLoading = ref(false);
const createForm = reactive({
  username: "",
  nickname: "",
  phoneNumber: "",
  roleId: 2,
  password: "",
});

function openCreate() {
  Object.assign(createForm, {
    username: "",
    nickname: "",
    phoneNumber: "",
    roleId: 2,
    password: "",
  });
  createVisible.value = true;
}

async function confirmCreate() {
  if (!createForm.username || !createForm.nickname || !createForm.phoneNumber) {
    ElMessage.warning("请填写用户名、昵称和手机号");
    return;
  }
  createLoading.value = true;
  try {
    await request.post("/users", { ...createForm });
    ElMessage.success("用户已创建");
    createVisible.value = false;
    await load();
  } finally {
    createLoading.value = false;
  }
}

async function load() {
  loading.value = true;
  try {
    const page = await request.get("/users", {
      params: { page: 1, size: 50, includeDisabled: includeDisabled.value ? "true" : undefined },
    });
    list.value = page.records || [];
  } finally {
    loading.value = false;
  }
}

function openReset(row: UserRow) {
  resetTarget.value = row;
  newPassword.value = row.username;
  resetVisible.value = true;
}

async function confirmReset() {
  if (!resetTarget.value || newPassword.value.length < 4) {
    ElMessage.warning(UI_TEXT.passwordMinHint);
    return;
  }
  resetLoading.value = true;
  try {
    await request.put(`/users/${resetTarget.value.id}/reset-password`, {
      password: newPassword.value,
    });
    ElMessage.success(UI_TEXT.userResetOk);
    resetVisible.value = false;
  } finally {
    resetLoading.value = false;
  }
}

async function toggleStatus(row: UserRow, disabled: boolean) {
  const tip = disabled ? UI_TEXT.confirmDisable : UI_TEXT.confirmEnable;
  await ElMessageBox.confirm(tip.replace("{name}", row.nickname), UI_TEXT.confirmTitle, {
    type: "warning",
  });
  await request.put(`/users/${row.id}/status`, { disabled });
  ElMessage.success(UI_TEXT.userStatusOk);
  await load();
}

onMounted(load);
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reset-hint {
  margin: 0 0 12px;
  color: var(--app-text-secondary);
  font-size: 13px;
}
</style>
