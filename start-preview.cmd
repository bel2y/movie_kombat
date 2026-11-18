@echo off
cd /d "%~dp0"
powershell -NoProfile -Command "Start-Process -FilePath node -ArgumentList ('\"' + (Join-Path (Get-Location) 'preview.cjs') + '\"') -WindowStyle Hidden"
start "" "http://127.0.0.1:4400/"

