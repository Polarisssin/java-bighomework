# 腾讯云 MySQL 配置说明

## 环境

- 环境 ID：`health-app-env-3g73ck72bcb11c66`
- 默认数据库名：`health-app-env-3g73ck72bcb11c66`
- MySQL 内网地址：`172.17.0.6:3306`（须与云函数同 VPC）
- VPC：`vpc-s0pgj4q2`，子网：`subnet-2cxcyxsn`（已写入 `cloudbaserc.json`）

## 初始化表结构（已成功执行）

```powershell
cd E:\java实训
powershell -ExecutionPolicy Bypass -File scripts\init-cloud-db.ps1
```

脚本会逐条执行 `sql/cloud-init-schema.sql` 与 `sql/cloud-init-data.sql`。

## 云函数环境变量（须在控制台补全密码）

| 变量 | 说明 |
|------|------|
| `DB_HOST` | `172.17.0.6`（已在 cloudbaserc.json 配置） |
| `DB_PORT` | `3306` |
| `DB_USER` | `eldercare`（在控制台「账号管理」新建的账号，勿用 root） |
| `DB_PASSWORD` | 新建账号时设置的密码（须在云函数环境变量中填写） |
| `DB_NAME` | `health-app-env-3g73ck72bcb11c66` |

获取密码：腾讯云开发控制台 → 数据库 → MySQL → 实例详情 → 账号管理。

## 关联 MySQL（推荐）

云开发控制台 → 云函数 → `elderCareApi` → 高级配置 → 关联资源 → 选择 MySQL 实例，可自动注入连接信息。

## 验证

1. 登录后台，护理管理 → 护理项目 → 新增一条
2. 客户护理设置 → 选老人 → 购买护理项目
3. 云开发控制台 → 数据库 → MySQL → 执行 `SELECT * FROM nursecontent`
