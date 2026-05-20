"use strict";

const M = require("./mappers");
const { calcAge, validateOutwardDates } = require("./util");

const MENUS = [
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
  { id: 16, menusIndex: "5", title: "用户管理", icon: "UserFilled", path: "/user/manage", parentId: null },
];

const CAREGIVER_MENUS = [
  { id: 17, menusIndex: "6", title: "健康管家", icon: "Suitcase", path: null, parentId: null },
  { id: 18, menusIndex: "6", title: "老人状态", icon: "View", path: "/caregiver/elders", parentId: 17 },
  { id: 20, menusIndex: "7", title: "客户管理", icon: "User", path: null, parentId: null },
  { id: 21, menusIndex: "7", title: "外出申请", icon: "Promotion", path: "/caregiver/outward", parentId: 20 },
  { id: 22, menusIndex: "7", title: "退住申请", icon: "Back", path: "/caregiver/backdown", parentId: 20 },
];

function menusForRole(roleId) {
  return roleId === 1 ? MENUS : CAREGIVER_MENUS;
}

function pageOf(records, page = 1, size = 10) {
  return { records, total: records.length, size: Number(size), current: Number(page) };
}

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function createInitialState() {
  return {
    nextUserId: 3,
    nextCustomerId: 7,
    nextBedId: 13,
    nextRoomId: 7,
    nextNurseContentId: 5,
    nextNurseLevelId: 4,
    nextCustomerNurseItemId: 3,
    nextOutwardId: 2,
    nextBackdownId: 2,
    users: [
      {
        id: 1,
        nickname: "管理员",
        username: "admin",
        password: "admin",
        sex: 1,
        phone_number: "13800000001",
        role_id: 1,
        is_deleted: 0,
      },
      {
        id: 2,
        nickname: "护工张姐",
        username: "nurse01",
        password: "nurse01",
        sex: 0,
        phone_number: "13800000002",
        role_id: 2,
        is_deleted: 0,
      },
    ],
    rooms: [
      { id: 1, room_no: 101, room_floor: "1", bed_count: 2, room_type: 1 },
      { id: 2, room_no: 102, room_floor: "1", bed_count: 2, room_type: 1 },
      { id: 3, room_no: 103, room_floor: "1", bed_count: 2, room_type: 2 },
      { id: 4, room_no: 201, room_floor: "2", bed_count: 2, room_type: 1 },
      { id: 5, room_no: 202, room_floor: "2", bed_count: 2, room_type: 1 },
      { id: 6, room_no: 203, room_floor: "2", bed_count: 2, room_type: 1 },
    ],
    beds: [
      { id: 1, room_no: 101, bed_no: 1, bed_status: 2 },
      { id: 2, room_no: 101, bed_no: 2, bed_status: 2 },
      { id: 3, room_no: 102, bed_no: 1, bed_status: 2 },
      { id: 4, room_no: 102, bed_no: 2, bed_status: 1 },
      { id: 5, room_no: 103, bed_no: 1, bed_status: 2 },
      { id: 6, room_no: 103, bed_no: 2, bed_status: 1 },
      { id: 7, room_no: 201, bed_no: 1, bed_status: 1 },
      { id: 8, room_no: 201, bed_no: 2, bed_status: 1 },
      { id: 9, room_no: 202, bed_no: 1, bed_status: 3 },
      { id: 10, room_no: 202, bed_no: 2, bed_status: 1 },
      { id: 11, room_no: 203, bed_no: 1, bed_status: 1 },
      { id: 12, room_no: 203, bed_no: 2, bed_status: 1 },
    ],
    customers: [
      {
        id: 1,
        customer_name: "王建国",
        customer_age: 78,
        customer_sex: 1,
        idcard: "110101194801011234",
        room_no: "101",
        building_no: "606",
        checkin_date: "2023-01-10",
        expiration_date: "2026-12-31",
        contact_tel: "13900001001",
        bed_id: 1,
        blood_type: "A",
        filepath: "/avatar/default.png",
        user_id: -1,
        level_id: null,
        family_member: "王小明(子)",
        birthday: "1948-01-01",
        is_deleted: 0,
      },
      {
        id: 2,
        customer_name: "李秀英",
        customer_age: 82,
        customer_sex: 0,
        idcard: "110101194202021234",
        room_no: "101",
        building_no: "606",
        checkin_date: "2023-03-15",
        expiration_date: "2026-06-30",
        contact_tel: "13900001002",
        bed_id: 2,
        blood_type: "O",
        filepath: "/avatar/default.png",
        user_id: -1,
        level_id: 2,
        family_member: "李强(子)",
        birthday: "1942-02-02",
        is_deleted: 0,
      },
      {
        id: 3,
        customer_name: "赵春华",
        customer_age: 75,
        customer_sex: 0,
        idcard: "110101195005051234",
        room_no: "102",
        building_no: "606",
        checkin_date: "2024-01-05",
        expiration_date: "2027-01-05",
        contact_tel: "13900001003",
        bed_id: 3,
        blood_type: "B",
        filepath: "/avatar/default.png",
        user_id: -1,
        level_id: null,
        family_member: null,
        birthday: "1950-05-05",
        is_deleted: 0,
      },
      {
        id: 4,
        customer_name: "孙卫国",
        customer_age: 80,
        customer_sex: 1,
        idcard: "110101194412121234",
        room_no: "103",
        building_no: "606",
        checkin_date: "2022-11-20",
        expiration_date: "2025-11-20",
        contact_tel: "13900001004",
        bed_id: 5,
        blood_type: "AB",
        filepath: "/avatar/default.png",
        user_id: -1,
        level_id: 1,
        family_member: "孙丽(女)",
        birthday: "1944-12-12",
        is_deleted: 0,
      },
      {
        id: 5,
        customer_name: "周梅花",
        customer_age: 77,
        customer_sex: 0,
        idcard: "110101194808081234",
        room_no: "202",
        building_no: "606",
        checkin_date: "2024-06-01",
        expiration_date: "2027-06-01",
        contact_tel: "13900001005",
        bed_id: 9,
        blood_type: "A",
        filepath: "/avatar/default.png",
        user_id: -1,
        level_id: null,
        family_member: "周伟(侄)",
        birthday: "1948-08-08",
        is_deleted: 0,
      },
      {
        id: 6,
        customer_name: "吴水生",
        customer_age: 85,
        customer_sex: 1,
        idcard: "110101194003031234",
        room_no: "",
        building_no: "606",
        checkin_date: "2025-01-08",
        expiration_date: "2026-01-08",
        contact_tel: "13900001006",
        bed_id: null,
        blood_type: "O",
        filepath: "/avatar/default.png",
        user_id: -1,
        level_id: 3,
        family_member: null,
        birthday: "1940-03-03",
        is_deleted: 0,
      },
    ],
    nursecontent: [
      {
        id: 1,
        serial_number: "N001",
        nursing_name: "晨间护理",
        service_price: "30.00",
        message: "漱口、擦脸、整理床铺",
        status: 1,
        execution_cycle: "每日",
        execution_times: "1",
        is_deleted: 0,
      },
      {
        id: 2,
        serial_number: "N002",
        nursing_name: "测血压",
        service_price: "10.00",
        message: "早晚各一次",
        status: 1,
        execution_cycle: "每日",
        execution_times: "2",
        is_deleted: 0,
      },
      {
        id: 3,
        serial_number: "N003",
        nursing_name: "泡脚",
        service_price: "25.00",
        message: "温水泡脚20分钟",
        status: 1,
        execution_cycle: "每日",
        execution_times: "1",
        is_deleted: 0,
      },
      {
        id: 4,
        serial_number: "N004",
        nursing_name: "服药提醒",
        service_price: "15.00",
        message: "按医嘱协助用药",
        status: 1,
        execution_cycle: "每日",
        execution_times: "3",
        is_deleted: 0,
      },
    ],
    nurselevel: [
      { id: 1, level_name: "一级护理", level_status: 1, level_price: "1200.00", is_deleted: 0 },
      { id: 2, level_name: "二级护理", level_status: 1, level_price: "1800.00", is_deleted: 0 },
      { id: 3, level_name: "三级护理", level_status: 1, level_price: "2500.00", is_deleted: 0 },
    ],
    customernurseitem: [
      {
        id: 1,
        item_id: 1,
        customer_id: 2,
        level_id: 2,
        nurse_number: 1,
        buy_time: "2023-03-15",
        maturity_time: "2024-03-15",
        is_deleted: 0,
      },
      {
        id: 2,
        item_id: 2,
        customer_id: 4,
        level_id: 1,
        nurse_number: 2,
        buy_time: "2022-11-20",
        maturity_time: "2023-11-20",
        is_deleted: 0,
      },
    ],
    outward: [
      {
        id: 1,
        customer_id: 5,
        outgoingreason: "家属陪同复查",
        outgoingtime: "2025-05-10",
        expectedreturntime: "2025-05-12",
        escorted: "周伟",
        relation: "侄子",
        escortedtel: "13900002001",
        auditstatus: 1,
        actualreturntime: null,
        submit_user_id: 2,
        is_deleted: 0,
      },
    ],
    backdown: [
      {
        id: 1,
        customer_id: 6,
        retreattime: "2025-05-15",
        retreattype: 0,
        retreatreason: "回家休养",
        auditstatus: 0,
        submit_user_id: 1,
        is_deleted: 0,
      },
    ],
  };
}

