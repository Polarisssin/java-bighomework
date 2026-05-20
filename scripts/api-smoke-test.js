"use strict";
const BASE =
  process.env.API_BASE ||
  "https://health-app-env-3g73ck72bcb11c66-1401396930.ap-shanghai.app.tcloudbase.com/elder-care/api";

async function req(method, path, { token, body, qs } = {}) {
  const url = new URL(BASE + path);
  if (qs) for (const [k, v] of Object.entries(qs)) url.searchParams.set(k, String(v));
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: res.status, json };
}

async function login(username, password) {
  const r = await req("POST", "/auth/login", { body: { username, password } });
  if (r.json?.code !== 200) throw new Error(`login ${username}: ${r.status} ${JSON.stringify(r.json)}`);
  return r.json.data.token;
}

function report(name, r) {
  const ok = r.status === 200 && r.json?.code === 200;
  console.log(`${ok ? "PASS" : "FAIL"} ${name} HTTP=${r.status} code=${r.json?.code} msg=${r.json?.message || ""}`);
  if (!ok) console.log("  body:", JSON.stringify(r.json).slice(0, 300));
  return { name, ok, status: r.status, json: r.json };
}

async function main() {
  const results = [];
  const adminToken = await login("admin", "admin");
  const nurseToken = await login("nurse01", "nurse01");

  results.push(report("admin beds/statistics", await req("GET", "/beds/statistics", { token: adminToken })));
  results.push(report("admin beds/diagram floor=1", await req("GET", "/beds/diagram", { token: adminToken, qs: { floor: 1 } })));
  results.push(report("admin customers page", await req("GET", "/customers", { token: adminToken, qs: { page: 1, size: 5 } })));
  results.push(report("admin nurse/records", await req("GET", "/nurse/records", { token: adminToken, qs: { page: 1, size: 5 } })));

  const nurseElders = await req("GET", "/caregiver/elders-status", { token: nurseToken });
  results.push(report("nurse elders-status", nurseElders));
  const nurseRecords = nurseElders.json?.data?.records || [];
  const wrongAssign = nurseRecords.filter((c) => c.userId && Number(c.userId) !== 0);
  const nurseUid = JSON.parse(Buffer.from(nurseToken, "base64").toString()).uid;
  const leak = wrongAssign.filter((c) => Number(c.userId) !== Number(nurseUid));
  if (leak.length) {
    console.log("FAIL nurse sees unassigned elders:", leak.map((c) => ({ id: c.id, userId: c.userId })));
    results.push({ name: "nurse elder scope", ok: false });
  } else {
    console.log(`PASS nurse elder scope (${nurseRecords.length} records, uid=${nurseUid})`);
    results.push({ name: "nurse elder scope", ok: true });
  }

  const adminElders = await req("GET", "/caregiver/elders-status", { token: adminToken });
  const adminCount = adminElders.json?.data?.records?.length || 0;
  const spoof = await req("GET", "/caregiver/elders-status", {
    token: nurseToken,
    qs: { caregiverUserId: 1 },
  });
  const spoofCount = spoof.json?.data?.records?.length || 0;
  const nurseCust = await req("GET", "/customers", { token: nurseToken, qs: { page: 1, size: 100 } });
  const nurseCustAll = nurseCust.json?.data?.records || [];
  const custLeak = nurseCustAll.some((c) => c.userId && Number(c.userId) !== Number(nurseUid));
  console.log(
    `${custLeak ? "FAIL" : "PASS"} nurse /customers scope (${nurseCustAll.length} rows, admin elders ${adminCount})`
  );
  results.push({ name: "nurse customers scope", ok: !custLeak });
  const idorOk =
    spoof.json?.code === 403 ||
    (spoofCount <= nurseRecords.length && spoofCount < adminCount);
  console.log(
    `${idorOk ? "PASS" : "FAIL"} nurse caregiverUserId ignored (nurse=${nurseRecords.length}, spoof=${spoofCount}, admin=${adminCount})`
  );
  results.push({ name: "nurse caregiverUserId IDOR", ok: idorOk });

  if (nurseRecords[0]?.id) {
    results.push(
      report(
        "nurse daily-plan",
        await req("GET", "/caregiver/daily-plan", {
          token: nurseToken,
          qs: { customerId: nurseRecords[0].id },
        })
      )
    );
    const otherCust = (await req("GET", "/customers", { token: adminToken, qs: { page: 1, size: 50 } })).json?.data
      ?.records;
    const foreign = otherCust?.find((c) => c.userId && Number(c.userId) !== Number(nurseUid));
    if (foreign) {
      const forbidden = await req("GET", "/caregiver/daily-plan", {
        token: nurseToken,
        qs: { customerId: foreign.id },
      });
      const blocked = forbidden.json?.code === 403 || forbidden.status === 403;
      console.log(`${blocked ? "PASS" : "FAIL"} nurse daily-plan foreign customer ${foreign.id}`);
      results.push({ name: "nurse daily-plan foreign", ok: blocked });
    }
  }

  const assign403 = await req("PUT", "/caregiver/assign", {
    token: nurseToken,
    body: { customerId: 1, userId: 2 },
  });
  const blockedAssign = assign403.status === 403 || assign403.json?.code === 403;
  console.log(`${blockedAssign ? "PASS" : "FAIL"} nurse assign -> 403`);
  results.push({ name: "nurse assign 403", ok: blockedAssign });

  const failed = results.filter((r) => !r.ok);
  console.log("\n--- Summary ---");
  console.log(`Total: ${results.length}, Failed: ${failed.length}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
