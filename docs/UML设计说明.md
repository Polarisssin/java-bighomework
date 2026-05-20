# 东软颐养中心 — UML 设计说明（v1.5.0）

基于当前实现：`frontend/`（Vue3）、`backend/`（Spring Boot）、`cloudfunctions/elderCareApi`（线上 API）、`sql/init.sql`（领域模型）。

---

## 1. 系统部署/组件图（Component Diagram）

```mermaid
flowchart TB
  subgraph client [客户端]
    Browser[浏览器]
    Vue[Vue3 + Element Plus + Pinia]
    Browser --> Vue
  end

  subgraph deploy [腾讯云 CloudBase 线上]
    Hosting[静态托管 neusoft/v1]
    CFN[云函数 elderCareApi]
    MySQL[(MySQL VPC)]
    Hosting --> Vue
    Vue -->|HTTPS /api| CFN
    CFN --> MySQL
  end

  subgraph local [本地实训可选]
    Spring[Spring Boot 3 + JWT]
    MySQLLocal[(MySQL elder_care)]
    Vue -.->|开发代理| Spring
    Spring --> MySQLLocal
  end
```

---

## 2. 用例图（Use Case Diagram）

```mermaid
flowchart LR
  subgraph actors [参与者]
    Admin((系统管理员))
    Nurse((健康管家))
  end

  subgraph adminUC [管理员用例]
    UC1[入住/编辑/退住归档]
    UC2[床位示意图与管理]
    UC3[护理项目/级别配置]
    UC4[客户护理设置与购买]
    UC5[服务关注与续费]
    UC6[外出/退住审批]
    UC7[用户管理]
    UC8[分配健康管家]
    UC9[工作台统计]
  end

  subgraph nurseUC [管家用例]
    UN1[查看负责老人]
    UN2[日常护理计划]
    UN3[登记护理记录]
    UN4[外出/退住申请]
    UN5[老人状态/身体详情]
  end

  Admin --> UC1 & UC2 & UC3 & UC4 & UC5 & UC6 & UC7 & UC8 & UC9
  Nurse --> UN1 & UN2 & UN3 & UN4 & UN5
  Nurse -.->|只读部分| UC2
```

---

## 3. 领域类图（Class Diagram — 核心实体）

逻辑关联与数据库表一致；`<<extension>>` 表示线上扩展表。

```mermaid
classDiagram
  direction TB

  class Role {
    +int id
    +String name
  }

  class SysUser {
    +int id
    +String username
    +String nickname
    +String phoneNumber
    +int roleId
  }

  class Menu {
    +int id
    +String title
    +String path
    +int parentId
  }

  class RoleMenu {
    +int roleId
    +int menuId
  }

  class Room {
    +int id
    +String roomFloor
    +int roomNo
  }

  class Bed {
    +int id
    +int roomNo
    +String bedNo
    +int bedStatus
  }

  class Customer {
    +int id
    +String customerName
    +int residentStatus
    +Date checkinDate
    +Date expirationDate
    +int bedId
    +int userId
    +int levelId
  }

  class BedDetails {
    +int id
    +Date startDate
    +Date endDate
    +int useStatus
  }

  class NurseContent {
    +int id
    +String serialNumber
    +String nursingName
    +int status
  }

  class NurseLevel {
    +int id
    +String levelName
    +int levelStatus
  }

  class NurseLevelItem {
    +int levelId
    +int itemId
  }

  class CustomerNurseItem {
    +int id
    +int customerId
    +int itemId
    +int nurseNumber
    +Date buyTime
    +Date maturityTime
  }

  class NurseRecord {
    +int id
    +int customerId
    +int itemId
    +DateTime nursingTime
    +int userId
  }

  class Outward {
    +int id
    +int customerId
    +Date outgoingtime
    +int auditstatus
    +String auditperson
  }

  class Backdown {
    +int id
    +int customerId
    +Date retreattime
    +int retreattype
    +int auditstatus
  }

  class CustomerOrganStatus {
    <<extension>>
    +int customerId
    +String organKey
    +String status
  }

  Role "1" --> "*" SysUser : role_id
  Role "*" --> "*" Menu : RoleMenu
  Room "1" --> "*" Bed : room
  Customer "0..1" --> "1" Bed : bed_id
  Customer "*" --> "0..1" SysUser : 管家 user_id
  Customer "*" --> "0..1" NurseLevel : level_id
  Customer "1" --> "*" BedDetails
  Bed "1" --> "*" BedDetails
  NurseLevel "*" --> "*" NurseContent : NurseLevelItem
  Customer "*" --> "*" NurseContent : CustomerNurseItem
  Customer "1" --> "*" NurseRecord
  NurseContent "1" --> "*" NurseRecord : item_id
  SysUser "1" --> "*" NurseRecord : 执行人
  Customer "1" --> "*" Outward
  Customer "1" --> "*" Backdown
  Customer "1" --> "*" CustomerOrganStatus
```

