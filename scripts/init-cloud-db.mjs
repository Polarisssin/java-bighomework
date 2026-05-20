/**
 * CloudBase MySQL 初始化（每条 SQL 压成单行后执行）
 */
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { tmpdir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_ID = "health-app-env-3g73ck72bcb11c66";
const raw = readFileSync(join(__dirname, "..", "sql", "cloud-init.sql"), "utf8");

const statements = raw
  .split(/;\s*[\r\n]+/)
  .map((s) => s.replace(/^\s*--[^\n]*\n/gm, "").trim())
  .filter((s) => s.length > 0 && !/^SET\s/i.test(s))
  .map((s) => s.replace(/\s+/g, " "));

console.log(`Executing ${statements.length} statements (single-line)...`);
let ok = 0;
let fail = 0;
const tmpFile = join(tmpdir(), "tcb-init-one.sql");

for (let i = 0; i < statements.length; i++) {
  const sql = statements[i] + ";";
  writeFileSync(tmpFile, sql, { encoding: "utf8" });
  const ps = `$sql = Get-Content -LiteralPath '${tmpFile.replace(/'/g, "''")}' -Raw -Encoding UTF8; npx -p @cloudbase/cli cloudbase db execute -e ${ENV_ID} -s $sql.Trim() --json`;
  const r = spawnSync("powershell", ["-NoProfile", "-Command", ps], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  const out = (r.stdout || "") + (r.stderr || "");
  if (out.includes("rowsAffected") || out.includes('"items"')) {
    ok++;
    console.log(`[${i + 1}/${statements.length}] OK`);
  } else {
    fail++;
    console.log(`[${i + 1}/${statements.length}] FAIL`);
  }
}
try {
  unlinkSync(tmpFile);
} catch {}
console.log(`Done: ${ok} ok, ${fail} fail`);
