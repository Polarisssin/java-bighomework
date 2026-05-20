import { readFileSync } from "fs";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const ENV_ID = process.env.TCB_ENV_ID || "health-app-env-3g73ck72bcb11c66";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(root, "sql", "cloud-init-data.sql"), "utf8");

const statements = raw
  .split(/;\s*[\r\n]+/)
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("--"));

function runSql(sql) {
  const r = spawnSync(
    "npx",
    ["-p", "@cloudbase/cli", "cloudbase", "db", "execute", "-e", ENV_ID, "-s", sql, "--json"],
    { encoding: "utf8", shell: true, maxBuffer: 20 * 1024 * 1024 }
  );
  const out = (r.stdout || "") + (r.stderr || "");
  return { ok: r.status === 0 && !out.includes('"error"'), out };
}

let ok = 0;
let fail = 0;
for (let i = 0; i < statements.length; i++) {
  const sql = statements[i] + ";";
  const label = sql.slice(0, 56).replace(/\s+/g, " ");
  const { ok: passed, out } = runSql(sql);
  if (passed) {
    ok++;
    console.log(`[${i + 1}/${statements.length}] OK ${label}`);
  } else {
    fail++;
    console.log(`[${i + 1}/${statements.length}] FAIL ${label}`);
    console.log(out.slice(0, 600));
  }
}
console.log(`Done: ${ok} ok, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
