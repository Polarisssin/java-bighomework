# 初始化 Git 并创建分阶段提交 + 版本标签（便于 GitHub 展示迭代）
# 用法: powershell -ExecutionPolicy Bypass -File scripts/init-git-history.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (Test-Path .git) {
  Write-Host "已存在 .git，跳过 init。若需重来请先删除 .git 目录。" -ForegroundColor Yellow
} else {
  git init
  git branch -M main
}

function Commit-IfChanges($paths, $message) {
  git add $paths 2>$null
  git add -A -- .gitignore README.md CHANGELOG.md cloudbaserc.example.json 2>$null
  $st = git status --porcelain
  if (-not $st) {
    Write-Host "  (无变更) $message"
    return
  }
  git commit -m $message
  Write-Host "  OK $message" -ForegroundColor Green
}

Commit-IfChanges @(
  ".gitignore", "README.md", "CHANGELOG.md", "cloudbaserc.example.json",
  "docs", "sql"
) "chore(v1.0.0): 项目说明、CHANGELOG、数据库脚本"

Commit-IfChanges @("backend") "feat(v1.0.0): Spring Boot 后端（客户/床位/护理/审批）"

Commit-IfChanges @("cloudfunctions") "feat(v1.1.0): 云函数 elderCareApi 与腾讯云部署"

Commit-IfChanges @("frontend") "feat(v1.2.0-v1.5.0): Vue3 前端（含编码修复、权限、规格补齐、护理整理）"

Commit-IfChanges @("scripts") "chore: 构建与部署脚本"

# 版本标签（打在最新提交上，Release 说明见 CHANGELOG）
$tags = @{
  "v1.0.0" = "基线：核心业务 + Spring Boot + SQL"
  "v1.1.0" = "CloudBase 静态托管与云函数部署"
  "v1.2.0" = "修复生产环境中文乱码与构建编码"
  "v1.3.0" = "权限守卫、工作台、用户管理增强"
  "v1.4.0" = "对照需求规格说明书功能补齐"
  "v1.5.0" = "护理模块职责划分与交互优化"
}
foreach ($kv in $tags.GetEnumerator()) {
  git tag -a $kv.Key -m $kv.Value -f 2>$null
  Write-Host "  tag $($kv.Key)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "完成。下一步:" -ForegroundColor Green
Write-Host "  git remote add origin https://github.com/<用户>/<仓库>.git"
Write-Host "  git push -u origin main"
Write-Host "  git push origin --tags"
Write-Host "详见 docs/GITHUB上传指南.md"
