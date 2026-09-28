@echo off
chcp 65001 >nul
title VOID HUNTER - ЗАПУСК ИГРЫ
color 0B

echo ===================================================
echo           ЗАПУСК VOID HUNTER (1-КЛИК)
echo ===================================================
echo.

:: Переходим в папку с игрой
cd /d "%~dp0void" 2>nul
if not exist "package.json" (
  cd /d "%~dp0"
)

if not exist "package.json" (
  color 0C
  echo [ОШИБКА] Не найдена папка с игрой (package.json)!
  pause
  exit /b
)

echo [1/2] Открытие игры в браузере...
start http://localhost:3000

echo [2/2] Запуск сервера Vite на порту 3000...
echo.
echo ===================================================
echo  Игра запущена: http://localhost:3000
echo  Для выхода просто закройте это черное окно.
echo ===================================================
echo.

call npm run dev
pause
