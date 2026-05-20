// @ts-ignore
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
// @ts-ignore
import { Canvas, useFrame, useThree } from "@react-three/fiber";
// @ts-ignore
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
// @ts-ignore
import * as THREE from "three";
import { BODY_MODEL_FILENAME, BODY_MODEL_GLB } from "@/config/body-model";
import { ORGAN_HOTSPOT_Y_LIFT, ORGAN_HOTSPOT_Z_INWARD, ORGAN_HOTSPOTS } from "@/config/organ-hotspots";
import { getHeatIntensityFromPpb, getOrganHeatMap } from "@/lib/organ-heat";
import { normalizeOrganStatusMap, organStatusToHeatMap, statusColorHex } from "@/lib/organ-status";

/**
 * @param {object} props
 * @param {boolean} [props.scanning]
 * @param {number | null} [props.ppb]
 * @param {string} [props.riskLevel] healthy | risk | critical
 * @param {(key: import('@/lib/organ-heat').OrganHeatKey) => void} [props.onOrganSelect]
 * @param {import('@/lib/organ-heat').OrganHeatKey | null} [props.selectedOrganKey]
 * @param {import('@/lib/organ-status').CustomerOrganStatusMap | null} [props.organStatus]
 */
export default function BodyScan3D({
  scanning = false,
  ppb = null,
  riskLevel = "healthy",
  onOrganSelect,
  selectedOrganKey = null,
  organStatus = null,
}) {
  const [modelReady, setModelReady] = useState(false);
  /** WebGL 被系统回收后，通过改 key 强制重建 Canvas */
  const [canvasRemountKey, setCanvasRemountKey] = useState(0);
  const [glContextLost, setGlContextLost] = useState(false);
  /** 窄屏或触控优先设备：降低 GPU 负载，减少 WebGL 上下文丢失与 OOM */
  const [coarseDevice, setCoarseDevice] = useState(false);
  /** 后台标签页时关闭自转，减轻 GPU 压力，降低 Context Lost 概率 */
  const [tabVisible, setTabVisible] = useState(() => (typeof document !== "undefined" ? !document.hidden : true));
  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const mqNarrow = window.matchMedia("(max-width: 640px)");
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarseDevice(Boolean(mqNarrow.matches || mqCoarse.matches));
    sync();
    mqNarrow.addEventListener("change", sync);
    mqCoarse.addEventListener("change", sync);
    return () => {
      mqNarrow.removeEventListener("change", sync);
      mqCoarse.removeEventListener("change", sync);
    };
  }, []);

  const webglOk = useMemo(() => {
    try {
      const canvas = document.createElement("canvas");
      return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch (_e) {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!webglOk) setModelReady(true);
  }, [webglOk]);

  const onModelReady = useCallback(() => setModelReady(true), []);

  const handleGlContextLost = useCallback(() => {
    setGlContextLost(true);
    setModelReady(true);
  }, []);

  const organStatusMap = useMemo(
    () => (organStatus ? normalizeOrganStatusMap(organStatus) : null),
    [organStatus]
  );
  const organHeat = useMemo(() => {
    if (organStatusMap) return organStatusToHeatMap(organStatusMap);
    return getOrganHeatMap(ppb);
  }, [organStatusMap, ppb]);
  const heatIntensity = useMemo(() => {
    if (organStatusMap) return Math.max(...Object.values(organHeat));
    return getHeatIntensityFromPpb(ppb);
  }, [organStatusMap, organHeat, ppb]);
  /** 分段略低可减轻 GPU，降低 Context Lost 概率 */
  const sphereSeg = coarseDevice ? 10 : 16;
  /** 全程锁 1× 在高分屏上会明显发糊；窄屏/触控仍 1× 保稳，桌面允许最高 2× */
  const canvasDpr = useMemo(() => (coarseDevice ? [1, 1] : [1, 2]), [coarseDevice]);

  const statusText = scanning
    ? "3D 扫描分析中…"
    : "拖拽旋转 · 滚轮缩放 · 点击彩色热点查看器官说明";

  return (
    <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-cyan-400/10 via-transparent to-emerald-400/10 sm:h-[26rem]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,209,255,0.2),transparent_45%)]" />
      <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/45" />
      <div
        className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/20 animate-spin"
        style={{ animationDuration: "9s" }}
      />
      <div
        className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan-300/60 to-transparent"
        style={{
          animation: scanning ? "scanlineMove 1.6s linear infinite" : "none",
          filter: "drop-shadow(0 0 8px rgba(79,209,255,0.8))",
        }}
      />

      {webglOk && !modelReady && !glContextLost && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#05070c]/80 backdrop-blur-[1px]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400/25 border-t-cyan-400" aria-hidden />
          <span className="text-xs text-white/60">模型加载中…</span>
          <span className="sr-only">三维模型正在加载</span>
        </div>
      )}

      {glContextLost ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#05070c]/92 px-4 text-center">
          <p className="text-xs text-white/70">3D 显存已被浏览器回收（切换页面或多标签时较常见）</p>
          <button
            type="button"
            className="rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/25"
            onClick={() => {
              setGlContextLost(false);
              setModelReady(false);
              setCanvasRemountKey((k) => k + 1);
            }}
          >
            重新加载 3D
          </button>
        </div>
      ) : null}

      <div className={`relative z-10 h-full w-full ${scanning ? "animate-[pulse_2s_ease-in-out_infinite]" : ""}`}>
        {webglOk ? (
          <Canvas
            key={canvasRemountKey}
            dpr={canvasDpr}
            gl={{
              antialias: !coarseDevice,
              powerPreference: "default",
              alpha: true,
              stencil: false,
              failIfMajorPerformanceCaveat: false,
              preserveDrawingBuffer: false,
            }}
            camera={{ position: [0, -0.15, 2.75], fov: 38 }}
            onPointerMissed={() => {
              if (typeof onOrganSelect === "function") onOrganSelect(null);
            }}
          >
            <WebGlContextLostBridge onContextLost={handleGlContextLost} />
            <ResumeRenderWhenTabVisible />
            <Suspense fallback={null}>
              <ambientLight intensity={0.38} />
              <hemisphereLight color="#cfe8ff" groundColor="#0c1524" intensity={0.45} />
              <directionalLight position={[2.2, 2.5, 2]} intensity={0.85} color="#b8dcff" />
              <directionalLight position={[-1.8, 1.2, -1.5]} intensity={0.4} color="#c5f0e8" />
              <directionalLight position={[0.2, -0.8, 2.4]} intensity={0.28} color="#e8f4ff" />
              <pointLight position={[-2, -1.5, 2]} intensity={0.42} color="#5eead4" />
              <HumanBodyMesh
                scanning={scanning}
                onModelReady={onModelReady}
                heatIntensity={heatIntensity}
                organHeat={organHeat}
                riskLevel={riskLevel}
                onOrganSelect={onOrganSelect}
                selectedOrganKey={selectedOrganKey}
                organStatusMap={organStatusMap}
                sphereSeg={sphereSeg}
              />
              <OrbitControls
                enablePan={false}
                enableZoom
                minDistance={1.35}
                maxDistance={4.2}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI - Math.PI / 4}
                autoRotate={tabVisible}
                autoRotateSpeed={scanning ? 0.75 : 0.38}
              />
            </Suspense>
          </Canvas>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-white/60">设备图形能力不足，已切换轻量显示</div>
        )}
      </div>

      <div className="absolute bottom-2 left-0 right-0 px-2 text-center text-[11px] leading-snug text-white/65">{statusText}</div>
    </div>
  );
}

