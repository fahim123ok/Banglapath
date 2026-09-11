@echo off
title BanglaPath App Launcher
cd /d "%~dp0"

echo Starting BanglaPath Server...
start /min node banglapath-home/server.js

timeout /t 2 >nul
echo Opening BanglaPath in browser...
start http://localhost:3000
