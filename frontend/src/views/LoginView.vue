<template>
  <div class="login-page">
    <div class="login-split">
      <aside class="pane pane-brand">
        <div class="brand-bg-lines" aria-hidden="true">
          <span v-for="n in 5" :key="n" class="bg-line" :style="{ '--i': n }" />
        </div>
        <div class="brand-pattern" aria-hidden="true" />

        <div class="brand-inner">
          <div class="brand-mark">
            <svg class="mark-svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect class="mark-stroke" x="4" y="18" width="40" height="26" rx="3" stroke="currentColor" stroke-width="2" />
              <path class="mark-stroke" d="M14 18V12a10 10 0 0 1 20 0v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <path class="mark-stroke" d="M24 28v8M20 32h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <circle class="mark-dot" cx="24" cy="8" r="3" fill="currentColor" />
            </svg>
          </div>

          <h1 class="brand-title anim-in" style="--d: 0.12s">{{ UI_TEXT.brandTitle }}</h1>
          <p class="brand-tagline anim-in" style="--d: 0.2s">{{ UI_TEXT.loginTagline }}</p>

          <ul class="brand-features">
            <li
              v-for="(item, idx) in features"
              :key="item.title"
              class="anim-in"
              :style="{ '--d': `${0.28 + idx * 0.1}s` }"
            >
              <span class="feature-icon">
                <el-icon :size="17"><component :is="item.icon" /></el-icon>
              </span>
              <div>
                <strong>{{ item.title }}</strong>
                <span>{{ item.desc }}</span>
              </div>
            </li>
          </ul>

          <p class="brand-footer anim-in" style="--d: 0.58s">{{ UI_TEXT.loginFooter }}</p>
        </div>
      </aside>

      <main class="pane pane-form">
        <div class="form-zone anim-in-right" style="--d: 0.15s">
          <div class="mobile-brand">
            <div class="mobile-mark" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="18" width="40" height="26" rx="3" stroke="currentColor" stroke-width="2" />
                <circle cx="24" cy="8" r="3" fill="currentColor" />
              </svg>
            </div>
            <p class="mobile-title">{{ UI_TEXT.brandTitle }}</p>
          </div>

          <header class="panel-header">
            <h2>{{ UI_TEXT.loginTitle }}</h2>
            <p class="panel-desc">{{ UI_TEXT.loginRoles }}</p>
          </header>

          <el-form
            ref="formRef"
            class="login-form"
            :model="form"
            :rules="rules"
            size="large"
            @submit.prevent="onSubmit"
          >
            <el-form-item prop="username" class="anim-in-right" style="--d: 0.25s">
              <template #label>
                <span class="field-label">账号</span>
              </template>
              <el-input
                v-model="form.username"
                placeholder="请输入登录账号"
                autocomplete="username"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>
            <el-form-item prop="password" class="anim-in-right" style="--d: 0.33s">
              <template #label>
                <span class="field-label">密码</span>
              </template>
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入登录密码"
                autocomplete="current-password"
                show-password
                :prefix-icon="Lock"
                @keyup.enter="onSubmit"
              />
            </el-form-item>

            <el-form-item class="anim-in-right" style="--d: 0.41s">
              <el-button class="submit-btn" type="primary" native-type="submit" :loading="loading">
                <span>{{ loading ? UI_TEXT.loginVerifying : UI_TEXT.loginSubmit }}</span>
                <span class="btn-arrow" aria-hidden="true">&gt;</span>
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <footer class="login-copyright anim-in-right" style="--d: 0.5s">
          © {{ year }} {{ UI_TEXT.copyrightSuffix }}</footer>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { House, Lock, User, FirstAidKit, DataLine } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/user";
import { UI_TEXT } from "@/constants/ui-text";

const store = useUserStore();
const loading = ref(false);
const formRef = ref<FormInstance>();
const year = new Date().getFullYear();

const form = reactive({ username: "", password: "" });

const rules: FormRules = {
  username: [{ required: true, message: UI_TEXT.validateUsername, trigger: "blur" }],
  password: [{ required: true, message: UI_TEXT.validatePassword, trigger: "blur" }],
};

const features = [
  { icon: House, title: UI_TEXT.feature1Title, desc: UI_TEXT.feature1Desc },
  { icon: FirstAidKit, title: UI_TEXT.feature2Title, desc: UI_TEXT.feature2Desc },
  { icon: DataLine, title: UI_TEXT.feature3Title, desc: UI_TEXT.feature3Desc },
];

async function onSubmit() {
  if (loading.value) return;
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    await store.login(form.username, form.password);
  } catch {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  --primary: #1677ff;
  --primary-hover: #4096ff;
  --brand-bg: #0a1220;
  --brand-accent: #c4a574;
  --form-bg: #f4f2ee;
  --text: #1a2332;
  --muted: #64748b;
  --border: #d8dde6;

  position: relative;
  min-height: 100vh;
  overflow: hidden;
  font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif;
  background: var(--form-bg);
}

.login-split {
  position: relative;
  min-height: 100vh;
  width: 100%;
}