/** 监听 webglcontextlost；必须 preventDefault，否则浏览器默认不触发 restore */
function WebGlContextLostBridge({ onContextLost }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const el = gl.domElement;
    const onLost = (e) => {
      e.preventDefault();
      onContextLost();
    };
    el.addEventListener("webglcontextlost", onLost, false);
    return () => el.removeEventListener("webglcontextlost", onLost);
  }, [gl, onContextLost]);
  return null;
}

/** 从后台回到前台时补一帧，避免 demand 或暂停自转后画面卡住 */
function ResumeRenderWhenTabVisible() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) invalidate();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [invalidate]);
  return null;
}

function HumanBodyMesh({
  scanning,
  onModelReady,
  heatIntensity,
  organHeat,
  riskLevel,
  onOrganSelect,
  selectedOrganKey,
  organStatusMap,
  sphereSeg,
}) {
  return (
    <Suspense fallback={null}>
      <LoadedBodyMesh
        scanning={scanning}
        onModelReady={onModelReady}
        heatIntensity={heatIntensity}
        organHeat={organHeat}
        riskLevel={riskLevel}
        onOrganSelect={onOrganSelect}
        selectedOrganKey={selectedOrganKey}
        organStatusMap={organStatusMap}
        sphereSeg={sphereSeg}
      />
    </Suspense>
  );
}

