# 东软颐养中心（Neusoft Elder Care）

大一下 Java 程序设计大作业 · 养老院客户、床位、护理、健康管家与审批管理。

## 在线演示

https://health-app-env-3g73ck72bcb11c66-1401396930.tcloudbaseapp.com/neusoft/v1/

**GitHub**：https://github.com/Polarisssin/java-bighomework

### 演示账号

| 账号 | 密码 | 角色 |
|------|------|------|
| `admin` | `admin` | 系统管理员（可看全部老人） |
| `nurse01` | `nurse01` | 健康管家（仅看分配给自己的客户） |

密码在库中为 **BCrypt** 存储；若从旧库升级，见 `sql/migrate-password-bcrypt.sql` 与 `scripts/migrate-password-bcrypt.ps1`。

### 种子老人（6 位）

`sql/cloud-init-data.sql`：王建国、李秀英、张明华、陈淑芬、刘德福、赵玉兰。  
若列表里出现 **「自测A/B/C」**，为接口自测时临时登记的数据，可执行 `scripts/cleanup-selftest-customers.ps1` 清理。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3、Vite、Element Plus、Pinia、Vue Router |
| 后端（课程） | Spring Boot 3、MyBatis-Plus、JWT、BCrypt |
| 后端（线上） | 腾讯云云函数 `elderCareApi`（Node.js + bcryptjs） |
| 数据库 | MySQL |
| 部署 | CloudBase 静态托管 + 云函数 |

详见 [docs/JAVA与Web技术说明.md](docs/JAVA与Web技术说明.md)。

## 版本与修 Bug 迭代

本项目通过 **多版本迭代** 修复编码、权限、需求缺口、安全与业务逻辑问题：

- [CHANGELOG.md](CHANGELOG.md) — 按版本的变更摘要  
- [docs/迭代记录.md](docs/迭代记录.md) — 问题现象、原因、修复方式（适合报告）  
- Git **Tags**：`v1.0.0` … `v1.5.0` 为历史标签；**v1.6 / v1.7** 见 CHANGELOG（可按需打 tag）

```text
v1.0.0 基线 → v1.1.0 上云 → v1.2.0 中文乱码 → v1.3.0 权限/工作台
→ v1.4.0 需求规格补齐 → v1.5.0 护理流程整理
→ v1.6.0 安全/RBAC/占床事务 → v1.7.0 BCrypt 密码与运维脚本
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

配置 `cloudbaserc.json`（参考 `cloudbaserc.example.json`，**勿提交含密码的文件**），部署见 `frontend/package.json` 中 `deploy:hosting`。

## 常用脚本

| 脚本 | 说明 |
|------|------|
| `scripts/push-github.ps1` | 推送 GitHub（清理 Git/环境代理，避免 Clash 导致 TLS reset） |
| `scripts/migrate-password-bcrypt.ps1` | 云 MySQL 执行 BCrypt 密码迁移 |
| `scripts/cleanup-selftest-customers.ps1` | 删除「自测A/B/C」等接口测试产生的临时客户 |
| `scripts/init-cloud-db.ps1` | 云库建表 + 灌种子数据（耗时数分钟） |

推送 GitHub 时**不要**设置全局 `git config http.proxy=127.0.0.1:7890`；若直连失败，可临时：`git -c http.proxy=http://127.0.0.1:7890 push origin main`。

## 目录结构

```text
frontend/          # Vue 管理端
backend/           # Spring Boot
cloudfunctions/    # 云函数 elderCareApi
sql/               # 建表、种子、迁移与清理 SQL
docs/              # 说明、迭代记录、需求对照
scripts/           # 部署、数据库与 Git 工具脚本
基础编程实训/      # 课程 PDF/答辩资料（PDF 默认不入库）
```

## 文档索引

| 文档 | 说明 |
|------|------|
| [CHANGELOG.md](CHANGELOG.md) | 版本更新摘要 |
| [docs/迭代记录.md](docs/迭代记录.md) | 修 Bug 时间线 |
| [docs/需求规格对照清单.md](docs/需求规格对照清单.md) | 与 PDF 规格符合度 |
| [docs/护理模块说明.md](docs/护理模块说明.md) | 护理菜单职责划分 |
| [docs/GITHUB上传指南.md](docs/GITHUB上传指南.md) | 推送到 GitHub |

## License

实训课程项目，仅供学习交流。