---

## 4. 后端分层类图（Spring Boot 简化）

```mermaid
classDiagram
  direction LR

  class AuthController
  class CustomerController
  class BedController
  class NurseController
  class ApprovalController
  class UserController
  class DashboardController

  class AuthService
  class CustomerService
  class BedService
  class CustomerNurseItemService
  class ApprovalService

  class CustomerMapper
  class BedMapper
  class SysUserMapper

  class Customer
  class Bed
  class SysUser

  AuthController --> AuthService
  CustomerController --> CustomerService
  BedController --> BedService
  NurseController --> CustomerNurseItemService
  ApprovalController --> ApprovalService

  CustomerService --> CustomerMapper
  BedService --> BedMapper
  AuthService --> SysUserMapper

  CustomerMapper ..> Customer
  BedMapper ..> Bed
  SysUserMapper ..> SysUser
```

线上云函数 `handler.js` 与上述 Controller 职责**同构**（REST 路径 `/api/*`），未单独画包图。

---

## 5. 登录与鉴权时序图（Sequence Diagram）

```mermaid
sequenceDiagram
  actor U as 用户
  participant V as Vue前端
  participant A as API层
  participant D as MySQL

  U->>V: 输入账号密码
  V->>A: POST /api/auth/login
  A->>D: 校验 user 表
  D-->>A: 用户 + role_id
  A->>D: 查询 rolemenu + menu
  A-->>V: token + user + menus
  V->>V: Pinia 存储，路由守卫
  V-->>U: 进入工作台/菜单页
```

---

## 6. 入住登记时序图（核心业务）

```mermaid
sequenceDiagram
  actor A as 管理员
  participant V as 入住登记页
  participant API as elderCareApi
  participant DB as MySQL

  A->>V: 填写老人信息、选床位
  V->>API: POST /api/customers/checkin
  API->>DB: INSERT customer
  API->>DB: UPDATE bed bed_status=2
  API->>DB: INSERT beddetails 使用记录
  opt 设置护理级别
    API->>DB: UPDATE customer.level_id
    API->>DB: 可选 batch 购买护理项目
  end
  API-->>V: 客户对象
  V-->>A: 列表刷新
```

---

## 7. 护理业务状态（v1.5.0 职责）

```mermaid
stateDiagram-v2
  [*] --> 自理老人: 无 level_id
  自理老人 --> 护理老人: 应用护理级别
  护理老人 --> 已购项目: 批量/单独购买
  已购项目 --> 服务正常: 未到期且次数>0
  已购项目 --> 待续费: 到期或欠费
  待续费 --> 已购项目: 服务关注续费
  护理老人 --> 自理老人: 移除护理级别
```

---

## 8. 图例与范围说明

| 项目 | 说明 |
|------|------|
| 版本 | 对齐 Git 标签 **v1.5.0** |
| 未实现 UI | `food` / `meal` / `customerpreference` 表在库中存在，无前端页面 |
| 扩展 | `customer_organ_status` 器官状态（3D 身体详情） |
| 角色 | `role_id=1` 管理员；`role_id=2` 健康管家 |

## 9. 报告用彩色类图 PNG（与实训模板同风格）

已生成 **领域类图**（分模块配色、继承、属性与方法）：

| 文件 | 说明 |
|------|------|
| [docs/uml/elder-care-class-diagram.png](uml/elder-care-class-diagram.png) | 可直接插入 Word/PPT |
| [docs/uml/elder-care-class-diagram.puml](uml/elder-care-class-diagram.puml) | PlantUML 源文件，可改后重导 |

重新导出：

```bash
node scripts/render-plantuml.mjs
```

---

导出其他 Mermaid 图：可将下文代码在 [mermaid.live](https://mermaid.live) 中渲染为 PNG。