/** GLB 404/解析失败时避免整页白模并收起「加载中」遮罩 */
class GltfLoadErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.didRecover = false;
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error("BodyScan3D GLB load/render failed:", error);
    if (!this.didRecover && typeof this.props.onRecover === "function") {
      this.didRecover = true;
      this.props.onRecover();
    }
  }

  render() {
    if (this.state.error) {
      return (
        <group>
          <mesh position={[0, 0.05, 0]}>
            <capsuleGeometry args={[0.32, 1.05, 8, 24]} />
            <meshStandardMaterial color="#475569" roughness={0.55} metalness={0.05} />
          </mesh>
          <Html center position={[0, 1.12, 0]} style={{ pointerEvents: "none" }}>
            <div className="max-w-[16rem] rounded-md border border-white/15 bg-black/80 px-2 py-1.5 text-center text-[10px] leading-snug text-white/85">
              未加载到模型文件 <span className="font-mono text-cyan-200/90">{BODY_MODEL_FILENAME}</span>
              <br />
              请将 glb 放入 <span className="font-mono">public/models/</span> 后重新 build 并部署。
              <br />
              <span className="mt-1 block break-all font-mono text-[9px] text-white/55">{BODY_MODEL_GLB}</span>
            </div>
          </Html>
        </group>
      );
    }
    return this.props.children;
  }
}

function GltfBodyPrimitive({ scanning, onModelReady, heatIntensity, riskLevel, neutralBody }) {
  const { scene } = useGLTF(BODY_MODEL_GLB);
  const modelScene = useMemo(() => scene.clone(true), [scene]);
  const readyOnce = useRef(false);
  /** 有器官状态时用低强度，避免热点热度把整个人体打亮 */
  const bodyHeat = neutralBody ? 0.14 : heatIntensity;
  const bodyRisk = neutralBody ? "healthy" : riskLevel;

  useEffect(() => {
    if (!readyOnce.current && onModelReady) {
      readyOnce.current = true;
      onModelReady();
    }
  }, [modelScene, onModelReady]);

  useEffect(() => {
    modelScene.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.renderOrder = 2;
      const mat = obj.material;
      if (!mat) return;
      if (Array.isArray(mat)) {
        mat.forEach((m) => patchMaterial(m, scanning, bodyHeat, bodyRisk));
      } else {
        patchMaterial(mat, scanning, bodyHeat, bodyRisk);
      }
    });
  }, [modelScene, scanning, bodyHeat, bodyRisk]);

  return <primitive object={modelScene} />;
}

function LoadedBodyMesh({
  scanning,
  onModelReady,
  heatIntensity,
  organHeat,
  riskLevel,
  onOrganSelect,
  selectedOrganKey,
  organStatusMap,
  sphereSeg,
}) {
  /** 整体人体模型略向下（与热点 group 同步） */
  return (
    <group position={[0, -0.51, 0]}>
      <group position={[0, -0.52, 0.08]} scale={[1.05, 1.05, 1.05]}>
        <GltfLoadErrorBoundary onRecover={onModelReady}>
          <GltfBodyPrimitive
            scanning={scanning}
            onModelReady={onModelReady}
            heatIntensity={heatIntensity}
            riskLevel={riskLevel}
            neutralBody={Boolean(organStatusMap)}
          />
        </GltfLoadErrorBoundary>
        <group position={[0, ORGAN_HOTSPOT_Y_LIFT, ORGAN_HOTSPOT_Z_INWARD]}>
          <OrganHotspots
            organHeat={organHeat}
            heatIntensity={heatIntensity}
            scanning={scanning}
            onOrganSelect={onOrganSelect}
            selectedOrganKey={selectedOrganKey}
            organStatusMap={organStatusMap}
            sphereSeg={sphereSeg}
          />
        </group>
      </group>
    </group>
  );
}

