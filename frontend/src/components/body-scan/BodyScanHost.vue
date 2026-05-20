<template>
  <div ref="hostEl" class="body-scan-host" />
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import type { BodyScanRiskLevel } from "@/lib/customer-body-scan";
import type { CustomerOrganStatusMap } from "@/lib/organ-status";

type BodyScanPanelProps = {
  scanning?: boolean;
  ppb?: number | null;
  riskLevel?: BodyScanRiskLevel;
  organStatus?: CustomerOrganStatusMap | null;
};

const props = withDefaults(
  defineProps<{
    scanning?: boolean;
    ppb?: number | null;
    riskLevel?: BodyScanPanelProps["riskLevel"];
    organStatus?: CustomerOrganStatusMap | null;
  }>(),
  {
    scanning: false,
    ppb: null,
    riskLevel: "healthy",
    organStatus: null,
  }
);

const hostEl = ref<HTMLElement | null>(null);

let api: typeof import("./mount") | null = null;

function panelProps(): BodyScanPanelProps {
  return {
    scanning: props.scanning,
    ppb: props.ppb,
    riskLevel: props.riskLevel,
    organStatus: props.organStatus,
  };
}

async function mountScan() {
  await nextTick();
  const el = hostEl.value;
  if (!el) return;
  api = await import("./mount");
  api.mountBodyScan(el, panelProps());
}

function updateScan() {
  const el = hostEl.value;
  if (!el || !api) return;
  api.updateBodyScan(el, panelProps());
}

watch(
  () => hostEl.value,
  (el) => {
    if (el) mountScan();
  },
  { flush: "post" }
);

watch(
  () => [props.scanning, props.ppb, props.riskLevel, props.organStatus] as const,
  () => updateScan(),
  { deep: true }
);

onBeforeUnmount(() => {
  const el = hostEl.value;
  if (el && api) api.unmountBodyScan(el);
  api = null;
});
</script>

<style scoped>
.body-scan-host {
  width: 100%;
  min-height: 18rem;
}
</style>