let state = createInitialState();

function roomFloorForRoomNo(roomNo) {
  const r = state.rooms.find((x) => Number(x.room_no) === Number(roomNo));
  return r ? String(r.room_floor) : "";
}

function bedWithFloor(b) {
  return { ...b, room_floor: roomFloorForRoomNo(b.room_no) };
}

async function handle(method, path, body, qs) {
  qs = qs || {};
  body = body || {};

  if (method === "POST" && path === "/api/auth/login") {
    const row = state.users.find(
      (u) =>
        u.username === body.username &&
        u.password === body.password &&
        u.is_deleted === 0
    );
    if (!row) throw { status: 400, message: "用户名或密码错误" };
    const user = M.mapUser(row);
    delete user.password;
    return {
      token: Buffer.from(JSON.stringify({ uid: user.id, role: user.roleId })).toString("base64"),
      user,
      menus: menusForRole(user.roleId),
    };
  }

  if (method === "GET" && path === "/api/customers") {
    let list = state.customers.filter((c) => c.is_deleted === 0);
    const elderlyType = qs.elderlyType || "all";
    if (elderlyType === "self") list = list.filter((c) => c.level_id == null);
    else if (elderlyType === "nursing") list = list.filter((c) => c.level_id != null);
    if ((qs.name || "").trim()) {
      const q = (qs.name || "").trim();
      list = list.filter((c) => String(c.customer_name).includes(q));
    }
    list = [...list].sort((a, b) => b.id - a.id);
    return pageOf(list.map(M.mapCustomer), qs.page, qs.size);
  }

  if (method === "POST" && path === "/api/customers/checkin") {
    const age = body.birthday ? calcAge(body.birthday) : body.customerAge || 0;
    const id = state.nextCustomerId++;
    const row = {
      id,
      customer_name: body.customerName,
      customer_age: age,
      customer_sex: body.customerSex ?? 0,
      idcard: body.idcard || "",
      room_no: body.roomNo || "",
      building_no: "606",
      checkin_date: body.checkinDate,
      expiration_date: body.expirationDate,
      contact_tel: body.contactTel || "",
      bed_id: body.bedId || null,
      blood_type: body.bloodType || "A",
      filepath: body.filepath || "/avatar/default.png",
      user_id: body.userId ?? -1,
      level_id: body.levelId ?? null,
      family_member: body.familyMember ?? null,
      birthday: body.birthday ?? null,
      is_deleted: 0,
    };
    state.customers.push(row);
    if (body.bedId) {
      const bed = state.beds.find((b) => b.id === Number(body.bedId));
      if (bed && bed.bed_status === 1) {
        bed.bed_status = 2;
        if (bed.room_no) row.room_no = String(bed.room_no);
      }
    }
    return M.mapCustomer(deepCopy(row));
  }

  if (method === "PUT" && path.match(/^\/api\/customers\/\d+$/)) {
    const id = Number(path.split("/").pop());
    const existing = state.customers.find((c) => c.id === id && c.is_deleted === 0);
    if (!existing) throw { status: 404, message: "客户不存在" };
    const age = body.birthday ? calcAge(body.birthday) : body.customerAge ?? existing.customer_age;
    const newBedId = body.bedId != null ? Number(body.bedId) : existing.bed_id;
    const oldBedId = existing.bed_id;
    let roomNo = body.roomNo ?? existing.room_no;
    if (newBedId !== oldBedId) {
      if (oldBedId) {
        const ob = state.beds.find((b) => b.id === oldBedId);
        if (ob) ob.bed_status = 1;
      }
      if (newBedId) {
        const newBed = state.beds.find((b) => b.id === newBedId);
        if (!newBed || newBed.bed_status !== 1) throw { status: 400, message: "床位不可用" };
        newBed.bed_status = 2;
        roomNo = String(newBed.room_no);
      }
    }
    Object.assign(existing, {
      customer_name: body.customerName ?? existing.customer_name,
      customer_age: age,
      customer_sex: body.customerSex ?? existing.customer_sex,
      idcard: body.idcard ?? existing.idcard,
      room_no: roomNo,
      checkin_date: body.checkinDate ?? existing.checkin_date,
      expiration_date: body.expirationDate ?? existing.expiration_date,
      contact_tel: body.contactTel ?? existing.contact_tel,
      bed_id: newBedId || null,
      blood_type: body.bloodType ?? existing.blood_type,
      family_member: body.familyMember ?? existing.family_member,
      birthday: body.birthday ?? existing.birthday,
      level_id: body.levelId !== undefined ? body.levelId : existing.level_id,
    });
    return M.mapCustomer(deepCopy(existing));
  }

  if (method === "DELETE" && path.match(/^\/api\/customers\/\d+$/)) {
    const id = Number(path.split("/").pop());
    const c = state.customers.find((x) => x.id === id);
    if (c) {
      c.is_deleted = 1;
      if (c.bed_id) {
        const bed = state.beds.find((b) => b.id === c.bed_id);
        if (bed) bed.bed_status = 1;
      }
    }
    return null;
  }

  if (method === "GET" && path === "/api/beds/statistics") {
    const beds = state.beds;
    return {
      total: beds.length,
      free: beds.filter((b) => b.bed_status === 1).length,
      occupied: beds.filter((b) => b.bed_status === 2).length,
      out: beds.filter((b) => b.bed_status === 3).length,
    };
  }

  if (method === "GET" && path === "/api/beds/diagram") {
    const floor = qs.floor || "1";
    const rooms = state.rooms
      .filter((r) => String(r.room_floor) === String(floor))
      .sort((a, b) => Number(a.room_no) - Number(b.room_no));
    const data = [];
    for (const room of rooms) {
      const beds = state.beds
        .filter((b) => Number(b.room_no) === Number(room.room_no))
        .sort((a, b) => Number(a.bed_no) - Number(b.bed_no));
      data.push({ room: M.mapRoom(room), beds: beds.map(M.mapBed) });
    }
    return data;
  }

  if (method === "GET" && path === "/api/beds/rooms") {
    const rooms = [...state.rooms].sort(
      (a, b) => Number(a.room_floor) - Number(b.room_floor) || Number(a.room_no) - Number(b.room_no)
    );
    return rooms.map(M.mapRoom);
  }

  if (method === "GET" && path === "/api/beds/overview") {
    const statusLabel = (s) => (s === 1 ? "空闲" : s === 2 ? "有人" : "外出");
    const beds = [...state.beds]
      .map(bedWithFloor)
      .sort((a, b) => Number(a.room_no) - Number(b.room_no) || Number(a.bed_no) - Number(b.bed_no));
    const customers = state.customers.filter((c) => c.is_deleted === 0);
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
      if (bed.bed_status === 1) free.push(row);
      else {
        const c = byBed.get(bed.id);
        occupied.push({
          ...row,
          customerId: c?.id ?? null,
          customerName: c?.customer_name ?? "-",
        });
      }
    }
    return {
      statistics: {
        total: beds.length,
        free: free.length,
        occupied: beds.filter((b) => b.bed_status === 2).length,
        out: beds.filter((b) => b.bed_status === 3).length,
      },
      occupied,
      free,
    };
  }

  if (method === "GET" && path === "/api/beds/free") {
    let list = state.beds.filter((b) => b.bed_status === 1);
    if (qs.roomNo) list = list.filter((b) => Number(b.room_no) === Number(qs.roomNo));
    list = [...list].sort((a, b) => Number(a.room_no) - Number(b.room_no) || Number(a.bed_no) - Number(b.bed_no));
    return list.map(M.mapBed);
  }

  if (method === "POST" && path === "/api/beds/swap") {
    const customerId = Number(qs.customerId);
    const newBedId = Number(qs.newBedId);
    const c = state.customers.find((x) => x.id === customerId && x.is_deleted === 0);
    if (!c) throw { status: 400, message: "客户不存在" };
    const newBed = state.beds.find((b) => b.id === newBedId);
    if (!newBed || newBed.bed_status !== 1) throw { status: 400, message: "目标床位不可用" };
    if (c.bed_id) {
      const ob = state.beds.find((b) => b.id === c.bed_id);
      if (ob) ob.bed_status = 1;
    }
    newBed.bed_status = 2;
    c.bed_id = newBedId;
    c.room_no = String(newBed.room_no);
    return null;
  }

  if (method === "GET" && path === "/api/nurse/content") {
    let list = state.nursecontent.filter((n) => n.is_deleted === 0);
    if (qs.status != null && qs.status !== "") {
      list = list.filter((n) => n.status === Number(qs.status));
    }
    if ((qs.name || "").trim()) {
      const q = (qs.name || "").trim();
      list = list.filter((n) => String(n.nursing_name).includes(q));
    }
    list = [...list].sort((a, b) => b.id - a.id);
    return pageOf(list.map(M.mapNurseContent), qs.page, qs.size);
  }

  if (method === "POST" && path === "/api/nurse/content") {
    const id = state.nextNurseContentId++;
    const row = {
      id,
      serial_number: body.serialNumber || "",
      nursing_name: body.nursingName || "",
      service_price: body.servicePrice || "0",
      message: body.message || null,
      status: body.status ?? 1,
      execution_cycle: body.executionCycle || null,
      execution_times: body.executionTimes || null,
      is_deleted: 0,
    };
    state.nursecontent.push(row);
    return M.mapNurseContent(deepCopy(row));
  }

  if (method === "PUT" && path.match(/^\/api\/nurse\/content\/\d+$/)) {
    const id = Number(path.split("/").pop());
    const row = state.nursecontent.find((n) => n.id === id);
    if (!row) throw { status: 404, message: "护理项目不存在" };
    Object.assign(row, {
      serial_number: body.serialNumber,
      nursing_name: body.nursingName,
      service_price: body.servicePrice,
      message: body.message || null,
      status: body.status ?? 1,
      execution_cycle: body.executionCycle || null,
      execution_times: body.executionTimes || null,
    });
    return M.mapNurseContent(deepCopy(row));
  }

  if (method === "DELETE" && path.match(/^\/api\/nurse\/content\/\d+$/)) {
    const id = Number(path.split("/").pop());
    const row = state.nursecontent.find((n) => n.id === id);
    if (row) row.is_deleted = 1;
    return null;
  }

  if (method === "GET" && path === "/api/nurse/level") {
    let list = state.nurselevel.filter((l) => l.is_deleted === 0);
    if (qs.status != null && qs.status !== "") {
      list = list.filter((l) => l.level_status === Number(qs.status));
    }
    list = [...list].sort((a, b) => a.id - b.id);
    return pageOf(list.map(M.rowToCamel), qs.page, qs.size);
  }

  if (method === "GET" && path === "/api/nurse/customer-items") {
    const customerId = Number(qs.customerId);
    if (!customerId) throw { status: 400, message: "缺少 customerId" };
    let rows = state.customernurseitem.filter((x) => x.customer_id === customerId && x.is_deleted === 0);
    rows = [...rows].sort((a, b) => b.id - a.id);
    const enriched = rows.map((cni) => {
      const nc = state.nursecontent.find((n) => n.id === cni.item_id);
      const nl = state.nurselevel.find((l) => l.id === cni.level_id);
      return {
        ...cni,
        nursing_name: nc?.nursing_name,
        serial_number: nc?.serial_number,
        service_price: nc?.service_price,
        level_name: nl?.level_name,
      };
    });
    return pageOf(enriched.map(M.mapCustomerNurseItem), qs.page, qs.size);
  }

  if (method === "POST" && path === "/api/nurse/customer-items") {
    const today = new Date().toISOString().slice(0, 10);
    const id = state.nextCustomerNurseItemId++;
    const row = {
      id,
      item_id: body.itemId,
      customer_id: body.customerId,
      level_id: body.levelId || null,
      nurse_number: body.nurseNumber ?? 1,
      buy_time: body.buyTime || today,
      maturity_time: body.maturityTime || body.expirationDate || today,
      is_deleted: 0,
    };
    state.customernurseitem.push(row);
    const nc = state.nursecontent.find((n) => n.id === row.item_id);
    const nl = state.nurselevel.find((l) => l.id === row.level_id);
    const enriched = {
      ...row,
      nursing_name: nc?.nursing_name,
      serial_number: nc?.serial_number,
      service_price: nc?.service_price,
      level_name: nl?.level_name,
    };
    return M.mapCustomerNurseItem(enriched);
  }

  if (method === "PUT" && path.match(/^\/api\/nurse\/customer-items\/\d+$/)) {
    const id = Number(path.split("/").pop());
    const row = state.customernurseitem.find((x) => x.id === id);
    if (!row) throw { status: 404, message: "记录不存在" };
    Object.assign(row, {
      item_id: body.itemId,
      level_id: body.levelId || null,
      nurse_number: body.nurseNumber ?? 1,
      buy_time: body.buyTime,
      maturity_time: body.maturityTime,
    });
    const nc = state.nursecontent.find((n) => n.id === row.item_id);
    const nl = state.nurselevel.find((l) => l.id === row.level_id);
    const enriched = {
      ...row,
      nursing_name: nc?.nursing_name,
      serial_number: nc?.serial_number,
      service_price: nc?.service_price,
      level_name: nl?.level_name,
    };
    return M.mapCustomerNurseItem(enriched);
  }

  if (method === "DELETE" && path.match(/^\/api\/nurse\/customer-items\/\d+$/)) {
    const id = Number(path.split("/").pop());
    const row = state.customernurseitem.find((x) => x.id === id);
    if (row) row.is_deleted = 1;
    return null;
  }

  if (method === "PUT" && path.match(/^\/api\/nurse\/customer\/\d+\/level$/)) {
    const parts = path.split("/");
    const customerId = Number(parts[4]);
    const c = state.customers.find((x) => x.id === customerId);
    if (!c) throw { status: 404, message: "客户不存在" };
    c.level_id = body.levelId ?? null;
    return null;
  }

  if (method === "GET" && path === "/api/users") {
    const rows = state.users.filter((u) => u.is_deleted === 0);
    return pageOf(rows.map(M.mapUser), qs.page, qs.size);
  }

  if (method === "GET" && path === "/api/approval/outward") {
    let rows = state.outward.filter((o) => o.is_deleted === 0);
    if (qs.submitUserId) {
      rows = rows.filter((o) => o.submit_user_id === Number(qs.submitUserId));
    }
    rows = [...rows].sort((a, b) => b.id - a.id);
    const mapped = rows.map((o) => {
      const c = state.customers.find((x) => x.id === o.customer_id);
      return M.mapOutward({ ...o, customer_name: c?.customer_name });
    });
    return pageOf(mapped, qs.page, qs.size);
  }

  if (method === "POST" && path === "/api/approval/outward") {
    const dateErr = validateOutwardDates(body.outgoingtime, body.expectedreturntime);
    if (dateErr) throw { status: 400, message: dateErr };
    const submitUserId = body.submitUserId ?? null;
    const id = state.nextOutwardId++;
    const row = {
      id,
      customer_id: body.customerId,
      outgoingreason: body.outgoingreason,
      outgoingtime: body.outgoingtime,
      expectedreturntime: body.expectedreturntime,
      escorted: body.escorted || null,
      relation: body.relation || null,
      escortedtel: body.escortedtel || null,
      auditstatus: 0,
      actualreturntime: null,
      submit_user_id: submitUserId,
      is_deleted: 0,
    };
    state.outward.push(row);
    return M.mapOutward(deepCopy(row));
  }

  if (method === "PUT" && path.match(/^\/api\/approval\/outward\/\d+\/audit$/)) {
    const id = Number(path.split("/")[4]);
    const pass = qs.pass === "true";
    const o = state.outward.find((x) => x.id === id);
    if (!o) throw { status: 404, message: "记录不存在" };
    o.auditstatus = pass ? 1 : 2;
    if (pass) {
      const c = state.customers.find((x) => x.id === o.customer_id);
      if (c?.bed_id) {
        const bed = state.beds.find((b) => b.id === c.bed_id);
        if (bed) bed.bed_status = 3;
      }
    }
    return null;
  }

  if (method === "PUT" && path.match(/^\/api\/approval\/outward\/\d+\/return$/)) {
    const id = Number(path.split("/")[4]);
    const actualReturnTime = qs.actualReturnTime || new Date().toISOString().slice(0, 10);
    const o = state.outward.find((x) => x.id === id);
    if (!o) throw { status: 404, message: "记录不存在" };
    o.actualreturntime = actualReturnTime;
    const c = state.customers.find((x) => x.id === o.customer_id);
    if (c?.bed_id) {
      const bed = state.beds.find((b) => b.id === c.bed_id);
      if (bed && bed.bed_status === 3) bed.bed_status = 2;
    }
    return null;
  }

  if (method === "GET" && path === "/api/approval/backdown") {
    let rows = state.backdown.filter((b) => b.is_deleted === 0);
    if (qs.submitUserId) {
      rows = rows.filter((b) => b.submit_user_id === Number(qs.submitUserId));
    }
    rows = [...rows].sort((a, b) => b.id - a.id);
    const mapped = rows.map((r) => {
      const c = state.customers.find((x) => x.id === r.customer_id);
      return M.mapBackdown({ ...r, customer_name: c?.customer_name });
    });
    return pageOf(mapped, qs.page, qs.size);
  }

  if (method === "POST" && path === "/api/approval/backdown") {
    const submitUserId = body.submitUserId ?? null;
    const id = state.nextBackdownId++;
    const row = {
      id,
      customer_id: body.customerId,
      retreattime: body.retreattime,
      retreattype: body.retreattype ?? 0,
      retreatreason: body.retreatreason || null,
      auditstatus: 0,
      submit_user_id: submitUserId,
      is_deleted: 0,
    };
    state.backdown.push(row);
    return M.mapBackdown(deepCopy(row));
  }

  if (method === "PUT" && path.match(/^\/api\/approval\/backdown\/\d+\/audit$/)) {
    const id = Number(path.split("/")[4]);
    const pass = qs.pass === "true";
    const bd = state.backdown.find((x) => x.id === id);
    if (!bd) throw { status: 404, message: "记录不存在" };
    bd.auditstatus = pass ? 1 : 2;
    if (pass) {
      if (bd.retreattype === 0 || bd.retreattype === 1) {
        const c = state.customers.find((x) => x.id === bd.customer_id);
        if (c?.bed_id) {
          const bed = state.beds.find((b) => b.id === c.bed_id);
          if (bed) bed.bed_status = 1;
        }
      }
    }
    return null;
  }

  throw { status: 404, message: `Not Found: ${method} ${path}` };
}

module.exports = { handle };