const BODY_SCAN_MAT_BASE = Symbol("bodyScanMatBase");

function captureMaterialBase(material) {
  if (material[BODY_SCAN_MAT_BASE]) return material[BODY_SCAN_MAT_BASE];
  const base = {
    transparent: material.transparent,
    opacity: typeof material.opacity === "number" ? material.opacity : 1,
    depthWrite: material.depthWrite,
    roughness: material.roughness,
    metalness: material.metalness,
    color: material.color?.clone?.() ?? null,
    emissive: material.emissive?.clone?.() ?? null,
    emissiveIntensity: material.emissiveIntensity,
  };
  material[BODY_SCAN_MAT_BASE] = base;
  return base;
}

/** 每次从 GLB 原始材质重算，避免 lerp 叠加导致保存后越来越白亮 */
function patchMaterial(material, scanning, heatIntensity, riskLevel) {
  const base = captureMaterialBase(material);
  material.transparent = true;
  material.opacity = Math.min(base.opacity, 0.97) * 0.78;
  if ("depthWrite" in material) material.depthWrite = false;
  if ("roughness" in material) material.roughness = 0.58;
  if ("metalness" in material) material.metalness = 0.04;
  if ("color" in material && material.color && base.color) {
    material.color.copy(base.color);
    material.color.lerp(new THREE.Color("#6b7f8f"), 0.32);
    material.color.multiplyScalar(0.88);
  }
  if ("emissive" in material && material.emissive?.set) {
    const hi = heatIntensity ?? 0.2;
    if (riskLevel === "critical" || hi > 0.72) {
      material.emissive.set("#2a1818");
    } else if (riskLevel === "risk" || hi > 0.45) {
      material.emissive.set("#221c12");
    } else {
      material.emissive.set("#121c22");
    }
  }
  if ("emissiveIntensity" in material) {
    const pulse = scanning ? 0.1 : 0.03;
    material.emissiveIntensity = (pulse + (heatIntensity ?? 0) * 0.12) * 0.38;
  }
  material.needsUpdate = true;
}

function OrganHotspots({ organHeat, heatIntensity, scanning, onOrganSelect, selectedOrganKey, organStatusMap, sphereSeg }) {
  const spots = useMemo(
    () =>
      ORGAN_HOTSPOTS.map((def) => ({
        key: def.key,
        pos: def.pos,
        r: def.r,
        heat: organHeat[def.key],
        status: organStatusMap?.[def.key]?.status ?? null,
      })),
    [organHeat, organStatusMap]
  );

  const blobs = useMemo(
    () => [
      { pos: [0, 0.42, 0.05], r: 0.25, heat: Math.max(organHeat.lungL, organHeat.lungR) },
      { pos: [0.055, 0.26, 0.064], r: 0.18, heat: organHeat.liver },
      { pos: [0, 0.13, 0.055], r: 0.19, heat: organHeat.gut },
      { pos: [0, 0.70, 0.03], r: 0.11, heat: organHeat.head },
    ],
    [organHeat]
  );

  return (
    <group>
      {spots.map((s) => (
        <HeatSphere
          key={s.key}
          organKey={s.key}
          pos={s.pos}
          r={s.r}
          heat={s.heat}
          status={s.status}
          globalHeat={heatIntensity}
          scanning={scanning}
          selected={selectedOrganKey === s.key}
          onSelect={onOrganSelect}
          sphereSeg={sphereSeg}
        />
      ))}
      {blobs.map((b, i) => (
        <HeatBlob key={`blob-${i}`} pos={b.pos} r={b.r} heat={b.heat} scanning={scanning} sphereSeg={sphereSeg} />
      ))}
    </group>
  );
}

