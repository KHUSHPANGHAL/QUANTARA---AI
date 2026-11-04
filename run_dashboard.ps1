Set-Location -Path $PSScriptRoot
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "Starting Quantara AI Institutional Web Dashboard..." -ForegroundColor Green
Write-Host "Local URL: http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to terminate the server." -ForegroundColor Gray
Write-Host "=====================================================================" -ForegroundColor Cyan

try {
    python web_app/server.py
} catch {
    Write-Host "[ERROR] Failed to start server. Installing requirements..." -ForegroundColor Red
    pip install -r requirements.txt
    python web_app/server.py
}
