@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\iniciar.ps1" %*
set "result=%errorlevel%"
if not "%result%"=="0" echo Falha na inicializacao. Consulte docs\INSTALACAO.md.
echo.
pause
exit /b %result%
