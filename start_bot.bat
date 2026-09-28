@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ====== SETTINGS ======
set "BOT_DIR=%~dp0"
set "BOT_SCRIPT=bot.py"
set "PYTHON_CMD=python"
set "LOG_FILE=%BOT_DIR%bot_log.txt"
set "RETRY_DELAY=5"

cd /d "%BOT_DIR%"

echo ========================================
echo    Telegram Bot Auto-Restart Manager
echo ========================================
echo Folder: %BOT_DIR%
echo Script: %BOT_SCRIPT%
echo Log: %LOG_FILE%
echo ========================================
echo.

%PYTHON_CMD% --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found!
    pause
    exit /b 1
)

if not exist "%BOT_SCRIPT%" (
    echo [ERROR] File %BOT_SCRIPT% not found!
    pause
    exit /b 1
)

set "RETRY_COUNT=0"
set "FAST_FAIL_COUNT=0"

:start_bot
set /a RETRY_COUNT+=1
set "START_TIME=%time%"
echo.
echo [%date% %time%] Attempt #%RETRY_COUNT%: Starting bot...
echo [%date% %time%] Starting bot (attempt #%RETRY_COUNT%) >> "%LOG_FILE%"

%PYTHON_CMD% "%BOT_SCRIPT%"

set "EXIT_CODE=%errorlevel%"
set "END_TIME=%time%"
echo [%date% %time%] Bot stopped with code: %EXIT_CODE%
echo [%date% %time%] Bot stopped with code: %EXIT_CODE% >> "%LOG_FILE%"

for /f "tokens=1-3 delims=:." %%a in ("%START_TIME%") do set /a "START_SEC=(%%a*3600)+(%%b*60)+%%c"
for /f "tokens=1-3 delims=:." %%a in ("%END_TIME%") do set /a "END_SEC=(%%a*3600)+(%%b*60)+%%c"
set /a "UPTIME_SECONDS=END_SEC-START_SEC"
if %UPTIME_SECONDS% lss 0 set /a "UPTIME_SECONDS+=86400"

if %UPTIME_SECONDS% lss 10 (
    set /a FAST_FAIL_COUNT+=1
    echo [WARNING] Fast crash! Uptime: %UPTIME_SECONDS% sec, fast fails: %FAST_FAIL_COUNT%
    echo [WARNING] Fast crash #%FAST_FAIL_COUNT% >> "%LOG_FILE%"

    if !FAST_FAIL_COUNT! geq 3 (
        echo [ERROR] Too many fast crashes!
        echo Checking for errors. Pause 60 seconds...
        timeout /t 60 /nobreak >nul
        set "FAST_FAIL_COUNT=0"
    ) else (
        timeout /t %RETRY_DELAY% /nobreak >nul
    )
) else (
    set "FAST_FAIL_COUNT=0"
    echo [INFO] Bot was running %UPTIME_SECONDS% seconds. Restarting in %RETRY_DELAY% seconds...
    timeout /t %RETRY_DELAY% /nobreak >nul
)

goto start_bot

endlocal
