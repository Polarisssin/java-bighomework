# 更新日志

本项目按迭代修复问题，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.7.0] - 2026-05-25

### 新增

- **密码 BCrypt**：Spring `BCryptPasswordEncoder`；云函数 `password.js`（bcryptjs）；创建/重置/改密统一加密存储
- **密码策略**：`PasswordPolicy` 校验长度与复杂度；登录请求字段校验
- **运维脚本**：`scripts/migrate-password-bcrypt.ps1`（云 MySQL 迁移）；`scripts/push-github.ps1`（清理 Git/系统代理后推送，避免 Clash 导致 TLS reset）

### 变更

- 种子数据与 `sql/migrate-password-bcrypt.sql` 使用 BCrypt 哈希；历史明文密码在登录成功时自动升级为哈希
- `UserVo` 响应不再返回密码字段

### 文档

- 更新 `docs/迭代记录.md`、`docs/需求规格对照清单.md`（密码安全项）

## [1.6.0] - 2026-05-20

### 新增

- **Spring 安全**：`@PreAuthorize` 接口级权限；401/403 统一 JSON 响应；`SecurityUtils` 取当前用户
- **云函数鉴权**：除登录/健康检查外需 Bearer Token；审批、用户管理等 `requireAdmin`
- **前端守卫**：路由校验 `localStorage.token`；`request.ts` 401 跳转登录；危险操作 `confirm-danger.ts` 二次确认

### 修复

- **入住占床**：事务 + `SELECT … FOR UPDATE`，避免并发重复占同一床位
- **护理扣次**：购买数量不足时拒绝扣减并提示
- **审批**：防止重复通过/驳回；外出审批补管理员校验
- **管家数据范围**：非管理员仅可见负责客户相关数据
- **合同/入住**：日期与业务规则校验（与云函数侧对齐）

### 变更

- 云函数 `withTransaction` 支持入住等写操作原子提交

## [1.5.0] - 2026-05-19

### 变更

- **护理模块职责整理**：客户护理设置负责购买/级别；服务关注仅续费；应用级别与批量购买分离
- 云函数：设置护理级别时不再自动批量购买

### 文档

- 新增 `docs/护理模块说明.md`

## [1.4.0] - 2026-05-19

### 新增（对照需求规格说明书）

- 床位使用记录 `beddetails` 查询与结束日修改
- 护理级别新增/启停、用户创建、服务关注续费
- 客户护理：移除级别、批量购买级别项目
- 审批记录展示审批人、审批时间
- 入住登记默认筛选自理老人

### 部署

- 静态托管 + `elderCareApi` 云函数上线

## [1.3.0] - 2026-05-18

### 新增

- 首页工作台统计 API
- 路由/菜单角色权限守卫
- 用户管理：重置密码、启用/停用
- 3D 身体详情路由级懒加载

## [1.2.0] - 2026-05-17

### 修复

- 修复生产环境中文显示为 `????`（`ui-text.ts` Unicode 转义 + `ascii-dist` 构建后处理）
- 修复 `MainLayout` 等文件编码损坏
- 登录页与布局动效回退，避免异常字符

## [1.1.0] - 2026-05-16

### 新增

- 腾讯云 CloudBase 部署链路（静态托管 + 云函数 + VPC MySQL）
- 云函数 `elderCareApi` 对接 MySQL

## [1.0.0] - 2026-05-15

### 新增

- 东软颐养中心核心业务：客户、床位、护理、健康管家、审批
- 前端 Vue 3 + Element Plus + Pinia
- 后端 Spring Boot 3（`backend/`）与云函数双实现
- 数据库脚本 `sql/init.sql`
