# 上传到 GitHub

## 1. 安全说明（必读）

仓库已 **忽略** 含真实密码的 `cloudbaserc.json`。克隆后请：

```bash
copy cloudbaserc.example.json cloudbaserc.json
# 编辑 cloudbaserc.json，填入自己的 envId、VPC、数据库密码
```

勿将 `DB_PASSWORD`、生产 `envId` 提交到公开仓库。

## 2. 本地已执行的 Git 初始化

若你使用本仓库自带的脚本，将得到 **分阶段提交**，便于在 GitHub Commits 页展示迭代：

1. 项目文档与数据库脚本  
2. Spring Boot 后端  
3. 云函数 API  
4. Vue 前端  
5. 构建脚本与工具  

## 3. 在 GitHub 创建仓库并推送

在 [GitHub New Repository](https://github.com/new) 创建空仓库（不要勾选 README，避免冲突），然后：

```bash
cd E:\java实训

# 若尚未初始化，执行：
# git init
# git add .
# git commit -m "你的首次提交说明"

git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
git push origin --tags
```

使用 SSH：

```bash
git remote add origin git@github.com:你的用户名/你的仓库名.git
```

## 4. 发布 Release（展示版本）

在 GitHub 仓库 → **Releases** → **Create a new release**：

- Tag：`v1.5.0`（或从 `v1.0.0` 到 `v1.5.0` 逐个建）
- 标题：`v1.5.0 护理模块职责整理`
- 说明：从 `CHANGELOG.md` 复制对应章节

答辩时可打开：**Insights → Network** 或 **Commits** 时间线 + **Releases** 列表。

## 5. 推荐仓库简介（About）

```
东软颐养中心 — Vue3 + Spring Boot / 云函数 | 实训迭代与 Bug 修复记录见 CHANGELOG
```

Topics 建议：`vue3` `spring-boot` `element-plus` `cloudbase` `elder-care`
