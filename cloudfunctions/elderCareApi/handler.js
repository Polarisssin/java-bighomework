"use strict";

const db = require("./db");
const M = require("./mappers");

const MENUS = [
  { id: 23, menusIndex: "0", title: "工作台", icon: "Odometer", path: "/dashboard", parentId: null },
  { id: 1, menusIndex: "1", title: "客户管理", icon: "User", path: null, parentId: null },
  { id: 2, menusIndex: "1", title: "入住登记", icon: "House", path: "/customer/checkin", parentId: 1 },
  { id: 3, menusIndex: "1", title: "退住登记", icon: "Remove", path: "/customer/backdown", parentId: 1 },
  { id: 4, menusIndex: "1", title: "外出登记", icon: "Position", path: "/customer/outward", parentId: 1 },
  { id: 5, menusIndex: "2", title: "床位管理", icon: "Grid", path: null, parentId: null },
  { id: 6, menusIndex: "2", title: "床位示意图", icon: "DataBoard", path: "/bed/diagram", parentId: 5 },
  { id: 7, menusIndex: "2", title: "床位管理", icon: "Tickets", path: "/bed/manage", parentId: 5 },
  { id: 8, menusIndex: "3", title: "护理管理", icon: "FirstAidKit", path: null, parentId: null },
  { id: 9, menusIndex: "3", title: "护理项目", icon: "List", path: "/nurse/content", parentId: 8 },
  { id: 10, menusIndex: "3", title: "护理级别", icon: "Rank", path: "/nurse/level", parentId: 8 },
  { id: 11, menusIndex: "3", title: "客户护理设置", icon: "Setting", path: "/nurse/customer-setting", parentId: 8 },
  { id: 12, menusIndex: "3", title: "护理记录", icon: "Document", path: "/nurse/record", parentId: 8 },
  { id: 13, menusIndex: "4", title: "健康管家", icon: "Avatar", path: null, parentId: null },
  { id: 14, menusIndex: "4", title: "设置服务对象", icon: "Connection", path: "/health/assign", parentId: 13 },
  { id: 15, menusIndex: "4", title: "服务关注", icon: "View", path: "/health/service", parentId: 13 },
  { id: 16, menusIndex: "5", title: "用户管理", icon: "UserFilled", path: "/user/manage", parentId: null },
];

const CAREGIVER_MENUS = [
  { id: 23, menusIndex: "0", title: "工作台", icon: "Odometer", path: "/dashboard", parentId: null },
  { id: 17, menusIndex: "6", title: "健康管家", icon: "Suitcase", path: null, parentId: null },
  { id: 27, menusIndex: "6", title: "老人状态", icon: "View", path: "/caregiver/elders", parentId: 17 },
  { id: 18, menusIndex: "6", title: "日常护理", icon: "EditPen", path: "/caregiver/daily", parentId: 17 },
  { id: 19, menusIndex: "6", title: "护理记录", icon: "Notebook", path: "/caregiver/record", parentId: 17 },
  { id: 20, menusIndex: "7", title: "客户管理", icon: "User", path: null, parentId: null },
  { id: 21, menusIndex: "7", title: "外出申请", icon: "Promotion", path: "/caregiver/outward", parentId: 20 },
  { id: 22, menusIndex: "7", title: "退住申请", icon: "Back", path: "/caregiver/backdown", parentId: 20 },
];

function menusForRole(roleId) {
  return roleId === 1 ? MENUS : CAREGIVER_MENUS;
}

async function menusForRoleFromDb(roleId) {
  try {
    const rows = await db.query(
      `SELECT m.id, m.menus_index, m.title, m.icon, m.path, m.parent_id
       FROM menu m INNER JOIN rolemenu rm ON rm.menu_id=m.id
       WHERE rm.role_id=? ORDER BY m.id`,
      [roleId]
    );
    if (rows && rows.length) {
      return rows.map((r) => ({
        id: r.id,
        menusIndex: r.menus_index,
        title: r.title,
        icon: r.icon,
        path: r.path,
        parentId: r.parent_id,
      }));
    }
  } catch {
    /* menu 表未初始化时回退静态菜单 */
  }
  return menusForRole(roleId);
}