function HeatSphere({ organKey, pos, r, heat, status, globalHeat, scanning, selected, onSelect, sphereSeg }) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  const scaleSmoothed = useRef(1);
  const haloMatRef = useRef(null);
  const { gl } = useThree();
  const color = useMemo(() => {
    if (status) return new THREE.Color(statusColorHex(status));
    return heatColor(heat * globalHeat);
  }, [status, heat, globalHeat]);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color,
      emissive: color.clone().multiplyScalar(0.55),
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.38 + heat * 0.34,
      roughness: 0.42,
      metalness: 0.04,
      depthWrite: false,
    });
    const baseHeat = status ? (status === "danger" ? 0.85 : status === "warning" ? 0.5 : 0.2) : heat;
    m.userData.baseOpacity = 0.38 + baseHeat * 0.32;
    m.userData.heatFactor = 0.88 + baseHeat * 0.2 + (scanning ? 0.06 : 0);
    return m;
  }, [color, heat, status, scanning]);

  const haloMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#7dd3fc",
        emissive: "#5ecfff",
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0,
        roughness: 0.85,
        metalness: 0,
        depthWrite: false,
      }),
    []
  );
  useEffect(() => {
    haloMatRef.current = haloMat;
  }, [haloMat]);

  useFrame(({ clock }, delta) => {
    const target = selected ? 1.07 : 1;
    scaleSmoothed.current += (target - scaleSmoothed.current) * Math.min(1, delta * 10);
    if (groupRef.current) {
      const s = scaleSmoothed.current;
      groupRef.current.scale.setScalar(s);
    }

    const m = meshRef.current?.material;
    if (m && m.opacity !== undefined) {
      const t = clock.elapsedTime;
      const pulse = scanning ? 0.9 + 0.1 * Math.sin(t * 3.2) : 0.94 + 0.06 * Math.sin(t * 1.8);
      const base = m.userData.baseOpacity ?? 0.45;
      const hf = m.userData.heatFactor ?? 1;
      m.opacity = Math.min(0.85, base * pulse * hf);
    }

    const hm = haloMatRef.current;
    if (hm) {
      const t = clock.elapsedTime;
      const targetOp = selected ? 0.14 + 0.06 * Math.sin(t * 2.4) : 0;
      hm.opacity += (targetOp - hm.opacity) * Math.min(1, delta * 12);
    }
  });

  useEffect(() => {
    return () => mat.dispose();
  }, [mat]);

  return (
    <group ref={groupRef} position={pos}>
      <mesh
        ref={meshRef}
        material={mat}
        renderOrder={5}
        onClick={(e) => {
          e.stopPropagation();
          if (typeof onSelect === "function" && organKey) onSelect(organKey);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          gl.domElement.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          gl.domElement.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[r, sphereSeg, sphereSeg]} />
      </mesh>
      <mesh renderOrder={4} material={haloMat}>
        <sphereGeometry args={[r * 1.14, Math.max(14, sphereSeg - 6), Math.max(14, sphereSeg - 6)]} />
      </mesh>
    </group>
  );
}

function HeatBlob({ pos, r, heat, scanning, sphereSeg }) {
  const meshRef = useRef(null);
  const color = useMemo(() => heatColor(heat), [heat]);
  const mat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.08 + heat * 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    m.userData.baseOpacity = 0.08 + heat * 0.2;
    m.userData.heatFactor = scanning ? 1.12 : 1;
    return m;
  }, [color, heat, scanning]);

  useFrame(({ clock }) => {
    const m = meshRef.current?.material;
    if (!m || m.opacity === undefined) return;
    const t = clock.elapsedTime;
    const pulse = scanning ? 0.9 + 0.1 * Math.sin(t * 2.8) : 0.94 + 0.06 * Math.sin(t * 1.5);
    const base = m.userData.baseOpacity ?? 0.12;
    const hf = m.userData.heatFactor ?? 1;
    m.opacity = Math.min(0.55, base * pulse * hf);
  });

  useEffect(() => {
    return () => mat.dispose();
  }, [mat]);

  return (
    <mesh ref={meshRef} position={pos} material={mat} renderOrder={3}>
      <sphereGeometry args={[r, sphereSeg, sphereSeg]} />
    </mesh>
  );
}

function heatColor(intensity) {
  const c = new THREE.Color("#3dd4b0");
  const t1 = Math.min(1, Math.max(0, (intensity - 0.15) / 0.38));
  const t2 = Math.min(1, Math.max(0, (intensity - 0.45) / 0.55));
  c.lerp(new THREE.Color("#e8c86a"), t1 * 0.85);
  c.lerp(new THREE.Color("#e07070"), t2 * 0.85);
  return c;
}

/* 不在模块顶层 preload：缺文件时易未捕获 Promise 拒绝；首屏由 useGLTF 按需加载即可 */
