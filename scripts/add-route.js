const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const payload = fs.readFileSync(path.join(__dirname, "route-payload.json"), "utf8").trim();
const escaped = payload.replace(/"/g, '\\"');
const cmd = `npx -p @cloudbase/cli cloudbase routes add -e health-app-env-3g73ck72bcb11c66 --data "${escaped}"`;

execSync(cmd, {
  cwd: path.join(__dirname, ".."),
  stdio: ["pipe", "inherit", "inherit"],
  input: "Y\n",
  shell: true,
});

console.log("Done");