function addMonthsIso(dateStr, months) {
  const d = new Date(String(dateStr).slice(0, 10));
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function computeServiceStatus(row) {
  if (row.isLevelTemplate) return "未购买";
  const mat = String(row.maturityTime || row.maturity_time || "").slice(0, 10);
  const num = Number(row.nurseNumber ?? row.nurse_number ?? 0);
  const today = todayIso();
  if (num <= 0) return "欠费";
  if (mat && mat < today) return "到期";
  if (mat && mat >= today && num > 0) return "数量正常";
  return "未到期";
}

let bedDetailsReady = false;
async function ensureBedDetailsTable() {
  if (bedDetailsReady) return;
  await db.query(
    `CREATE TABLE IF NOT EXISTS beddetails (
      id INT PRIMARY KEY AUTO_INCREMENT,
      start_date DATE NULL,
      end_date DATE NULL,
      bed_details VARCHAR(255) NULL,
      customer_id INT NULL,
      bed_id INT NULL,
      is_deleted INT NOT NULL DEFAULT 0,
      use_status INT NOT NULL DEFAULT 1 COMMENT '1正在使用 2历史',
      KEY idx_bd_customer (customer_id)
    ) ENGINE=InnoDB`
  );
  bedDetailsReady = true;
}

async function bedDetailLabel(bedId) {
  const bed = await db.queryOne("SELECT room_no, bed_no FROM bed WHERE id=?", [bedId]);
  return bed ? `${bed.room_no}-${bed.bed_no}` : "";
}

async function openBedDetail(customerId, bedId, startDate, endDate) {
  if (!bedId) return;
  await ensureBedDetailsTable();
  const details = await bedDetailLabel(bedId);
  await db.query(
    `INSERT INTO beddetails (start_date,end_date,bed_details,customer_id,bed_id,is_deleted,use_status)
     VALUES (?,?,?,?,?,0,1)`,
    [startDate || todayIso(), endDate || null, details, customerId, bedId]
  );
}

async function closeActiveBedDetail(customerId, bedId, endDate) {
  if (!bedId) return;
  await ensureBedDetailsTable();
  await db.query(
    `UPDATE beddetails SET end_date=?, use_status=2
     WHERE customer_id=? AND bed_id=? AND use_status=1 AND is_deleted=0`,
    [endDate || todayIso(), customerId, bedId]
  );
}

async function syncBedDetailEndDate(customerId, endDate) {
  await ensureBedDetailsTable();
  await db.query(
    `UPDATE beddetails SET end_date=? WHERE customer_id=? AND use_status=1 AND is_deleted=0`,
    [endDate, customerId]
  );
}

async function batchPurchaseLevelItems(customerId, levelId) {
  if (!levelId) return 0;
  const effectiveIds = await getEffectiveLevelItemIds(levelId);
  const cust = await db.queryOne("SELECT expiration_date FROM customer WHERE id=?", [customerId]);
  const buy = todayIso();
  const maturity = cust?.expiration_date
    ? formatDateOnly(cust.expiration_date)
    : addMonthsIso(buy, 3);
  let added = 0;
  for (const itemId of effectiveIds) {
    const exists = await db.queryOne(
      "SELECT id FROM customernurseitem WHERE customer_id=? AND item_id=? AND is_deleted=0",
      [customerId, itemId]
    );
    if (!exists) {
      await db.query(
        `INSERT INTO customernurseitem (item_id,customer_id,level_id,nurse_number,buy_time,maturity_time,is_deleted)
         VALUES (?,?,?,?,?,?,0)`,
        [itemId, customerId, levelId, 1, buy, maturity]
      );
      added += 1;
    }
  }
  return added;
}

function formatDateOnly(v) {
  if (!v) return todayIso();
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

async function auditorName(authUser) {
  if (!authUser?.uid) return "系统";
  const u = await db.queryOne("SELECT nickname FROM `user` WHERE id=?", [authUser.uid]);
  return u?.nickname || "管理员";
}

function calcAge(birthday) {
  const birth = new Date(birthday);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

function pageOf(records, page = 1, size = 10) {
  const p = Math.max(1, Number(page) || 1);
  const s = Math.max(1, Number(size) || 10);
  const start = (p - 1) * s;
  return {
    records: records.slice(start, start + s),
    total: records.length,
    size: s,
    current: p,
  };
}

const {
  getUserFromEvent,
  getRoleId,
  bedStatusNum,
  assertCaregiverOwnsCustomer,
  requireAdmin,
  validateOutwardDates,
  validateCheckinDates,
  validateBuyMaturityDates,
  validateNurseRecordExecution,
} = require("./util");

const ORGAN_KEYS = ["head", "heart", "lungL", "lungR", "liver", "gut"];
const ORGAN_STATUS_SET = new Set(["normal", "warning", "danger"]);

let organStatusReady = false;
async function ensureOrganStatusTable() {
  if (organStatusReady) return;
  await db.query(
    `CREATE TABLE IF NOT EXISTS customer_organ_status (
      customer_id INT NOT NULL,
      organ_key VARCHAR(16) NOT NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'normal',
      note VARCHAR(255) NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (customer_id, organ_key)
    ) ENGINE=InnoDB`
  );
  organStatusReady = true;
}

function defaultOrganStatusPayload(customerId) {
  const organs = {};
  for (const key of ORGAN_KEYS) organs[key] = { status: "normal", note: "" };
  return { customerId, organs };
}

function parseOrganStatusBody(body) {
  const organs = body?.organs;
  if (!organs || typeof organs !== "object") throw { status: 400, message: "缺少 organs" };
  const out = {};
  for (const key of ORGAN_KEYS) {
    const v = organs[key];
    if (!v) {
      out[key] = { status: "normal", note: "" };
      continue;
    }
    const status =
      typeof v === "string" ? v : typeof v.status === "string" ? v.status : "normal";
    if (!ORGAN_STATUS_SET.has(status)) throw { status: 400, message: `器官 ${key} 状态无效` };
    const note = typeof v === "object" && v.note != null ? String(v.note).slice(0, 255) : "";
    out[key] = { status, note };
  }
  return out;
}

async function loadOrganStatusMap(customerId) {
  await ensureOrganStatusTable();
  const rows = await db.query(
    "SELECT organ_key, status, note FROM customer_organ_status WHERE customer_id=?",
    [customerId]
  );
  const payload = defaultOrganStatusPayload(customerId);
  for (const r of rows) {
    if (ORGAN_KEYS.includes(r.organ_key) && ORGAN_STATUS_SET.has(r.status)) {
      payload.organs[r.organ_key] = { status: r.status, note: r.note || "" };
    }
  }
  return payload;
}

let nurseRecordReady = false;
async function ensureNurseRecordTable() {
  if (nurseRecordReady) return;
  await db.query(
    `CREATE TABLE IF NOT EXISTS nurserecord (
      id INT PRIMARY KEY AUTO_INCREMENT,
      is_deleted INT NOT NULL DEFAULT 0,
      customer_id INT NOT NULL,
      item_id INT NOT NULL,
      nursing_time DATETIME NOT NULL,
      nursing_content VARCHAR(255) NULL,
      nursing_count INT NOT NULL DEFAULT 1,
      user_id INT NOT NULL
    ) ENGINE=InnoDB`
  );
  nurseRecordReady = true;
}

async function mergeCustomerNurseItems(customerId, purchasedRows) {
  const customer = await db.queryOne(
    "SELECT level_id, expiration_date FROM customer WHERE id=? AND is_deleted=0",
    [customerId]
  );
  const purchased = purchasedRows.map(M.mapCustomerNurseItem);
  if (!customer?.level_id) return purchased;
  const effectiveIds = await getEffectiveLevelItemIds(customer.level_id);
  const byItemId = new Map(purchased.map((p) => [p.itemId, p]));
  const contents = await db.query("SELECT id, serial_number, nursing_name FROM nursecontent WHERE is_deleted=0");
  const contentMap = new Map(contents.map((c) => [c.id, c]));
  const result = effectiveIds.map((itemId) => {
    const bought = byItemId.get(itemId);
    if (bought) return bought;
    const nc = contentMap.get(itemId);
    return {
      id: null,
      itemId,
      customerId,
      levelId: customer.level_id,
      serialNumber: nc?.serial_number,
      nursingName: nc?.nursing_name,
      nurseNumber: null,
      buyTime: null,
      maturityTime: null,
      isLevelTemplate: true,
    };
  });
  for (const p of purchased) {
    if (!effectiveIds.includes(p.itemId)) {
      result.push({ ...p, isExtraPurchase: true });
    }
  }
  return result;
}

async function getDirectLevelItemIds(levelId) {
  const rows = await db.query("SELECT item_id FROM nurselevelitem WHERE level_id=?", [levelId]);
  return rows.map((r) => r.item_id);
}

async function getEffectiveLevelItemIds(levelId) {
  const all = [];
  for (let lid = 1; lid <= levelId; lid++) {
    for (const id of await getDirectLevelItemIds(lid)) {
      if (!all.includes(id)) all.push(id);
    }
  }
  return all;
}

async function saveLevelItems(levelId, newItemIds) {
  const ids = (newItemIds || []).map(Number).filter(Boolean);
  if (levelId > 1) {
    const prev = await getEffectiveLevelItemIds(levelId - 1);
    const missing = prev.filter((id) => !ids.includes(id));
    if (missing.length) {
      throw { status: 400, message: `须先包含上一级全部护理项目（缺少: ${missing.join(",")}）` };
    }
  }
  await db.query("DELETE FROM nurselevelitem WHERE level_id=?", [levelId]);
  const prevSet = levelId > 1 ? new Set(await getEffectiveLevelItemIds(levelId - 1)) : new Set();
  for (const itemId of ids.filter((id) => !prevSet.has(id))) {
    await db.query("INSERT INTO nurselevelitem (level_id, item_id) VALUES (?,?)", [levelId, itemId]);
  }
  return getEffectiveLevelItemIds(levelId);
}

async function handle(method, path, body, qs, event) {
  qs = qs || {};
  const authUser = getUserFromEvent(event || {});

  if (method === "POST" && path === "/api/auth/login") {
    const row = await db.queryOne(
      "SELECT * FROM `user` WHERE username=? AND password=? AND is_deleted=0",
      [body.username, body.password]
    );
    if (!row) throw { status: 400, message: "用户名或密码错误" };
    const user = M.mapUser(row);
    delete user.password;
    return {
      token: Buffer.from(JSON.stringify({ uid: user.id, role: user.roleId })).toString("base64"),
      user,
      menus: await menusForRoleFromDb(user.roleId),
    };
  }

  if (!authUser?.uid) {
    throw { status: 401, message: "未登录或登录已过期" };
  }

  if (method === "GET" && path === "/api/customers") {
    const residence = qs.residence || "active";
    let sql;
    const params = [];
    if (residence === "active") {
      sql = "SELECT * FROM customer WHERE is_deleted=0 AND resident_status=1";
    } else if (residence === "retreated") {
      sql = "SELECT * FROM customer WHERE resident_status=2";
    } else {
      sql = "SELECT * FROM customer WHERE is_deleted=0";
    }
    const elderlyType = qs.elderlyType || "all";
    if (elderlyType === "self") sql += " AND level_id IS NULL";
    else if (elderlyType === "nursing") sql += " AND level_id IS NOT NULL";
    if ((qs.name || "").trim()) {
      sql += " AND customer_name LIKE ?";
      params.push(`%${qs.name.trim()}%`);
    }
    const roleId = getRoleId(authUser);
    if (roleId === 2) {
      sql += " AND user_id=?";
      params.push(Number(authUser.uid));
    } else if (qs.assignUserId != null && qs.assignUserId !== "") {
      sql += " AND user_id=?";
      params.push(Number(qs.assignUserId));
    }
    sql += " ORDER BY id DESC";
    const rows = await db.query(sql, params);
    return pageOf(rows.map(M.mapCustomer), qs.page, qs.size);
  }

  if (method === "POST" && path === "/api/customers/checkin") {
    requireAdmin(authUser);
    const checkinErr = validateCheckinDates(body.checkinDate, body.expirationDate);
    if (checkinErr) throw { status: 400, message: checkinErr };
    if (!body.bedId) throw { status: 400, message: "请选择床位" };
    const age = body.birthday ? calcAge(body.birthday) : body.customerAge || 0;
    const customerId = await db.withTransaction(async (tx) => {
      const bed = await tx.queryOne("SELECT * FROM bed WHERE id=? FOR UPDATE", [body.bedId]);
      if (!bed || bedStatusNum(bed.bed_status) !== 1) {
        throw { status: 400, message: "床位不可用" };
      }
      const r = await tx.query(
        `INSERT INTO customer (customer_name,customer_age,customer_sex,idcard,room_no,building_no,
          checkin_date,expiration_date,contact_tel,bed_id,blood_type,filepath,user_id,level_id,family_member,birthday,is_deleted,resident_status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,1)`,
        [
          body.customerName,
          age,
          body.customerSex ?? 0,
          body.idcard || "",
          String(bed.room_no || body.roomNo || ""),
          "606",
          body.checkinDate,
          body.expirationDate,
          body.contactTel || "",
          body.bedId,
          body.bloodType || "A",
          body.filepath || "/avatar/default.png",
          body.userId ?? -1,
          body.levelId || null,
          body.familyMember || null,
          body.birthday || null,
        ]
      );
      const id = r.insertId;
      await tx.query("UPDATE bed SET bed_status=2 WHERE id=?", [body.bedId]);
      return id;
    });
    await openBedDetail(customerId, body.bedId, body.checkinDate, body.expirationDate);
    if (body.levelId) await batchPurchaseLevelItems(customerId, Number(body.levelId));
    return M.mapCustomer(await db.queryOne("SELECT * FROM customer WHERE id=?", [customerId]));
  }

  if (method === "PUT" && path.match(/^\/api\/customers\/\d+$/)) {
    const id = Number(path.split("/").pop());
    const existing = await db.queryOne("SELECT * FROM customer WHERE id=? AND is_deleted=0", [id]);
    if (!existing) throw { status: 404, message: "客户不存在" };
    if (getRoleId(authUser) === 2) {
      await assertCaregiverOwnsCustomer(db, authUser, id);
      if (body.userId !== undefined && Number(body.userId) !== Number(existing.user_id)) {
        throw { status: 403, message: "健康管家不能修改服务对象分配" };
      }
    }
    const checkinDate = body.checkinDate ?? existing.checkin_date;
    const expirationDate = body.expirationDate ?? existing.expiration_date;
    const checkinErr = validateCheckinDates(checkinDate, expirationDate);
    if (checkinErr) throw { status: 400, message: checkinErr };
    const age = body.birthday ? calcAge(body.birthday) : body.customerAge ?? existing.customer_age;
    const newBedId = body.bedId != null ? Number(body.bedId) : existing.bed_id;
    const oldBedId = existing.bed_id;
    if (newBedId !== oldBedId) {
      if (oldBedId) {
        await db.query("UPDATE bed SET bed_status=1 WHERE id=?", [oldBedId]);
        await closeActiveBedDetail(id, oldBedId, todayIso());
      }
      if (newBedId) {
        const newBed = await db.queryOne("SELECT * FROM bed WHERE id=?", [newBedId]);
        if (!newBed || bedStatusNum(newBed.bed_status) !== 1) throw { status: 400, message: "床位不可用" };
        await db.query("UPDATE bed SET bed_status=2 WHERE id=?", [newBedId]);
        body.roomNo = String(newBed.room_no);
        await openBedDetail(id, newBedId, checkinDate, expirationDate);
      }
    }
    if (body.expirationDate && body.expirationDate !== existing.expiration_date) {
      await syncBedDetailEndDate(id, body.expirationDate);
    }
    let residentStatus = existing.resident_status;
    if (newBedId && existing.resident_status === 2) residentStatus = 1;
    const userId = body.userId !== undefined ? Number(body.userId) : existing.user_id;
    await db.query(
      `UPDATE customer SET customer_name=?,customer_age=?,customer_sex=?,idcard=?,room_no=?,
        checkin_date=?,expiration_date=?,contact_tel=?,bed_id=?,blood_type=?,family_member=?,birthday=?,level_id=?,resident_status=?,user_id=?
       WHERE id=?`,
      [
        body.customerName ?? existing.customer_name,
        age,
        body.customerSex ?? existing.customer_sex,
        body.idcard ?? existing.idcard,
        body.roomNo ?? existing.room_no,
        body.checkinDate ?? existing.checkin_date,
        body.expirationDate ?? existing.expiration_date,
        body.contactTel ?? existing.contact_tel,
        newBedId || null,
        body.bloodType ?? existing.blood_type,
        body.familyMember ?? existing.family_member,
        body.birthday ?? existing.birthday,
        body.levelId !== undefined ? body.levelId : existing.level_id,
        residentStatus,
        userId,
        id,
      ]
    );
    return M.mapCustomer(await db.queryOne("SELECT * FROM customer WHERE id=?", [id]));
  }

  if (method === "GET" && path.match(/^\/api\/customers\/\d+\/organ-status$/)) {
    const id = Number(path.split("/")[3]);
    const c = await db.queryOne("SELECT id FROM customer WHERE id=? AND is_deleted=0", [id]);
    if (!c) throw { status: 404, message: "客户不存在" };
    if (getRoleId(authUser) === 2) await assertCaregiverOwnsCustomer(db, authUser, id);
    return loadOrganStatusMap(id);
  }

  if (method === "PUT" && path.match(/^\/api\/customers\/\d+\/organ-status$/)) {
    const id = Number(path.split("/")[3]);
    const c = await db.queryOne("SELECT id FROM customer WHERE id=? AND is_deleted=0", [id]);
    if (!c) throw { status: 404, message: "客户不存在" };
    if (getRoleId(authUser) === 2) await assertCaregiverOwnsCustomer(db, authUser, id);
    const organs = parseOrganStatusBody(body);
    await ensureOrganStatusTable();
    for (const key of ORGAN_KEYS) {
      const { status, note } = organs[key];
      await db.query(
        `INSERT INTO customer_organ_status (customer_id, organ_key, status, note)
         VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), note=VALUES(note)`,
        [id, key, status, note || null]
      );
    }
    return loadOrganStatusMap(id);
  }

  if (method === "DELETE" && path.match(/^\/api\/customers\/\d+$/)) {
    const id = Number(path.split("/").pop());
    const c = await db.queryOne("SELECT * FROM customer WHERE id=? AND is_deleted=0", [id]);
    if (!c) throw { status: 404, message: "客户不存在或已归档" };
    await assertCaregiverOwnsCustomer(db, authUser, id);
    if (c.bed_id) {
      await db.query("UPDATE bed SET bed_status=1 WHERE id=?", [c.bed_id]);
      await closeActiveBedDetail(id, c.bed_id, todayIso());
    }
    await db.query("UPDATE customer SET bed_id=NULL, resident_status=2 WHERE id=?", [id]);
    return { message: "已办理退住归档，历史记录保留" };
  }

  if (method === "GET" && path === "/api/beds/statistics") {
    const beds = await db.query("SELECT bed_status FROM bed");
    const statusOf = (b) => Number(b.bed_status);
    return {
      total: beds.length,
      free: beds.filter((b) => statusOf(b) === 1).length,
      occupied: beds.filter((b) => statusOf(b) === 2).length,
      out: beds.filter((b) => statusOf(b) === 3).length,
    };
  }

  if (method === "GET" && path === "/api/beds/diagram") {
    const floor = String(qs.floor || "1");
    const rooms = await db.query("SELECT * FROM room WHERE room_floor=? ORDER BY room_no", [floor]);
    const data = [];
    for (const room of rooms) {
      let beds = await db.query("SELECT * FROM bed WHERE room_id=? ORDER BY bed_no", [room.id]);
      if (!beds.length) {
        beds = await db.query("SELECT * FROM bed WHERE room_no=? ORDER BY bed_no", [room.room_no]);
      }
      data.push({ room: M.mapRoom(room), beds: (beds || []).map(M.mapBed) });
    }
    return data;
  }

  if (method === "GET" && path === "/api/beds/rooms") {
    const rooms = await db.query("SELECT * FROM room ORDER BY room_floor, room_no");
    return rooms.map(M.mapRoom);
  }

  if (method === "GET" && path === "/api/beds/overview") {
    const statusLabel = (s) => (s === 1 ? "空闲" : s === 2 ? "有人" : "外出");
    const beds = await db.query(
      `SELECT b.*, r.room_floor FROM bed b LEFT JOIN room r ON r.room_no=b.room_no ORDER BY b.room_no, b.bed_no`
    );
    const customers = await db.query(
      "SELECT id, customer_name, bed_id FROM customer WHERE is_deleted=0 AND resident_status=1"
    );
    const byBed = new Map(customers.filter((c) => c.bed_id).map((c) => [c.bed_id, c]));
    const occupied = [];
    const free = [];
    for (const bed of beds) {
      const row = {
        bedId: bed.id,
        roomNo: bed.room_no,
        floor: bed.room_floor || "",
        bedNo: bed.bed_no,
        bedStatus: bed.bed_status,
        bedStatusLabel: statusLabel(bed.bed_status),
        bedLabel: `${bed.room_no}-${bed.bed_no}`,
      };
      if (bedStatusNum(bed.bed_status) === 1) free.push(row);
      else {
        const c = byBed.get(bed.id);
        occupied.push({ ...row, customerId: c?.id ?? null, customerName: c?.customer_name ?? "-" });
      }
    }
    return {
      statistics: {
        total: beds.length,
        free: free.length,
        occupied: beds.filter((b) => bedStatusNum(b.bed_status) === 2).length,
        out: beds.filter((b) => bedStatusNum(b.bed_status) === 3).length,
      },
      occupied,
      free,
    };
  }

  if (method === "GET" && path === "/api/beds/free") {
    let sql = "SELECT * FROM bed WHERE bed_status=1";
    const params = [];
    if (qs.roomNo) {
      sql += " AND room_no=?";
      params.push(Number(qs.roomNo));
    }
    sql += " ORDER BY room_no, bed_no";
    return (await db.query(sql, params)).map(M.mapBed);
  }

  if (method === "POST" && path === "/api/beds/swap") {
    const customerId = Number(qs.customerId);
    const newBedId = Number(qs.newBedId);
    await assertCaregiverOwnsCustomer(db, authUser, customerId);
    await ensureBedDetailsTable();
    const today = todayIso();
    await db.withTransaction(async (tx) => {
      const c = await tx.queryOne("SELECT * FROM customer WHERE id=? AND is_deleted=0 FOR UPDATE", [customerId]);
      if (!c) throw { status: 400, message: "客户不存在" };
      const newBed = await tx.queryOne("SELECT * FROM bed WHERE id=? FOR UPDATE", [newBedId]);
      if (!newBed || bedStatusNum(newBed.bed_status) !== 1) throw { status: 400, message: "目标床位不可用" };
      if (c.bed_id && Number(c.bed_id) === newBedId) throw { status: 400, message: "已在该床位" };
      if (c.bed_id) {
        await tx.query("UPDATE bed SET bed_status=1 WHERE id=?", [c.bed_id]);
        await tx.query(
          `UPDATE beddetails SET end_date=?, use_status=2
           WHERE customer_id=? AND bed_id=? AND use_status=1 AND is_deleted=0`,
          [today, customerId, c.bed_id]
        );
      }
      await tx.query("UPDATE bed SET bed_status=2 WHERE id=?", [newBedId]);
      await tx.query("UPDATE customer SET bed_id=?, room_no=? WHERE id=?", [
        newBedId,
        String(newBed.room_no),
        customerId,
      ]);
      await tx.query(
        `INSERT INTO beddetails (start_date,end_date,bed_details,customer_id,bed_id,is_deleted,use_status)
         VALUES (?,?,?,?,?,0,1)`,
        [today, c.expiration_date || null, `${newBed.room_no}-${newBed.bed_no}`, customerId, newBedId]
      );
    });
    return null;
  }

  if (method === "GET" && path === "/api/beds/details") {
    await ensureBedDetailsTable();
    let sql = `SELECT bd.*, c.customer_name, b.room_no, b.bed_no
      FROM beddetails bd
      LEFT JOIN customer c ON c.id=bd.customer_id
      LEFT JOIN bed b ON b.id=bd.bed_id
      WHERE bd.is_deleted=0`;
    const params = [];
    if ((qs.customerName || "").trim()) {
      sql += " AND c.customer_name LIKE ?";
      params.push(`%${qs.customerName.trim()}%`);
    }
    if (qs.checkinDate) {
      sql += " AND bd.start_date=?";
      params.push(qs.checkinDate);
    }
    if (qs.useStatus != null && qs.useStatus !== "") {
      sql += " AND bd.use_status=?";
      params.push(Number(qs.useStatus));
    }
    sql += " ORDER BY bd.id DESC";
    const rows = await db.query(sql, params);
    const mapped = rows.map((r) => {
      const row = M.rowToCamel(r);
      row.customerName = r.customer_name;
      row.bedLabel = r.room_no && r.bed_no ? `${r.room_no}-${r.bed_no}` : r.bed_details;
      row.useStatusLabel = row.useStatus === 1 ? "正在使用" : "历史";
      return row;
    });
    return pageOf(mapped, qs.page, qs.size);
  }

  if (method === "PUT" && path.match(/^\/api\/beds\/details\/\d+$/)) {
    await ensureBedDetailsTable();
    const id = Number(path.split("/").pop());
    const row = await db.queryOne("SELECT * FROM beddetails WHERE id=? AND is_deleted=0", [id]);
    if (!row) throw { status: 404, message: "记录不存在" };
    if (body.startDate != null) throw { status: 400, message: "仅允许修改结束日期" };
    const endDate = body.endDate || body.end_date;
    if (!endDate) throw { status: 400, message: "请填写结束日期" };
    await db.query("UPDATE beddetails SET end_date=? WHERE id=?", [endDate, id]);
    return M.rowToCamel(await db.queryOne("SELECT * FROM beddetails WHERE id=?", [id]));
  }

  if (method === "GET" && path === "/api/nurse/content") {
    let sql = "SELECT * FROM nursecontent WHERE is_deleted=0";
    const params = [];
    if (qs.status != null && qs.status !== "") {
      sql += " AND status=?";
      params.push(Number(qs.status));
    }
    if ((qs.name || "").trim()) {
      sql += " AND nursing_name LIKE ?";
      params.push(`%${qs.name.trim()}%`);
    }
    sql += " ORDER BY id DESC";
    const rows = await db.query(sql, params);
    return pageOf(rows.map(M.mapNurseContent), qs.page, qs.size);
  }

  if (method === "POST" && path === "/api/nurse/content") {
    const r = await db.query(
      `INSERT INTO nursecontent (serial_number,nursing_name,service_price,message,status,execution_cycle,execution_times,is_deleted)
       VALUES (?,?,?,?,?,?,?,0)`,
      [
        body.serialNumber || "",
        body.nursingName || "",
        body.servicePrice || "0",
        body.message || null,
        body.status ?? 1,
        body.executionCycle || null,
        body.executionTimes || null,
      ]
    );
    return M.mapNurseContent(await db.queryOne("SELECT * FROM nursecontent WHERE id=?", [r.insertId]));
  }

  if (method === "PUT" && path.match(/^\/api\/nurse\/content\/\d+$/)) {
    const id = Number(path.split("/").pop());
    await db.query(
      `UPDATE nursecontent SET serial_number=?,nursing_name=?,service_price=?,message=?,status=?,execution_cycle=?,execution_times=? WHERE id=?`,
      [
        body.serialNumber,
        body.nursingName,
        body.servicePrice,
        body.message || null,
        body.status ?? 1,
        body.executionCycle || null,
        body.executionTimes || null,
        id,
      ]
    );
    return M.mapNurseContent(await db.queryOne("SELECT * FROM nursecontent WHERE id=?", [id]));
  }

  if (method === "DELETE" && path.match(/^\/api\/nurse\/content\/\d+$/)) {
    const id = Number(path.split("/").pop());
    await db.query("UPDATE nursecontent SET is_deleted=1 WHERE id=?", [id]);
    return null;
  }

  if (method === "GET" && path === "/api/nurse/level") {
    let sql = "SELECT * FROM nurselevel WHERE is_deleted=0";
    const params = [];
    if (qs.status != null && qs.status !== "") {
      sql += " AND level_status=?";
      params.push(Number(qs.status));
    }
    sql += " ORDER BY id";
    const rows = await db.query(sql, params);
    return pageOf(rows.map(M.rowToCamel), qs.page, qs.size);
  }

  if (method === "POST" && path === "/api/nurse/level") {
    const r = await db.query(
      "INSERT INTO nurselevel (level_name, level_status, is_deleted) VALUES (?,?,0)",
      [body.levelName || body.level_name || "新级别", body.levelStatus ?? 1]
    );
    return M.rowToCamel(await db.queryOne("SELECT * FROM nurselevel WHERE id=?", [r.insertId]));
  }

  if (method === "PUT" && path.match(/^\/api\/nurse\/level\/\d+$/) && !path.endsWith("/items")) {
    const id = Number(path.split("/").pop());
    if (body.levelName != null) {
      await db.query("UPDATE nurselevel SET level_name=? WHERE id=?", [body.levelName, id]);
    }
    if (body.levelStatus != null) {
      await db.query("UPDATE nurselevel SET level_status=? WHERE id=?", [Number(body.levelStatus), id]);
    }
    return M.rowToCamel(await db.queryOne("SELECT * FROM nurselevel WHERE id=?", [id]));
  }

  if (method === "GET" && path.match(/^\/api\/nurse\/level\/\d+\/items$/)) {
    const levelId = Number(path.split("/")[4]);
    const directItemIds = await getDirectLevelItemIds(levelId);
    const effectiveItemIds = await getEffectiveLevelItemIds(levelId);
    const prevLevelItemIds = levelId > 1 ? await getEffectiveLevelItemIds(levelId - 1) : [];
    const items = (await db.query("SELECT * FROM nursecontent WHERE is_deleted=0 ORDER BY id")).map(M.mapNurseContent);
    return { levelId, directItemIds, effectiveItemIds, prevLevelItemIds, items };
  }

  if (method === "PUT" && path.match(/^\/api\/nurse\/level\/\d+\/items$/)) {
    const levelId = Number(path.split("/")[4]);
    const effectiveItemIds = await saveLevelItems(levelId, body.itemIds || []);
    return { levelId, effectiveItemIds };
  }

  if (method === "GET" && path === "/api/caregiver/elders-status") {
    await ensureNurseRecordTable();
    let sql = `SELECT c.*, b.bed_status, b.bed_no, nl.level_name, u.nickname AS caregiver_name,
        (SELECT COUNT(*) FROM customernurseitem cni WHERE cni.customer_id=c.id AND cni.is_deleted=0) AS purchased_item_count,
        (SELECT COUNT(*) FROM nurserecord nr WHERE nr.customer_id=c.id AND nr.is_deleted=0
         AND nr.nursing_time >= CURDATE() AND nr.nursing_time < DATE_ADD(CURDATE(), INTERVAL 1 DAY)) AS today_record_count,
        (SELECT o.auditstatus FROM outward o WHERE o.customer_id=c.id AND o.is_deleted=0 AND o.auditstatus=1
         AND o.actualreturntime IS NULL ORDER BY o.id DESC LIMIT 1) AS outward_pass
       FROM customer c
       LEFT JOIN bed b ON b.id=c.bed_id
       LEFT JOIN nurselevel nl ON nl.id=c.level_id
       LEFT JOIN \`user\` u ON u.id=c.user_id AND c.user_id > 0 AND u.is_deleted=0
       WHERE c.is_deleted=0 AND c.resident_status=1`;
    const params = [];
    const roleId = getRoleId(authUser);
    const caregiverId =
      roleId === 2
        ? Number(authUser.uid)
        : qs.caregiverUserId != null && qs.caregiverUserId !== ""
          ? Number(qs.caregiverUserId)
          : null;
    if (caregiverId) {
      sql += " AND c.user_id=?";
      params.push(caregiverId);
    } else if (qs.assignedOnly === "true" || qs.assignedOnly === true) {
      sql += " AND c.user_id > 0";
    }
    sql += " ORDER BY c.id DESC";
    const rows = await db.query(sql, params);
    const records = rows.map((r) => {
      const c = M.mapCustomer(r);
      const bedStatus = r.bed_status;
      let residenceStatus = "在院";
      if (r.outward_pass != null) residenceStatus = "外出中";
      else if (bedStatus === 3) residenceStatus = "外出";
      return {
        ...c,
        bedNo: r.bed_no,
        bedLabel: r.bed_no && c.roomNo ? `${c.roomNo}-${r.bed_no}` : c.roomNo || "-",
        bedStatus,
        bedStatusLabel: bedStatus === 1 ? "空闲" : bedStatus === 2 ? "在院" : bedStatus === 3 ? "外出" : "-",
        levelName: r.level_name || (c.levelId ? "护理" : "自理"),
        elderType: c.levelId ? "护理" : "自理",
        residenceStatus,
        caregiverName: r.caregiver_name || (c.userId > 0 ? `管家#${c.userId}` : "未分配"),
        purchasedItemCount: Number(r.purchased_item_count || 0),
        todayRecordCount: Number(r.today_record_count || 0),
      };
    });
    return { records, total: records.length };
  }

  if (method === "GET" && path === "/api/caregiver/daily-plan") {
    await ensureNurseRecordTable();
    const customerId = Number(qs.customerId);
    const dateStr = (qs.date || new Date().toISOString().slice(0, 10)).slice(0, 10);
    if (!customerId) throw { status: 400, message: "缺少 customerId" };
    const customer = await db.queryOne(
      `SELECT c.*, nl.level_name FROM customer c LEFT JOIN nurselevel nl ON nl.id=c.level_id WHERE c.id=? AND c.is_deleted=0`,
      [customerId]
    );
    if (!customer) throw { status: 404, message: "客户不存在" };
    await assertCaregiverOwnsCustomer(db, authUser, customerId);
    const itemRows = await db.query(
      `SELECT cni.*, nc.nursing_name, nc.serial_number, nc.execution_cycle, nc.execution_times
       FROM customernurseitem cni
       LEFT JOIN nursecontent nc ON nc.id=cni.item_id
       WHERE cni.customer_id=? AND cni.is_deleted=0 ORDER BY cni.id`,
      [customerId]
    );
    const doneRows = await db.query(
      `SELECT item_id, SUM(nursing_count) AS done_count
       FROM nurserecord WHERE customer_id=? AND is_deleted=0
         AND nursing_time >= ? AND nursing_time < DATE_ADD(?, INTERVAL 1 DAY) GROUP BY item_id`,
      [customerId, `${dateStr} 00:00:00`, dateStr]
    );
    const doneMap = new Map(doneRows.map((r) => [r.item_id, Number(r.done_count)]));
    const items = itemRows.map((r) => {
      const row = M.mapCustomerNurseItem(r);
      row.executionCycle = r.execution_cycle;
      row.executionTimes = r.execution_times;
      row.todayDoneCount = doneMap.get(r.item_id) || 0;
      row.serviceStatus = computeServiceStatus({
        nurseNumber: r.nurse_number,
        maturityTime: r.maturity_time,
      });
      row.canExecute = row.serviceStatus === "数量正常";
      return row;
    });
    const todayRecords = await db.query(
      `SELECT nr.*, nc.nursing_name, nc.serial_number, u.nickname AS nurse_name
       FROM nurserecord nr
       LEFT JOIN nursecontent nc ON nc.id=nr.item_id
       LEFT JOIN \`user\` u ON u.id=nr.user_id
       WHERE nr.customer_id=? AND nr.is_deleted=0
         AND nr.nursing_time >= ? AND nr.nursing_time < DATE_ADD(?, INTERVAL 1 DAY)
       ORDER BY nr.nursing_time DESC`,
      [customerId, `${dateStr} 00:00:00`, dateStr]
    );
    return {
      customer: M.mapCustomer(customer),
      levelName: customer.level_name,
      date: dateStr,
      items,
      todayRecords: todayRecords.map(M.mapNurseRecord),
    };
  }

  if (method === "PUT" && path === "/api/caregiver/assign") {
    if (getRoleId(authUser) !== 1) throw { status: 403, message: "仅管理员可分配服务对象" };
    const customerId = Number(body.customerId);
    const userId = Number(body.userId);
    if (!customerId) throw { status: 400, message: "缺少 customerId" };
    if (userId > 0) {
      const nurse = await db.queryOne("SELECT id FROM `user` WHERE id=? AND role_id=2 AND is_deleted=0", [userId]);
      if (!nurse) throw { status: 400, message: "健康管家不存在" };
    }
    await db.query("UPDATE customer SET user_id=? WHERE id=? AND is_deleted=0", [userId || -1, customerId]);
    return M.mapCustomer(await db.queryOne("SELECT * FROM customer WHERE id=?", [customerId]));
  }

  if (method === "GET" && path === "/api/nurse/customer-items") {
    const customerId = Number(qs.customerId);
    if (!customerId) throw { status: 400, message: "缺少 customerId" };
    await assertCaregiverOwnsCustomer(db, authUser, customerId);
    const rows = await db.query(
      `SELECT cni.*, nc.nursing_name, nc.serial_number, nc.service_price, nl.level_name
       FROM customernurseitem cni
       LEFT JOIN nursecontent nc ON nc.id=cni.item_id
       LEFT JOIN nurselevel nl ON nl.id=cni.level_id
       WHERE cni.customer_id=? AND cni.is_deleted=0 ORDER BY cni.id DESC`,
      [customerId]
    );
    const merged = await mergeCustomerNurseItems(customerId, rows);
    for (const row of merged) row.serviceStatus = computeServiceStatus(row);
    return pageOf(merged, qs.page, qs.size);
  }

  if (method === "GET" && path === "/api/health/service-items") {
    const customerId = Number(qs.customerId);
    if (!customerId) throw { status: 400, message: "缺少 customerId" };
    const rows = await db.query(
      `SELECT cni.*, nc.nursing_name, nc.serial_number, nc.service_price, nc.execution_cycle, nc.execution_times, nl.level_name
       FROM customernurseitem cni
       LEFT JOIN nursecontent nc ON nc.id=cni.item_id
       LEFT JOIN nurselevel nl ON nl.id=cni.level_id
       WHERE cni.customer_id=? AND cni.is_deleted=0 ORDER BY cni.id DESC`,
      [customerId]
    );
    const records = rows.map((r) => {
      const row = M.mapCustomerNurseItem(r);
      row.serviceStatus = computeServiceStatus(row);
      return row;
    });
    if (qs.status) {
      const filtered = records.filter((r) => r.serviceStatus === qs.status);
      return pageOf(filtered, qs.page, qs.size);
    }
    return pageOf(records, qs.page, qs.size);
  }

  if (method === "POST" && path === "/api/nurse/customer-items") {
    if (getRoleId(authUser) === 2) throw { status: 403, message: "购买护理项目请由管理员操作" };
    const today = new Date().toISOString().slice(0, 10);
    const cust = await db.queryOne("SELECT expiration_date FROM customer WHERE id=?", [body.customerId]);
    const buyTime = body.buyTime || today;
    const maturityTime = body.maturityTime || cust?.expiration_date || buyTime;
    const dateErr = validateBuyMaturityDates(buyTime, maturityTime);
    if (dateErr) throw { status: 400, message: dateErr };
    const r = await db.query(
      `INSERT INTO customernurseitem (item_id,customer_id,level_id,nurse_number,buy_time,maturity_time,is_deleted)
       VALUES (?,?,?,?,?,?,0)`,
      [
        body.itemId,
        body.customerId,
        body.levelId || null,
        body.nurseNumber ?? 1,
        buyTime,
        maturityTime,
      ]
    );
    const row = await db.queryOne(
      `SELECT cni.*, nc.nursing_name, nc.serial_number, nc.service_price, nl.level_name
       FROM customernurseitem cni
       LEFT JOIN nursecontent nc ON nc.id=cni.item_id
       LEFT JOIN nurselevel nl ON nl.id=cni.level_id WHERE cni.id=?`,
      [r.insertId]
    );
    return M.mapCustomerNurseItem(row);
  }

  if (method === "PUT" && path.match(/^\/api\/nurse\/customer-items\/\d+$/)) {
    if (getRoleId(authUser) === 2) throw { status: 403, message: "修改护理项目请由管理员操作" };
    const dateErr = validateBuyMaturityDates(body.buyTime, body.maturityTime);
    if (dateErr) throw { status: 400, message: dateErr };
    const id = Number(path.split("/").pop());
    await db.query(
      "UPDATE customernurseitem SET item_id=?,level_id=?,nurse_number=?,buy_time=?,maturity_time=? WHERE id=?",
      [body.itemId, body.levelId || null, body.nurseNumber ?? 1, body.buyTime, body.maturityTime, id]
    );
    const row = await db.queryOne(
      `SELECT cni.*, nc.nursing_name, nc.serial_number, nc.service_price, nl.level_name
       FROM customernurseitem cni LEFT JOIN nursecontent nc ON nc.id=cni.item_id
       LEFT JOIN nurselevel nl ON nl.id=cni.level_id WHERE cni.id=?`,
      [id]
    );
    return M.mapCustomerNurseItem(row);
  }

  if (method === "DELETE" && path.match(/^\/api\/nurse\/customer-items\/\d+$/)) {
    if (getRoleId(authUser) === 2) throw { status: 403, message: "删除护理项目请由管理员操作" };
    const id = Number(path.split("/").pop());
    await db.query("UPDATE customernurseitem SET is_deleted=1 WHERE id=?", [id]);
    return null;
  }

  if (method === "PUT" && path.match(/^\/api\/nurse\/customer-items\/\d+\/renew$/)) {
    if (getRoleId(authUser) === 2) throw { status: 403, message: "续费请由管理员操作" };
    const id = Number(path.split("/")[4]);
    const row = await db.queryOne(
      "SELECT * FROM customernurseitem WHERE id=? AND is_deleted=0",
      [id]
    );
    if (!row) throw { status: 404, message: "记录不存在" };
    const buy = formatDateOnly(row.buy_time);
    const mat = formatDateOnly(row.maturity_time);
    const today = todayIso();
    const spanDays = Math.max(1, Math.round((new Date(mat) - new Date(buy)) / 86400000));
    const newBuy = today;
    const newEnd = new Date(today);
    newEnd.setDate(newEnd.getDate() + spanDays);
    const newMat = newEnd.toISOString().slice(0, 10);
    await db.query(
      "UPDATE customernurseitem SET buy_time=?, maturity_time=?, nurse_number=? WHERE id=?",
      [newBuy, newMat, (row.nurse_number || 0) + (body.addCount ?? 1), id]
    );
    const updated = await db.queryOne(
      `SELECT cni.*, nc.nursing_name, nc.serial_number, nc.service_price, nl.level_name
       FROM customernurseitem cni LEFT JOIN nursecontent nc ON nc.id=cni.item_id
       LEFT JOIN nurselevel nl ON nl.id=cni.level_id WHERE cni.id=?`,
      [id]
    );
    const mapped = M.mapCustomerNurseItem(updated);
    mapped.serviceStatus = computeServiceStatus(mapped);
    return mapped;
  }

  if (method === "DELETE" && path.match(/^\/api\/nurse\/customer\/\d+\/level$/)) {
    if (getRoleId(authUser) === 2) throw { status: 403, message: "移除护理级别请由管理员操作" };
    const customerId = Number(path.split("/")[4]);
    const c = await db.queryOne("SELECT level_id FROM customer WHERE id=?", [customerId]);
    const oldLevel = c?.level_id;
    await db.query("UPDATE customer SET level_id=NULL WHERE id=?", [customerId]);
    if (oldLevel) {
      await db.query(
        "UPDATE customernurseitem SET is_deleted=1 WHERE customer_id=? AND level_id=?",
        [customerId, oldLevel]
      );
    }
    return { message: "已移除护理级别及关联项目" };
  }

  if (method === "POST" && path.match(/^\/api\/nurse\/customer\/\d+\/level-items-batch$/)) {
    if (getRoleId(authUser) === 2) throw { status: 403, message: "批量购买请由管理员操作" };
    const customerId = Number(path.split("/")[4]);
    const c = await db.queryOne("SELECT level_id FROM customer WHERE id=?", [customerId]);
    if (!c?.level_id) throw { status: 400, message: "请先设置护理级别" };
    const added = await batchPurchaseLevelItems(customerId, c.level_id);
    return { added, message: `已批量购买 ${added} 项` };
  }

  if (method === "PUT" && path.match(/^\/api\/nurse\/customer\/\d+\/level$/)) {
    const customerId = Number(path.split("/")[4]);
    const newLevel = body.levelId || null;
    const c = await db.queryOne("SELECT level_id FROM customer WHERE id=?", [customerId]);
    if (c?.level_id && newLevel && Number(c.level_id) !== Number(newLevel)) {
      await db.query(
        "UPDATE customernurseitem SET is_deleted=1 WHERE customer_id=? AND level_id=?",
        [customerId, c.level_id]
      );
    }
  await db.query("UPDATE customer SET level_id=? WHERE id=?", [newLevel, customerId]);
    return null;
  }

  if (method === "GET" && path === "/api/nurse/records") {
    await ensureNurseRecordTable();
    let sql = `SELECT nr.*, c.customer_name, nc.nursing_name, nc.serial_number, u.nickname AS nurse_name
      FROM nurserecord nr
      LEFT JOIN customer c ON c.id=nr.customer_id
      LEFT JOIN nursecontent nc ON nc.id=nr.item_id
      LEFT JOIN \`user\` u ON u.id=nr.user_id
      WHERE nr.is_deleted=0`;
    const params = [];
    if (qs.customerId) {
      sql += " AND nr.customer_id=?";
      params.push(Number(qs.customerId));
    }
    if (qs.caregiverUserId) {
      sql += " AND c.user_id=?";
      params.push(Number(qs.caregiverUserId));
    } else if (getRoleId(authUser) === 2) {
      sql += " AND c.user_id=?";
      params.push(Number(authUser.uid));
    }
    if (qs.customerId && getRoleId(authUser) === 2) {
      await assertCaregiverOwnsCustomer(db, authUser, Number(qs.customerId));
    }
    sql += " ORDER BY nr.nursing_time DESC, nr.id DESC";
    const rows = await db.query(sql, params);
    return pageOf(rows.map(M.mapNurseRecord), qs.page, qs.size);
  }

  if (method === "POST" && path === "/api/nurse/records") {
    await ensureNurseRecordTable();
    const uid = body.userId || authUser?.uid;
    if (!uid) throw { status: 400, message: "缺少执行人" };
    if (!body.customerId || !body.itemId) throw { status: 400, message: "请选择老人与护理项目" };
    const customerId = Number(body.customerId);
    const itemId = Number(body.itemId);
    await assertCaregiverOwnsCustomer(db, authUser, customerId);
    const prep = await validateNurseRecordExecution(db, customerId, itemId, body.nursingCount ?? 1);
    const nursingTime = body.nursingTime || new Date().toISOString().slice(0, 19).replace("T", " ");
    const r = await db.query(
      `INSERT INTO nurserecord (customer_id, item_id, nursing_time, nursing_content, nursing_count, user_id, is_deleted)
       VALUES (?,?,?,?,?,?,0)`,
      [
        customerId,
        itemId,
        nursingTime,
        body.nursingContent || null,
        prep.deduct,
        uid,
      ]
    );
    await db.query("UPDATE customernurseitem SET nurse_number = nurse_number - ? WHERE id=?", [
      prep.deduct,
      prep.cniId,
    ]);
    const row = await db.queryOne(
      `SELECT nr.*, c.customer_name, nc.nursing_name, nc.serial_number, u.nickname AS nurse_name
       FROM nurserecord nr
       LEFT JOIN customer c ON c.id=nr.customer_id
       LEFT JOIN nursecontent nc ON nc.id=nr.item_id
       LEFT JOIN \`user\` u ON u.id=nr.user_id WHERE nr.id=?`,
      [r.insertId]
    );
    return M.mapNurseRecord(row);
  }

  if (method === "DELETE" && path.match(/^\/api\/nurse\/records\/\d+$/)) {
    await ensureNurseRecordTable();
    const id = Number(path.split("/").pop());
    const rec = await db.queryOne(
      "SELECT customer_id, item_id, nursing_count FROM nurserecord WHERE id=? AND is_deleted=0",
      [id]
    );
    if (!rec) throw { status: 404, message: "记录不存在" };
    await assertCaregiverOwnsCustomer(db, authUser, rec.customer_id);
    await db.query("UPDATE nurserecord SET is_deleted=1 WHERE id=?", [id]);
    await db.query(
      "UPDATE customernurseitem SET nurse_number = nurse_number + ? WHERE customer_id=? AND item_id=? AND is_deleted=0",
      [Number(rec.nursing_count || 1), rec.customer_id, rec.item_id]
    );
    return null;
  }

  if (method === "GET" && path === "/api/dashboard/stats") {
    if (!authUser) throw { status: 401, message: "未登录" };
    const roleId = getRoleId(authUser);
    const uid = Number(authUser.uid);
    await ensureNurseRecordTable();
    const residentRow = await db.queryOne(
      "SELECT COUNT(*) AS cnt FROM customer WHERE is_deleted=0 AND resident_status=1"
    );
    const freeBedRow = await db.queryOne("SELECT COUNT(*) AS cnt FROM bed WHERE bed_status=1");
    const pendingOutwardRow = await db.queryOne(
      "SELECT COUNT(*) AS cnt FROM outward WHERE is_deleted=0 AND auditstatus=0"
    );
    const pendingBackdownRow = await db.queryOne(
      "SELECT COUNT(*) AS cnt FROM backdown WHERE is_deleted=0 AND auditstatus=0"
    );
    const today = new Date().toISOString().slice(0, 10);
    let todaySql =
      "SELECT COUNT(*) AS cnt FROM nurserecord WHERE is_deleted=0 AND DATE(nursing_time)=?";
    const todayParams = [today];
    if (roleId === 2) {
      todaySql += " AND user_id=?";
      todayParams.push(uid);
    }
    const todayRow = await db.queryOne(todaySql, todayParams);
    let myCustomerCount = null;
    if (roleId === 2) {
      const mc = await db.queryOne(
        "SELECT COUNT(*) AS cnt FROM customer WHERE is_deleted=0 AND resident_status=1 AND user_id=?",
        [uid]
      );
      myCustomerCount = mc.cnt;
    }
    return {
      residentCount: Number(residentRow?.cnt || 0),
      freeBedCount: Number(freeBedRow?.cnt || 0),
      pendingOutward: Number(pendingOutwardRow?.cnt || 0),
      pendingBackdown: Number(pendingBackdownRow?.cnt || 0),
      todayRecordCount: Number(todayRow?.cnt || 0),
      myCustomerCount,
      roleId,
    };
  }

  if (method === "PUT" && path.match(/^\/api\/users\/\d+\/reset-password$/)) {
    requireAdmin(authUser);
    const id = Number(path.split("/")[3]);
    const pwd = body.password || body.newPassword;
    if (!pwd || String(pwd).length < 4) throw { status: 400, message: "密码至少4位" };
    const row = await db.queryOne("SELECT id FROM `user` WHERE id=?", [id]);
    if (!row) throw { status: 404, message: "用户不存在" };
    await db.query("UPDATE `user` SET password=? WHERE id=?", [String(pwd), id]);
    return null;
  }

  if (method === "PUT" && path.match(/^\/api\/users\/\d+\/status$/)) {
    requireAdmin(authUser);
    const id = Number(path.split("/")[3]);
    const disabled = body.disabled === true || body.isDeleted === 1;
    if (Number(authUser.uid) === id && disabled) {
      throw { status: 400, message: "不能禁用当前登录账号" };
    }
    const row = await db.queryOne("SELECT id FROM `user` WHERE id=?", [id]);
    if (!row) throw { status: 404, message: "用户不存在" };
    await db.query("UPDATE `user` SET is_deleted=? WHERE id=?", [disabled ? 1 : 0, id]);
    return null;
  }

  if (method === "GET" && path === "/api/users") {
    let sql = "SELECT id,nickname,username,sex,phone_number,role_id,is_deleted FROM `user` WHERE 1=1";
    const params = [];
    if (qs.includeDisabled !== "true") sql += " AND is_deleted=0";
    if (qs.roleId != null && qs.roleId !== "") {
      sql += " AND role_id=?";
      params.push(Number(qs.roleId));
    }
    sql += " ORDER BY id";
    const rows = await db.query(sql, params);
    return pageOf(rows.map(M.mapUser), qs.page, qs.size);
  }

  if (method === "GET" && path === "/api/approval/outward") {
    let sql = `SELECT o.*, c.customer_name FROM outward o LEFT JOIN customer c ON c.id=o.customer_id WHERE o.is_deleted=0`;
    const params = [];
    if (getRoleId(authUser) === 2) {
      sql += " AND o.submit_user_id=?";
      params.push(Number(authUser.uid));
    } else if (qs.submitUserId) {
      sql += " AND o.submit_user_id=?";
      params.push(Number(qs.submitUserId));
    }
    sql += " ORDER BY o.id DESC";
    const rows = await db.query(sql, params);
    return pageOf(rows.map(M.mapOutward));
  }

  if (method === "POST" && path === "/api/approval/outward") {
    const dateErr = validateOutwardDates(body.outgoingtime, body.expectedreturntime);
    if (dateErr) throw { status: 400, message: dateErr };
    await assertCaregiverOwnsCustomer(db, authUser, Number(body.customerId));
    const submitUserId = body.submitUserId || authUser?.uid || null;
    const r = await db.query(
      `INSERT INTO outward (customer_id,outgoingreason,outgoingtime,expectedreturntime,escorted,relation,escortedtel,auditstatus,is_deleted,submit_user_id)
       VALUES (?,?,?,?,?,?,?,0,0,?)`,
      [
        body.customerId,
        body.outgoingreason,
        body.outgoingtime,
        body.expectedreturntime,
        body.escorted || null,
        body.relation || null,
        body.escortedtel || null,
        submitUserId,
      ]
    );
    return M.mapOutward(await db.queryOne("SELECT * FROM outward WHERE id=?", [r.insertId]));
  }

  if (method === "POST" && path === "/api/users") {
    requireAdmin(authUser);
    const phone = String(body.phoneNumber || "");
    const pwd =
      body.password ||
      (phone.length >= 6 ? phone.slice(-6) : body.username || "123456");
    const exists = await db.queryOne("SELECT id FROM `user` WHERE username=? AND is_deleted=0", [
      body.username,
    ]);
    if (exists) throw { status: 400, message: "用户名已存在" };
    const r = await db.query(
      `INSERT INTO \`user\` (nickname,username,password,sex,email,phone_number,role_id,is_deleted,create_by)
       VALUES (?,?,?,?,?,?,?,0,?)`,
      [
        body.nickname || body.username,
        body.username,
        pwd,
        body.sex ?? 1,
        body.email || null,
        phone,
        body.roleId ?? 2,
        authUser?.uid || null,
      ]
    );
    const user = M.mapUser(await db.queryOne("SELECT * FROM `user` WHERE id=?", [r.insertId]));
    delete user.password;
    return user;
  }

  if (method === "GET" && path === "/api/roles") {
    const rows = await db.query("SELECT id, name FROM role WHERE is_deleted=0 ORDER BY id");
    return rows.map(M.rowToCamel);
  }

  if (method === "PUT" && path.match(/^\/api\/approval\/outward\/\d+\/audit$/)) {
    requireAdmin(authUser);
    const id = Number(path.split("/")[4]);
    const pass = qs.pass === "true";
    const pending = await db.queryOne("SELECT auditstatus, customer_id FROM outward WHERE id=? AND is_deleted=0", [id]);
    if (!pending) throw { status: 404, message: "记录不存在" };
    if (Number(pending.auditstatus) !== 0) throw { status: 400, message: "该申请已审批，请勿重复操作" };
    const name = await auditorName(authUser);
    await db.query("UPDATE outward SET auditstatus=?, auditperson=?, audittime=NOW() WHERE id=? AND auditstatus=0", [
      pass ? 1 : 2,
      name,
      id,
    ]);
    if (pass) {
      const o = await db.queryOne("SELECT * FROM outward WHERE id=?", [id]);
      if (o) {
        const c = await db.queryOne("SELECT * FROM customer WHERE id=?", [o.customer_id]);
        if (c?.bed_id) await db.query("UPDATE bed SET bed_status=3 WHERE id=?", [c.bed_id]);
      }
    }
    return null;
  }

  if (method === "PUT" && path.match(/^\/api\/approval\/outward\/\d+\/return$/)) {
    requireAdmin(authUser);
    const id = Number(path.split("/")[4]);
    const actualReturnTime = qs.actualReturnTime || new Date().toISOString().slice(0, 10);
    await db.query("UPDATE outward SET actualreturntime=? WHERE id=?", [actualReturnTime, id]);
    const o = await db.queryOne("SELECT * FROM outward WHERE id=?", [id]);
    if (o) {
      const c = await db.queryOne("SELECT * FROM customer WHERE id=?", [o.customer_id]);
      if (c?.bed_id) {
        const bed = await db.queryOne("SELECT * FROM bed WHERE id=?", [c.bed_id]);
        if (bed && bedStatusNum(bed.bed_status) === 3) await db.query("UPDATE bed SET bed_status=2 WHERE id=?", [c.bed_id]);
      }
    }
    return null;
  }

  if (method === "GET" && path === "/api/approval/backdown") {
    let sql = `SELECT b.*, c.customer_name FROM backdown b LEFT JOIN customer c ON c.id=b.customer_id WHERE b.is_deleted=0`;
    const params = [];
    if (getRoleId(authUser) === 2) {
      sql += " AND b.submit_user_id=?";
      params.push(Number(authUser.uid));
    } else if (qs.submitUserId) {
      sql += " AND b.submit_user_id=?";
      params.push(Number(qs.submitUserId));
    }
    sql += " ORDER BY b.id DESC";
    const rows = await db.query(sql, params);
    return pageOf(rows.map(M.mapBackdown));
  }

  if (method === "POST" && path === "/api/approval/backdown") {
    await assertCaregiverOwnsCustomer(db, authUser, Number(body.customerId));
    const submitUserId = body.submitUserId || authUser?.uid || null;
    const r = await db.query(
      `INSERT INTO backdown (customer_id,retreattime,retreattype,retreatreason,auditstatus,is_deleted,submit_user_id)
       VALUES (?,?,?,?,0,0,?)`,
      [body.customerId, body.retreattime, body.retreattype ?? 0, body.retreatreason || null, submitUserId]
    );
    return M.mapBackdown(await db.queryOne("SELECT * FROM backdown WHERE id=?", [r.insertId]));
  }

  if (method === "PUT" && path.match(/^\/api\/approval\/backdown\/\d+\/audit$/)) {
    requireAdmin(authUser);
    const id = Number(path.split("/")[4]);
    const pass = qs.pass === "true";
    const pending = await db.queryOne("SELECT auditstatus FROM backdown WHERE id=? AND is_deleted=0", [id]);
    if (!pending) throw { status: 404, message: "记录不存在" };
    if (Number(pending.auditstatus) !== 0) throw { status: 400, message: "该申请已审批，请勿重复操作" };
    const name = await auditorName(authUser);
    await db.query("UPDATE backdown SET auditstatus=?, auditperson=?, audittime=NOW() WHERE id=? AND auditstatus=0", [
      pass ? 1 : 2,
      name,
      id,
    ]);
    if (pass) {
      const b = await db.queryOne("SELECT * FROM backdown WHERE id=?", [id]);
      if (b) {
        const c = await db.queryOne("SELECT * FROM customer WHERE id=?", [b.customer_id]);
        if (b.retreattype === 0 || b.retreattype === 1) {
          if (c?.bed_id) {
            await db.query("UPDATE bed SET bed_status=1 WHERE id=?", [c.bed_id]);
            await closeActiveBedDetail(b.customer_id, c.bed_id, formatDateOnly(b.retreattime));
          }
          await db.query("UPDATE customer SET resident_status=2, bed_id=NULL WHERE id=?", [b.customer_id]);
        } else if (b.retreattype === 2) {
          await db.query("UPDATE customer SET resident_status=2 WHERE id=?", [b.customer_id]);
        }
      }
    }
    return null;
  }

  throw { status: 404, message: `Not Found: ${method} ${path}` };
}

module.exports = { handle };
