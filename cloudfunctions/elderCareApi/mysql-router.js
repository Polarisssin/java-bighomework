"use strict";

const db = require("./db");
const { rowsToCamel, rowToCamel, calcAge, getUserFromEvent, validateOutwardDates } = require("./util");

const ADMIN_MENUS = [
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
  { id: 16, menusIndex: "5", title: "用户管理", icon: "UserFilled", path: "/user/manage", parentId: null },
];

const CAREGIVER_MENUS = [
  { id: 17, menusIndex: "6", title: "健康管家", icon: "Suitcase", path: null, parentId: null },
  { id: 18, menusIndex: "6", title: "老人状态", icon: "View", path: "/caregiver/elders", parentId: 17 },
  { id: 20, menusIndex: "7", title: "客户管理", icon: "User", path: null, parentId: null },
  { id: 21, menusIndex: "7", title: "外出申请", icon: "Promotion", path: "/caregiver/outward", parentId: 20 },
  { id: 22, menusIndex: "7", title: "退住申请", icon: "Back", path: "/caregiver/backdown", parentId: 20 },
];

async function getDirectLevelItemIds(levelId) {
  const rows = await db.query("SELECT item_id FROM nurselevelitem WHERE level_id = ?", [levelId]);
  return rows.map((r) => r.item_id);
}

/** 累计：一级 + … + 当前级别 */
async function getEffectiveLevelItemIds(levelId) {
  const all = [];
  for (let lid = 1; lid <= levelId; lid++) {
    const ids = await getDirectLevelItemIds(lid);
    ids.forEach((id) => {
      if (!all.includes(id)) all.push(id);
    });
  }
  return all;
}

async function saveLevelItems(levelId, newItemIds) {
  const ids = (newItemIds || []).map(Number).filter(Boolean);
  if (levelId > 1) {
    const prevEffective = await getEffectiveLevelItemIds(levelId - 1);
    const missing = prevEffective.filter((id) => !ids.includes(id));
    if (missing.length) {
      throw new Error(`请先包含上一级全部护理项目（缺少项目ID: ${missing.join(",")}）`);
    }
  }
  await db.query("DELETE FROM nurselevelitem WHERE level_id = ?", [levelId]);
  const prevSet = levelId > 1 ? new Set(await getEffectiveLevelItemIds(levelId - 1)) : new Set();
  const toInsert = ids.filter((id) => !prevSet.has(id));
  for (const itemId of toInsert) {
    await db.query("INSERT INTO nurselevelitem (level_id, item_id) VALUES (?, ?)", [levelId, itemId]);
  }
  return getEffectiveLevelItemIds(levelId);
}

