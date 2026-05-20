import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const umlDir = join(root, "docs", "uml");
const input = join(umlDir, "elder-care-class-diagram.puml");
const outDir = umlDir;

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

function tryRender(cmd, label) {
  try {
    console.log(`Trying ${label}...`);
    execSync(cmd, { stdio: "inherit", cwd: root, timeout: 120000 });
    return true;
  } catch (e) {
    console.warn(`${label} failed:`, e.message?.slice(0, 200));
    return false;
  }
}

const outFile = join(outDir, "elder-care-class-diagram.png");

// 1) node-plantuml (downloads plantuml jar)
if (
  tryRender(
    `npx -y node-plantuml "${input}" -o "${outDir}" -tpng`,
    "node-plantuml"
  )
) {
  console.log("Done via node-plantuml");
  process.exit(0);
}

// 2) @plantuml/plantuml (embedded)
if (
  tryRender(
    `npx -y @plantuml/plantuml -tpng -o "${outDir}" "${input}"`,
    "@plantuml/plantuml"
  )
) {
  console.log("Done via @plantuml/plantuml");
  process.exit(0);
}

// 3) plantuml.com public server (needs network)
if (
  tryRender(
    `npx -y node-plantuml -r https://www.plantuml.com/plantuml "${input}" -o "${outDir}"`,
    "plantuml server"
  )
) {
  process.exit(0);
}

console.log("Falling back to Kroki API...");
execSync(`node "${join(root, "scripts", "render-puml-kroki.mjs")}"`, { stdio: "inherit" });
process.exit(0);
