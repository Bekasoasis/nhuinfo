# 南華資訊公開專區 — GitHub 發布腳本（Windows PowerShell）
# 首次使用：先於 GitHub 建立空 repo，將下行網址改成你的 repo
$REPO = "https://github.com/你的帳號/nhuinfo-site.git"

if (-not (Test-Path ".git")) {
    git init
    git branch -M main
    git remote add origin $REPO
}
git add -A
$msg = Read-Host "commit 訊息（直接 Enter 用預設）"
if ([string]::IsNullOrWhiteSpace($msg)) { $msg = "update " + (Get-Date -Format "yyyy-MM-dd HH:mm") }
git commit -m $msg
git push -u origin main
Write-Host "`n完成。GitHub Pages 網址約 1 分鐘後更新。" -ForegroundColor Green
