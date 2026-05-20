# 东软颐养中心（Neusoft Elder Care）

Java 实训项目：养老院客户、床位、护理、健康管家与审批管理。

## 在线演示

https://health-app-env-3g73ck72bcb11c66-1401396930.tcloudbaseapp.com/neusoft/v1/

演示账号（见 `sql/cloud-init-data.sql`）：`admin` / `admin`，`nurse01` / `nurse01`

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3、Vite、Element Plus、Pinia、Vue Router |
| 后端（课程） | Spring Boot 3、MyBatis-Plus、JWT |
| 后端（线上） | 腾讯云云函数 `elderCareApi`（Node.js） |
| 数据库 | MySQL |
| 部署 | CloudBase 静态托管 + 云函数 |

详见 [docs/JAVA与Web技术说明.md](docs/JAVA与Web技术说明.md)。

## 版本与修 Bug 迭代

本项目通过 **多版本迭代** 修复编码、权限、需求缺口与业务逻辑问题：

- [CHANGELOG.md](CHANGELOG.md) — 按版本的变更摘要  
- [docs/迭代记录.md](docs/迭代记录.md) — 问题现象、原因、修复方式（适合报告）  
- Git **Tags**：`v1.0.0` … `v1.5.0` 标记里程碑  

```text
v1.0.0 基线 → v1.1.0 上云 → v1.2.0 中文乱码 → v1.3.0 权限/工作台
→ v1.4.0 需求规格补齐 → v1.5.0 护理流程整理
```

## 本地运行

### 方式 A：Java 后端（实训答辩推荐）

```bash
mysql -u root -p < sql/init.sql
cd backend && mvn spring-boot:run
```

```bash
cd frontend
copy .env.example .env.development
# 确认 VITE_API_BASE=http://127.0.0.1:8080/api
npm install && npm run dev
```

### 方式 B：云函数 API

配置 `cloudbaserc.json`（参考 `cloudbaserc.example.json`），部署见 `frontend/package.json` 中 `deploy:hosting`。

## 目录结构

```text
frontend/          # Vue 管理端
backend/           # Spring Boot
cloudfunctions/    # 云函数 elderCareApi
sql/               # 建表与种子数据
docs/              # 说明、迭代记录、需求对照
scripts/           # 部署与工具脚本
```

## 文档索引

| 文档 | 说明 |
|------|------|
| [docs/迭代记录.md](docs/迭代记录.md) | 修 Bug 时间线 |
| [docs/需求规格对照清单.md](docs/需求规格对照清单.md) | 与 PDF 规格符合度 |
| [docs/护理模块说明.md](docs/护理模块说明.md) | 护理菜单职责划分 |
| [docs/GITHUB上传指南.md](docs/GITHUB上传指南.md) | 推送到 GitHub |

## License

实训课程项目，仅供学习交流。
