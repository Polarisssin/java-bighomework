import { execSync } from "child_process";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

function run(cmd) {
  execSync(cmd, { stdio: "inherit", encoding: "utf8" });
}

function commit(paths, message) {
  for (const p of paths) {
    try {
      run(`git add "${p}"`);
    } catch {
      /* ignore */
    }
  }
  let status = "";
  try {
    status = execSync("git status --porcelain", { encoding: "utf8" }).trim();
  } catch {
    return;
  }
  if (!status) {
    console.log("  (skip)", message);
    return;
  }
  run(`git commit -m "${message.replace(/"/g, '\\"')}"`);
  console.log("  OK", message);
}

if (!existsSync(join(root, ".git"))) {
  run("git init");
  run("git branch -M main");
} else {
  console.log(".git exists, continuing...");
}

commit(
  [".gitignore", "README.md", "CHANGELOG.md", "cloudbaserc.example.json", "docs", "sql"],
  "chore(v1.0.0): docs, CHANGELOG, SQL scripts"
);
commit(["backend"], "feat(v1.0.0): Spring Boot backend");
commit(["cloudfunctions"], "feat(v1.1.0): cloud function elderCareApi");
commit(["frontend"], "feat(v1.2-v1.5): Vue3 frontend (encoding, RBAC, spec, nurse flow)");
commit(["scripts"], "chore: build and deploy scripts");

const tags = [
  ["v1.0.0", "Baseline: core modules + Spring Boot + SQL"],
  ["v1.1.0", "CloudBase hosting and cloud function deploy"],
  ["v1.2.0", "Fix production Chinese encoding (ui-text, ascii-dist)"],
  ["v1.3.0", "Route guards, dashboard, user admin"],
  ["v1.4.0", "Requirements spec gap fill (beddetails, service, audit)"],
  ["v1.5.0", "Nurse module responsibility split"],
];
for (const [tag, msg] of tags) {
  try {
    run(`git tag -a ${tag} -m "${msg.replace(/"/g, '\\"')}" -f`);
    console.log("  tag", tag);
  } catch (e) {
    console.warn("  tag failed", tag, e.message);
  }
}

console.log("\nDone. Push: git remote add origin <url> && git push -u origin main && git push origin --tags");
