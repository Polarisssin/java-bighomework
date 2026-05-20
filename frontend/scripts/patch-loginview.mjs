import fs from "fs";

const path = "src/views/LoginView.vue";
let s = fs.readFileSync(path, "utf8");

s = s.replace(
  'import { useUserStore } from "@/stores/user";',
  'import { useUserStore } from "@/stores/user";\nimport { UI_TEXT } from "@/constants/ui-text";'
);

s = s.replace(
  /<h1 class="brand-title[^>]*>[\s\S]*?<\/h1>/,
  '<h1 class="brand-title anim-in" style="--d: 0.12s">{{ UI_TEXT.brandTitle }}</h1>'
);
s = s.replace(
  /<p class="brand-tagline[^>]*>[\s\S]*?<\/p>/,
  '<p class="brand-tagline anim-in" style="--d: 0.2s">{{ UI_TEXT.loginTagline }}</p>'
);
s = s.replace(
  /<p class="brand-footer[^>]*>[\s\S]*?<\/p>/,
  '<p class="brand-footer anim-in" style="--d: 0.58s">{{ UI_TEXT.loginFooter }}</p>'
);
s = s.replace(
  /<p class="mobile-title">[\s\S]*?<\/p>/,
  '<p class="mobile-title">{{ UI_TEXT.brandTitle }}</p>'
);
s = s.replace("<h2>\u8d26\u53f7\u767b\u5f55</h2>", "<h2>{{ UI_TEXT.loginTitle }}</h2>");
s = s.replace(
  /<p class="panel-desc">[\s\S]*?<\/p>/,
  '<p class="panel-desc">{{ UI_TEXT.loginRoles }}</p>'
);
s = s.replace(
  /<span>\{\{ loading \? "[^"]+" : "[^"]+" \}\}<\/span>/,
  "<span>{{ loading ? UI_TEXT.loginVerifying : UI_TEXT.loginSubmit }}</span>"
);
s = s.replace(
  /<span class="btn-arrow"[^>]*>[\s\S]*?<\/span>/,
  '<span class="btn-arrow" aria-hidden="true">&gt;</span>'
);
s = s.replace(
  /\u00a9 \{\{ year \}\} [\s\S]*?<\/footer>/,
  "\u00a9 {{ year }} {{ UI_TEXT.copyrightSuffix }}</footer>"
);

s = s.replace(
  `const features = [
  { icon: House, title: "\u5165\u4f4f\u4e0e\u5e8a\u4f4d", desc: "\u767b\u8bb0\u3001\u8c03\u914d\u3001\u9000\u4f4f\u5f52\u6863" },
  { icon: FirstAidKit, title: "\u62a4\u7406\u670d\u52a1", desc: "\u7b49\u7ea7\u3001\u9879\u76ee\u4e0e\u6267\u884c\u8bb0\u5f55" },
  { icon: DataLine, title: "\u5065\u5eb7\u76d1\u6d4b", desc: "\u5916\u51fa\u5ba1\u6279\u4e0e\u8eab\u4f53\u72b6\u6001" },
];`,
  `const features = [
  { icon: House, title: UI_TEXT.feature1Title, desc: UI_TEXT.feature1Desc },
  { icon: FirstAidKit, title: UI_TEXT.feature2Title, desc: UI_TEXT.feature2Desc },
  { icon: DataLine, title: UI_TEXT.feature3Title, desc: UI_TEXT.feature3Desc },
];`
);

// Fallback if features still has corrupted or literal Chinese
s = s.replace(
  /const features = \[[\s\S]*?\];/,
  `const features = [
  { icon: House, title: UI_TEXT.feature1Title, desc: UI_TEXT.feature1Desc },
  { icon: FirstAidKit, title: UI_TEXT.feature2Title, desc: UI_TEXT.feature2Desc },
  { icon: DataLine, title: UI_TEXT.feature3Title, desc: UI_TEXT.feature3Desc },
];`
);

fs.writeFileSync(path, s, "utf8");
console.log("LoginView.vue patched");
