/**
 * 将 dist 内 JS 中的非 ASCII 字符转为 \\uXXXX，避免静态托管上传后中文变问号。
 */
import fs from "fs";
import path from "path";

const distAssets = path.resolve("dist/assets");

function escapeNonAscii(content) {
  return content.replace(/[^\x00-\x7f]/g, (ch) => {
    const cp = ch.codePointAt(0);
    if (cp === undefined) return ch;
    if (cp > 0xffff) return `\\u{${cp.toString(16)}}`;
    return `\\u${cp.toString(16).padStart(4, "0")}`;
  });
}

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  if (!/[^\x00-\x7f]/.test(raw)) return false;
  fs.writeFileSync(filePath, escapeNonAscii(raw), "utf8");
  return true;
}

if (!fs.existsSync(distAssets)) {
  console.error("dist/assets not found, run vite build first");
  process.exit(1);
}

let count = 0;
for (const name of fs.readdirSync(distAssets)) {
  if (!name.endsWith(".js")) continue;
  if (processFile(path.join(distAssets, name))) count += 1;
}

console.log(`ascii-dist: escaped non-ASCII in ${count} file(s)`);
