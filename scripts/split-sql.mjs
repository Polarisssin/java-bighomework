import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(root, "sql", "cloud-init.sql"), "utf8");
const parts = raw.split(/(?=DROP TABLE|CREATE TABLE|INSERT INTO|UPDATE )/);
const dir = join(root, "sql", "chunks");
mkdirSync(dir, { recursive: true });
let i = 0;
for (const p of parts) {
  const s = p.trim();
  if (!s) continue;
  i++;
  writeFileSync(join(dir, `part-${String(i).padStart(2, "0")}.sql`), s.endsWith(";") ? s : s + ";", "utf8");
}
console.log(`Wrote ${i} chunks`);
