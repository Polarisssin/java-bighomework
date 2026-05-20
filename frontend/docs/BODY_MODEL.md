# 更换人体 3D 模型

1. 将 `.glb` 放到 **`public/models/`** 下。默认请求 **`skeleton.glb`**（与 `src/config/body-model.ts` 一致）；**构建前须存在该文件**，否则线上 404、扫描区会退化为占位胶囊体。
2. 若使用其它文件名：在 **`.env.production` / `.env.local`** 中设置 `VITE_BODY_MODEL_FILE=仅文件名.glb`。
3. 若新模型比例或朝向不同，需在 **`src/components/body-scan/BodyScan3D.jsx`** 中微调：
   - 外层 `group` 的 `position` / `scale`
   - `src/config/organ-hotspots.ts` 里各器官的 `pos` / `r`，以及 `ORGAN_HOTSPOT_Y_LIFT` / `ORGAN_HOTSPOT_Z_INWARD`

GLB 不在 Git 中，请从 ai-builder 构建机、`dist/models/` 或 CDN 拷贝实际文件到本目录。