async function handle(method, path, body, qs, event) {
  const authUser = getUserFromEvent(event);

  if (method === "POST" && path === "/api/auth/login") {
    const row = await db.queryOne(
      "SELECT * FROM `user` WHERE username = ? AND password = ? AND is_deleted = 0",
      [body.username, body.password]
    );
    if (!row) throw Object.assign(new Error("用户名或密码错误"), { statusCode: 400 });
    const safe = rowToCamel(row);
    delete safe.password;
    const menus = safe.roleId === 1 ? ADMIN_MENUS : CAREGIVER_MENUS;
    return {
      token: Buffer.from(JSON.stringify({ uid: safe.id, role: safe.roleId })).toString("base64"),
      user: safe,
      menus,
    };
  }

  if (method === "GET" && path === "/api/customers") {
    const elderlyType = qs.elderlyType || "all";
    let sql = "SELECT * FROM customer WHERE is_deleted = 0";
    const params = [];
    if (elderlyType === "self") sql += " AND level_id IS NULL";
    else if (elderlyType === "nursing") sql += " AND level_id IS NOT NULL";
    if ((qs.name || "").trim()) {
      sql += " AND customer_name LIKE ?";
      params.push(`%${qs.name.trim()}%`);
    }
    sql += " ORDER BY id DESC";
    const records = rowsToCamel(await db.query(sql, params));
    return { records, total: records.length, size: 10, current: 1 };
  }

  if (method === "POST" && path === "/api/customers/checkin") {
    const c = body;
    const age = c.birthday ? calcAge(c.birthday) : c.customerAge || 0;
    const r = await db.query(
      `INSERT INTO customer (customer_name, customer_age, customer_sex, idcard, room_no, building_no,
        checkin_date, expiration_date, contact_tel, bed_id, blood_type, filepath, user_id, level_id, family_member, birthday, is_deleted)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)`,
      [
        c.customerName,
        age,
        c.customerSex ?? 0,
        c.idcard || "",
        c.roomNo || "",
        c.buildingNo || "606",
        c.checkinDate,
        c.expirationDate,
        c.contactTel || "",
        c.bedId || null,
        c.bloodType || "A",
        c.filepath || "/avatar/default.png",
        c.userId ?? -1,
        c.levelId || null,
        c.familyMember || null,
        c.birthday || null,
      ]
    );
    if (c.bedId) {
      const bed = await db.queryOne("SELECT * FROM bed WHERE id = ?", [c.bedId]);
      if (bed) {
        await db.query("UPDATE bed SET bed_status = 2 WHERE id = ?", [c.bedId]);
        await db.query("UPDATE customer SET room_no = ? WHERE id = ?", [String(bed.room_no), r.insertId]);
      }
    }
    return rowToCamel(await db.queryOne("SELECT * FROM customer WHERE id = ?", [r.insertId]));
  }

  if (method === "PUT" && path.match(/^\/api\/customers\/\d+$/)) {
    const id = Number(path.split("/").pop());
    const existing = await db.queryOne("SELECT * FROM customer WHERE id = ? AND is_deleted = 0", [id]);
    if (!existing) throw Object.assign(new Error("客户不存在"), { statusCode: 404 });
    const c = { ...rowToCamel(existing), ...body, id };
    if (c.birthday) c.customerAge = calcAge(c.birthday);
    const newBedId = c.bedId ? Number(c.bedId) : null;
    const oldBedId = existing.bed_id ? Number(existing.bed_id) : null;
    if (newBedId !== oldBedId) {
      if (oldBedId) await db.query("UPDATE bed SET bed_status = 1 WHERE id = ?", [oldBedId]);
      if (newBedId) {
        const bed = await db.queryOne("SELECT * FROM bed WHERE id = ? AND bed_status = 1", [newBedId]);
        if (!bed) throw Object.assign(new Error("床位不可用"), { statusCode: 400 });
        await db.query("UPDATE bed SET bed_status = 2 WHERE id = ?", [newBedId]);
        c.roomNo = String(bed.room_no);
      }
    }
    await db.query(
      `UPDATE customer SET customer_name=?, customer_age=?, customer_sex=?, idcard=?, room_no=?, contact_tel=?,
        bed_id=?, blood_type=?, birthday=?, family_member=?, level_id=?, checkin_date=?, expiration_date=? WHERE id=?`,
      [
        c.customerName,
        c.customerAge,
        c.customerSex,
        c.idcard,
        c.roomNo,
        c.contactTel,
        c.bedId,
        c.bloodType,
        c.birthday,
        c.familyMember,
        c.levelId,
        c.checkinDate,
        c.expirationDate,
        id,
      ]
    );
    return rowToCamel(await db.queryOne("SELECT * FROM customer WHERE id = ?", [id]));
  }

  if (method === "DELETE" && path.match(/^\/api\/customers\/\d+$/)) {
    const id = Number(path.split("/").pop());
    const c = await db.queryOne("SELECT * FROM customer WHERE id = ?", [id]);
    if (c?.bed_id) await db.query("UPDATE bed SET bed_status = 1 WHERE id = ?", [c.bed_id]);
    await db.query("UPDATE customer SET is_deleted = 1 WHERE id = ?", [id]);
    return null;
  }

  if (method === "GET" && path === "/api/beds/statistics") {
    const beds = await db.query("SELECT bed_status FROM bed");
    return {
      total: beds.length,
      free: beds.filter((b) => b.bed_status === 1).length,
      occupied: beds.filter((b) => b.bed_status === 2).length,
      out: beds.filter((b) => b.bed_status === 3).length,
    };
  }

  if (method === "GET" && path === "/api/beds/diagram") {
    const floor = qs.floor || "1";
    const rooms = await db.query("SELECT * FROM room WHERE room_floor = ? ORDER BY room_no", [floor]);
    const data = [];
    for (const room of rooms) {
      const beds = await db.query("SELECT * FROM bed WHERE room_no = ? ORDER BY bed_no", [room.room_no]);
      data.push({ room: rowToCamel(room), beds: rowsToCamel(beds) });
    }
    return data;
  }

  if (method === "GET" && path === "/api/beds/rooms") {
    return rowsToCamel(await db.query("SELECT * FROM room ORDER BY room_floor, room_no"));
  }

  if (method === "GET" && path === "/api/beds/free") {
    let sql = "SELECT * FROM bed WHERE bed_status = 1";
    const params = [];
    if (qs.roomNo) {
      sql += " AND room_no = ?";
      params.push(Number(qs.roomNo));
    }
    sql += " ORDER BY room_no, bed_no";
    return rowsToCamel(await db.query(sql, params));
  }

  if (method === "GET" && path === "/api/beds/overview") {
    const beds = await db.query("SELECT b.*, r.room_floor FROM bed b LEFT JOIN room r ON r.room_no = b.room_no ORDER BY b.room_no, b.bed_no");
    const customers = await db.query("SELECT id, customer_name, bed_id FROM customer WHERE is_deleted = 0 AND bed_id IS NOT NULL");
    const byBed = new Map(customers.map((c) => [c.bed_id, c]));
    const occupied = [];
    const free = [];
    for (const b of beds) {
      const row = {
        bedId: b.id,
        roomNo: b.room_no,
        floor: b.room_floor || "",
        bedNo: b.bed_no,
        bedStatus: b.bed_status,
        bedStatusLabel: b.bed_status === 1 ? "空闲" : b.bed_status === 2 ? "有人" : "外出",
        bedLabel: `${b.room_no}-${b.bed_no}`,
      };
      if (b.bed_status === 1) free.push(row);
      else {
        const c = byBed.get(b.id);
        occupied.push({ ...row, customerId: c?.id ?? null, customerName: c?.customer_name ?? "-" });
      }
    }
    const stats = await handle("GET", "/api/beds/statistics", {}, {}, event);
    return { statistics: stats, occupied, free };
  }

  if (method === "POST" && path === "/api/beds/swap") {
    const customerId = Number(qs.customerId);
    const newBedId = Number(qs.newBedId);
    const c = await db.queryOne("SELECT * FROM customer WHERE id = ? AND is_deleted = 0", [customerId]);
    if (!c) throw Object.assign(new Error("客户不存在"), { statusCode: 400 });
    const newBed = await db.queryOne("SELECT * FROM bed WHERE id = ? AND bed_status = 1", [newBedId]);
    if (!newBed) throw Object.assign(new Error("目标床位不可用"), { statusCode: 400 });
    if (c.bed_id) await db.query("UPDATE bed SET bed_status = 1 WHERE id = ?", [c.bed_id]);
    await db.query("UPDATE bed SET bed_status = 2 WHERE id = ?", [newBedId]);
    await db.query("UPDATE customer SET bed_id = ?, room_no = ? WHERE id = ?", [newBedId, String(newBed.room_no), customerId]);
    return null;
  }

  if (method === "GET" && path === "/api/nurse/content") {
    let sql = "SELECT * FROM nursecontent WHERE is_deleted = 0";
    const params = [];
    if (qs.status != null && qs.status !== "") {
      sql += " AND status = ?";
      params.push(Number(qs.status));
    }
    if ((qs.name || "").trim()) {
      sql += " AND nursing_name LIKE ?";
      params.push(`%${qs.name.trim()}%`);
    }
    const records = rowsToCamel(await db.query(sql + " ORDER BY id", params));
    return { records, total: records.length };
  }

  if (method === "POST" && path === "/api/nurse/content") {
    const c = body;
    const r = await db.query(
      `INSERT INTO nursecontent (serial_number, nursing_name, service_price, message, status, execution_cycle, execution_times, is_deleted)
       VALUES (?,?,?,?,?,?,?,0)`,
      [
        c.serialNumber || `N${Date.now()}`,
        c.nursingName,
        c.servicePrice || "0",
        c.message || null,
        c.status ?? 1,
        c.executionCycle || null,
        c.executionTimes || null,
      ]
    );
    return rowToCamel(await db.queryOne("SELECT * FROM nursecontent WHERE id = ?", [r.insertId]));
  }

  if (method === "PUT" && path.match(/^\/api\/nurse\/content\/\d+$/)) {
    const id = Number(path.split("/")[4]);
    const c = body;
    await db.query(
      `UPDATE nursecontent SET serial_number=?, nursing_name=?, service_price=?, message=?, status=?, execution_cycle=?, execution_times=? WHERE id=?`,
      [c.serialNumber, c.nursingName, c.servicePrice, c.message, c.status, c.executionCycle, c.executionTimes, id]
    );
    return rowToCamel(await db.queryOne("SELECT * FROM nursecontent WHERE id = ?", [id]));
  }

  if (method === "DELETE" && path.match(/^\/api\/nurse\/content\/\d+$/)) {
    const id = Number(path.split("/")[4]);
    await db.query("UPDATE nursecontent SET is_deleted = 1 WHERE id = ?", [id]);
    return null;
  }

  if (method === "GET" && path === "/api/nurse/level") {
    const records = rowsToCamel(await db.query("SELECT * FROM nurselevel WHERE is_deleted = 0 ORDER BY id"));
    return { records, total: records.length };
  }

  if (method === "GET" && path.match(/^\/api\/nurse\/level\/\d+\/items$/)) {
    const levelId = Number(path.split("/")[4]);
    const directIds = await getDirectLevelItemIds(levelId);
    const effectiveIds = await getEffectiveLevelItemIds(levelId);
    const allContent = rowsToCamel(await db.query("SELECT * FROM nursecontent WHERE is_deleted = 0 ORDER BY id"));
    const prevEffective = levelId > 1 ? await getEffectiveLevelItemIds(levelId - 1) : [];
    return {
      levelId,
      directItemIds: directIds,
      effectiveItemIds: effectiveIds,
      prevLevelItemIds: prevEffective,
      items: allContent,
    };
  }

  if (method === "PUT" && path.match(/^\/api\/nurse\/level\/\d+\/items$/)) {
    const levelId = Number(path.split("/")[4]);
    const effectiveIds = await saveLevelItems(levelId, body.itemIds || []);
    return { levelId, effectiveItemIds: effectiveIds };
  }

  if (method === "GET" && path === "/api/nurse/customer-items") {
    const customerId = Number(qs.customerId);
    const rows = await db.query(
      `SELECT cni.*, nc.serial_number, nc.nursing_name, nc.service_price, nl.level_name
       FROM customernurseitem cni
       LEFT JOIN nursecontent nc ON nc.id = cni.item_id
       LEFT JOIN nurselevel nl ON nl.id = cni.level_id
       WHERE cni.customer_id = ? AND cni.is_deleted = 0 ORDER BY cni.id`,
      [customerId]
    );
    return { records: rowsToCamel(rows), total: rows.length };
  }

  if (method === "POST" && path === "/api/nurse/customer-items") {
    const b = body;
    const r = await db.query(
      `INSERT INTO customernurseitem (item_id, customer_id, level_id, nurse_number, is_deleted, buy_time, maturity_time)
       VALUES (?,?,?,?,0,?,?)`,
      [b.itemId, b.customerId, b.levelId || null, b.nurseNumber ?? 1, b.buyTime, b.maturityTime]
    );
    if (b.levelId) await db.query("UPDATE customer SET level_id = ? WHERE id = ?", [b.levelId, b.customerId]);
    return rowToCamel(await db.queryOne("SELECT * FROM customernurseitem WHERE id = ?", [r.insertId]));
  }

  if (method === "PUT" && path.match(/^\/api\/nurse\/customer-items\/\d+$/)) {
    const id = Number(path.split("/")[4]);
    const b = body;
    await db.query(
      `UPDATE customernurseitem SET item_id=?, level_id=?, nurse_number=?, buy_time=?, maturity_time=? WHERE id=?`,
      [b.itemId, b.levelId, b.nurseNumber, b.buyTime, b.maturityTime, id]
    );
    return rowToCamel(await db.queryOne("SELECT * FROM customernurseitem WHERE id = ?", [id]));
  }

  if (method === "DELETE" && path.match(/^\/api\/nurse\/customer-items\/\d+$/)) {
    const id = Number(path.split("/")[4]);
    await db.query("UPDATE customernurseitem SET is_deleted = 1 WHERE id = ?", [id]);
    return null;
  }

  if (method === "GET" && path === "/api/caregiver/elders-status") {
    const rows = await db.query(
      `SELECT c.*, b.bed_status, b.bed_no,
        (SELECT auditstatus FROM outward o WHERE o.customer_id = c.id AND o.is_deleted = 0 AND o.auditstatus = 1
         AND o.actualreturntime IS NULL ORDER BY o.id DESC LIMIT 1) AS outward_active
       FROM customer c
       LEFT JOIN bed b ON b.id = c.bed_id
       WHERE c.is_deleted = 0
       ORDER BY c.id`
    );
    const list = rowsToCamel(rows).map((r) => ({
      ...r,
      bedStatusLabel: r.bedStatus === 1 ? "空闲" : r.bedStatus === 2 ? "在院" : r.bedStatus === 3 ? "外出" : "-",
      elderType: r.levelId ? "护理" : "自理",
      residenceStatus: r.outwardActive != null ? "外出中" : r.bedStatus === 2 ? "在院" : r.bedStatus === 3 ? "外出" : "在院",
    }));
    return { records: list, total: list.length };
  }

  if (method === "GET" && path === "/api/users") {
    const rows = await db.query("SELECT id, nickname, username, sex, phone_number, role_id, is_deleted FROM `user` WHERE is_deleted = 0");
    return { records: rowsToCamel(rows), total: rows.length };
  }

  if (method === "GET" && path === "/api/approval/outward") {
    let sql = `SELECT o.*, c.customer_name FROM outward o LEFT JOIN customer c ON c.id = o.customer_id WHERE o.is_deleted = 0`;
    const params = [];
    if (qs.submitUserId) {
      sql += " AND o.submit_user_id = ?";
      params.push(Number(qs.submitUserId));
    }
    sql += " ORDER BY o.id DESC";
    return { records: rowsToCamel(await db.query(sql, params)), total: 0 };
  }

  if (method === "POST" && path === "/api/approval/outward") {
    const err = validateOutwardDates(body.outgoingtime, body.expectedreturntime);
    if (err) throw Object.assign(new Error(err), { statusCode: 400 });
    const submitUserId = body.submitUserId || authUser?.uid || null;
    const r = await db.query(
      `INSERT INTO outward (customer_id, outgoingreason, outgoingtime, expectedreturntime, escorted, relation, escortedtel,
        auditstatus, is_deleted, submit_user_id) VALUES (?,?,?,?,?,?,?,0,0,?)`,
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
    return rowToCamel(await db.queryOne("SELECT * FROM outward WHERE id = ?", [r.insertId]));
  }

  if (method === "PUT" && path.match(/^\/api\/approval\/outward\/\d+\/audit$/)) {
    const id = Number(path.split("/")[4]);
    const pass = qs.pass === "true";
    await db.query("UPDATE outward SET auditstatus = ? WHERE id = ?", [pass ? 1 : 2, id]);
    if (pass) {
      const o = await db.queryOne("SELECT * FROM outward WHERE id = ?", [id]);
      const c = await db.queryOne("SELECT * FROM customer WHERE id = ?", [o.customer_id]);
      if (c?.bed_id) await db.query("UPDATE bed SET bed_status = 3 WHERE id = ?", [c.bed_id]);
    }
    return null;
  }

  if (method === "PUT" && path.match(/^\/api\/approval\/outward\/\d+\/return$/)) {
    const id = Number(path.split("/")[4]);
    const actual = qs.actualReturnTime || new Date().toISOString().slice(0, 10);
    await db.query("UPDATE outward SET actualreturntime = ? WHERE id = ?", [actual, id]);
    const o = await db.queryOne("SELECT * FROM outward WHERE id = ?", [id]);
    const c = await db.queryOne("SELECT * FROM customer WHERE id = ?", [o.customer_id]);
    if (c?.bed_id) await db.query("UPDATE bed SET bed_status = 2 WHERE id = ? AND bed_status = 3", [c.bed_id]);
    return null;
  }

  if (method === "GET" && path === "/api/approval/backdown") {
    let sql = `SELECT b.*, c.customer_name FROM backdown b LEFT JOIN customer c ON c.id = b.customer_id WHERE b.is_deleted = 0`;
    const params = [];
    if (qs.submitUserId) {
      sql += " AND b.submit_user_id = ?";
      params.push(Number(qs.submitUserId));
    }
    sql += " ORDER BY b.id DESC";
    const records = rowsToCamel(await db.query(sql, params));
    return { records, total: records.length };
  }

  if (method === "POST" && path === "/api/approval/backdown") {
    const submitUserId = body.submitUserId || authUser?.uid || null;
    const r = await db.query(
      `INSERT INTO backdown (customer_id, retreattime, retreattype, retreatreason, auditstatus, is_deleted, submit_user_id)
       VALUES (?,?,?,?,0,0,?)`,
      [body.customerId, body.retreattime, body.retreattype ?? 0, body.retreatreason || null, submitUserId]
    );
    return rowToCamel(await db.queryOne("SELECT * FROM backdown WHERE id = ?", [r.insertId]));
  }

  if (method === "PUT" && path.match(/^\/api\/approval\/backdown\/\d+\/audit$/)) {
    const id = Number(path.split("/")[4]);
    const pass = qs.pass === "true";
    await db.query("UPDATE backdown SET auditstatus = ? WHERE id = ?", [pass ? 1 : 2, id]);
    if (pass) {
      const b = await db.queryOne("SELECT * FROM backdown WHERE id = ?", [id]);
      if (b.retreattype === 0 || b.retreattype === 1) {
        const c = await db.queryOne("SELECT * FROM customer WHERE id = ?", [b.customer_id]);
        if (c?.bed_id) await db.query("UPDATE bed SET bed_status = 1 WHERE id = ?", [c.bed_id]);
      }
    }
    return null;
  }

  return undefined;
}

module.exports = { handle };
