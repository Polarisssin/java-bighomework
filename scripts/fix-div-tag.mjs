import fs from "fs";
const p = process.argv[2];
let s = fs.readFileSync(p, "utf8");
const wrong = "</" + "motion" + ">";
const right = "</" + "div" + ">";
s = s.split(wrong).join(right);
fs.writeFileSync(p, s);
console.log("line7:", s.split(/\r?\n/)[6]);
