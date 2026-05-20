import React, { Suspense, lazy, useMemo, useState } from "react";
import { getHotspotByKey } from "@/config/organ-hotspots";
import type { OrganHeatKey } from "@/lib/organ-heat";
import type { BodyScanRiskLevel } from "@/lib/customer-body-scan";
import type { CustomerOrganStatusMap } from "@/lib/organ-status";
import { statusLabel } from "@/lib/organ-status";

const BodyScan3D = lazy(() => import("./BodyScan3D"));

class BodyScanErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("BodyScan3D render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return <div className="body-scan-fallback">3D 渲染异常，已切换安全模式</div>;
    }
    return this.props.children;
  }
}

export type BodyScanPanelProps = {
  scanning?: boolean;
  ppb?: number | null;
  riskLevel?: BodyScanRiskLevel;
  organStatus?: CustomerOrganStatusMap | null;
};

export function BodyScanPanel({
  scanning = false,
  ppb = null,
  riskLevel = "healthy",
  organStatus = null,
}: BodyScanPanelProps) {
  const [selectedOrganKey, setSelectedOrganKey] = useState<OrganHeatKey | null>(null);
  const selectedOrganDetail = useMemo(
    () => (selectedOrganKey ? getHotspotByKey(selectedOrganKey) : null),
    [selectedOrganKey]
  );
  const selectedStatus = selectedOrganKey && organStatus ? organStatus[selectedOrganKey] : null;

  return (
    <div className="body-scan-panel">
      <BodyScanErrorBoundary>
        <Suspense fallback={<div className="body-scan-fallback">3D 模型加载中…</div>}>
          <BodyScan3D
            scanning={scanning}
            ppb={ppb}
            riskLevel={riskLevel}
            organStatus={organStatus}
            onOrganSelect={setSelectedOrganKey}
            selectedOrganKey={selectedOrganKey}
          />
        </Suspense>
      </BodyScanErrorBoundary>
      {selectedOrganDetail ? (
        <div className="body-scan-organ-detail">
          <div className="body-scan-organ-detail-head">
            <span className="body-scan-organ-title">{selectedOrganDetail.label}</span>
            <button type="button" className="body-scan-organ-close" onClick={() => setSelectedOrganKey(null)}>
              关闭
            </button>
          </div>
          {selectedStatus ? (
            <p className="body-scan-organ-status">当前状态：{statusLabel(selectedStatus.status)}</p>
          ) : null}
          {selectedStatus?.note ? (
            <p className="body-scan-organ-note">备注：{selectedStatus.note}</p>
          ) : null}
          <p className="body-scan-organ-hint">{selectedOrganDetail.hint}</p>
        </div>
      ) : null}
    </div>
  );
}