.pane {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.pane-brand {
  z-index: 1;
  width: 52%;
  color: #eef2f7;
  background: var(--brand-bg);
  /* 斜边略缓，右侧多留安全区，避免文字被裁切 */
  clip-path: polygon(0 0, 100% 0, 86% 100%, 0 100%);
  animation: pane-enter-left 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}

.pane-form {
  z-index: 2;
  left: auto;
  right: 0;
  width: 52%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  background: var(--form-bg);
  clip-path: polygon(14% 0, 100% 0, 100% 100%, 0 100%);
  animation: pane-enter-right 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes pane-enter-left {
  from {
    transform: translateX(-8%);
    opacity: 0.8;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes pane-enter-right {
  from {
    transform: translateX(8%);
    opacity: 0.8;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.brand-pattern {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 50% at 20% 85%, rgba(196, 165, 116, 0.1), transparent),
    radial-gradient(ellipse 45% 35% at 75% 12%, rgba(22, 119, 255, 0.07), transparent);
  pointer-events: none;
}

.brand-bg-lines {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.bg-line {
  position: absolute;
  left: -8%;
  width: 116%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
  top: calc(18% + var(--i) * 13%);
  animation: line-drift 14s linear infinite;
  animation-delay: calc(var(--i) * -2s);
}

@keyframes line-drift {
  0% {
    transform: translateX(-6%);
    opacity: 0;
  }
  20% {
    opacity: 0.8;
  }
  80% {
    opacity: 0.8;
  }
  100% {
    transform: translateX(6%);
    opacity: 0;
  }
}

/* 左侧内容：靠左摆放，远离斜切接缝，防止被裁切 */
.brand-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  width: min(400px, 88%);
  max-width: calc(100% - 18%);
  margin-left: clamp(36px, 5vw, 72px);
  margin-right: auto;
  padding: 40px 20px 40px 0;
  box-sizing: border-box;
}

.brand-mark {
  width: 52px;
  height: 52px;
  margin-bottom: 22px;
  color: var(--brand-accent);
}

.mark-svg {
  width: 100%;
  height: 100%;
}

.mark-stroke {
  stroke-dasharray: 120;
  stroke-dashoffset: 120;
  animation: draw-stroke 1.1s ease forwards 0.2s;
}

.mark-dot {
  opacity: 0;
  animation: dot-in 0.4s ease forwards 0.85s;
}

@keyframes draw-stroke {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes dot-in {
  to {
    opacity: 0.9;
  }
}

.brand-title {
  margin: 0 0 10px;
  font-size: clamp(24px, 2.6vw, 30px);
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 1.35;
}

.brand-tagline {
  margin: 0 0 28px;
  font-size: 15px;
  color: rgba(238, 242, 247, 0.6);
  letter-spacing: 0.04em;
  line-height: 1.5;
}

.brand-features {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.brand-features li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.feature-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(196, 165, 116, 0.35);
  color: var(--brand-accent);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
}

.brand-features strong {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 600;
  color: #e8edf4;
}

.brand-features span {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(238, 242, 247, 0.48);
}

.brand-footer {
  margin: 36px 0 0;
  font-size: 12px;
  color: rgba(238, 242, 247, 0.32);
  letter-spacing: 0.16em;
}

.anim-in {
  opacity: 0;
  transform: translateX(-12px);
  animation: slide-in-left 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--d, 0s);
}

.anim-in-right {
  opacity: 0;
  transform: translateX(14px);
  animation: slide-in-right 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--d, 0s);
}

@keyframes slide-in-left {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slide-in-right {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 右侧表单：避开左侧斜边安全区 */
.form-zone {
  width: min(380px, 92%);
  max-width: calc(100% - 20%);
  margin-left: 22%;
  margin-right: clamp(36px, 5vw, 72px);
  padding: 8px 0 24px;
  box-sizing: border-box;
}

.mobile-brand {
  display: none;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.mobile-mark {
  width: 40px;
  height: 40px;
  color: var(--brand-accent);
}

.mobile-mark svg {
  width: 100%;
  height: 100%;
}

.mobile-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--text);
}

.panel-header {
  margin-bottom: 28px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}

.panel-header h2 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.03em;
}

.panel-desc {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
  letter-spacing: 0.08em;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-form-item__label) {
  padding-bottom: 6px;
}

.field-label {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.login-form :deep(.el-input__wrapper) {
  height: 42px;
  border-radius: 6px;
  background: #fff;
  box-shadow: none;
  border: 1px solid var(--border);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.12);
}

.submit-btn {
  width: 100%;
  height: 46px;
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.1em;
  border: none;
  border-radius: 6px;
}

.btn-arrow {
  transition: transform 0.2s;
}

.submit-btn:hover:not(:disabled) .btn-arrow {
  transform: translateX(3px);
}

.login-copyright {
  position: absolute;
  bottom: 22px;
  right: clamp(36px, 5vw, 72px);
  left: auto;
  font-size: 12px;
  color: #94a3b8;
}

@media (max-width: 899px) {
  .login-split {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .pane-brand,
  .pane-form {
    position: relative;
    width: 100%;
    clip-path: none;
    animation: none;
  }

  .pane-brand {
    flex: 0 0 auto;
    clip-path: polygon(0 0, 100% 0, 100% 94%, 0 100%);
  }

  .pane-form {
    flex: 1;
    clip-path: polygon(0 3%, 100% 0, 100% 100%, 0 100%);
    margin-top: -10px;
    align-items: center;
  }

  .brand-inner {
    min-height: auto;
    width: auto;
    margin: 0;
    padding: 32px 28px 28px;
  }

  .brand-features,
  .brand-footer {
    display: none;
  }

  .brand-tagline {
    margin-bottom: 0;
  }

  .mobile-brand {
    display: flex;
  }

  .form-zone {
    width: min(400px, 90%);
    margin: 0 auto;
    padding: 28px 0 40px;
  }

  .login-copyright {
    position: static;
    left: auto;
    text-align: center;
    margin-top: auto;
    padding-bottom: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pane-brand,
  .pane-form,
  .anim-in,
  .anim-in-right,
  .mark-stroke,
  .mark-dot,
  .bg-line {
    animation: none !important;
    opacity: 1;
    transform: none;
    stroke-dashoffset: 0;
  }
}
</style>
