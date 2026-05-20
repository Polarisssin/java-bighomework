const MODEL_FILE =
  (import.meta.env.VITE_BODY_MODEL_FILE || "skeleton.glb").replace(/^\/+/, "").trim() || "skeleton.glb";

export const BODY_MODEL_FILENAME = MODEL_FILE;

export const BODY_MODEL_GLB = `${import.meta.env.BASE_URL}models/${MODEL_FILE}?v=${__MODEL_ASSET_V__}`;
