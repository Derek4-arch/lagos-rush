@echo off
title Gidi Rush
cd /d "%~dp0"
set "NODE=C:\Program Files\nodejs\node.exe"
if exist "%NODE%" (
  "%NODE%" server.js 8080 --open
  goto :eof
)
where node >nul 2>nul
if %errorlevel%==0 (
  node server.js 8080 --open
  goto :eof
)
echo Node.js not found - opening index.html directly in your browser.
start "" "%~dp0index.html"
