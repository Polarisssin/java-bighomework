import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pumlPath = join(root, "docs", "uml", "elder-care-class-diagram.puml");
const outPath = join(root, "docs", "uml", "elder-care-class-diagram.png");

function encodePlantuml(text) {
  const compressed = zlib.deflateSync(text, { level: 9 });
  const bytes = compressed;
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1] ?? 0;
    const b3 = bytes[i + 2] ?? 0;
    result += alphabet[b1 >> 2];
    result += alphabet[((b1 & 3) << 4) | (b2 >> 4)];
    result += alphabet[((b2 & 15) << 2) | (b3 >> 6)];
    result += alphabet[b3 & 63];
  }
  return result;
}

const source = readFileSync(pumlPath, "utf8");
const encoded = encodePlantuml(source);
const url = `https://kroki.io/plantuml/png/${encoded}`;

console.log("Fetching PNG from Kroki...");
const res = await fetch(url);
if (!res.ok) {
  console.error("Kroki failed", res.status, await res.text());
  process.exit(1);
}
const buf = Buffer.from(await res.arrayBuffer());
writeFileSync(outPath, buf);
console.log("Wrote", outPath, buf.length, "bytes");
