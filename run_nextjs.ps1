$env:PATH = "C:\Quantara\nodejs;" + $env:PATH
Set-Location -Path "$PSScriptRoot\frontend"
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "Starting Quantara Next.js 14 Institutional Terminal..." -ForegroundColor Green
Write-Host "Local URL: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to terminate." -ForegroundColor Gray
Write-Host "=====================================================================" -ForegroundColor Cyan
& "C:\Quantara\nodejs\npm.cmd" run dev

