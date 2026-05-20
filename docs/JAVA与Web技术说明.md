# 东软颐养中心 — Java 实训 vs 实际上线技术说明

## 是不是更像 Web 作业？

**线上演示版本：是的，偏全栈 Web（Vue + Node 云函数）。**  
**课程要求的 Java 部分：在 `backend/` 目录，是完整的 Spring Boot 工程。**

| 维度 | 线上环境（当前默认） | Java 本地版（`backend/`） |
|------|----------------------|---------------------------|
| 前端 | Vue 3 + Element Plus | 同一套前端 |
| 后端 | Node 云函数 `elderCareApi` | Spring Boot 3 + MyBatis-Plus |
| 数据库 | 腾讯云 MySQL | 本地 MySQL `elder_care` |
| 认证 | Base64 Token（实训可再升级 JWT） | JWT（`JwtUtil`） |
| 部署 | CloudBase 静态托管 + 云函数 | `java -jar` 或 Docker |

答辩时可以这样说：

> 业务采用前后端分离：前端 Vue3；后端实现了 **两套**——课程标准的 **Java/Spring Boot**（`backend/`），以及部署在腾讯云上的 **Node 云函数** 以便免服务器演示。数据库设计按实训 PDF 的 18 张表实现。

## 如何用 Java 后端跑通（给阅卷/答辩）

1. 初始化库：`mysql < sql/init.sql`
2. 启动 Spring Boot：`cd backend && mvn spring-boot:run`
3. 修改前端开发配置 `frontend/.env.development`：

```env
VITE_API_BASE=http://127.0.0.1:8080/api
```

4. `cd frontend && npm run dev`，浏览器访问本地前端，即走 **Java API**。

Swagger：`http://127.0.0.1:8080/swagger-ui.html`

## 本次已对齐的能力（Java 与云函数均有或仅云函数）

| 功能 | 云函数 | Spring Boot |
|------|--------|-------------|
| 工作台统计 `/api/dashboard/stats` | ✅ | ✅ |
| 用户重置密码 | ✅ | ✅ |
| 用户启用/禁用 | ✅ | ✅ |
| 路由按菜单鉴权 | 前端 | 前端 |

## 建议实训报告结构

1. **需求分析** — 引用 PDF 规格说明书  
2. **数据库设计** — `sql/init.sql` ER 说明  
3. **Java 后端设计** — Spring Boot 分层、JWT、MyBatis-Plus  
4. **前端设计** — Vue 组件、路由、权限  
5. **部署方案** — CloudBase 全栈 + 可选 Java 本地  
6. **测试** — 管理员/管家账号用例  

这样既满足「Java 实训」又不否认你们已经做好的 Web 云部署。
