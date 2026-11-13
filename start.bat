@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel%==0 (
  echo Starting OPC OS demo at http://127.0.0.1:4173
  node server.mjs
  goto :eof
)

set "DSH_NODE=%USERPROFILE%\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"
if exist "%DSH_NODE%" (
  echo Starting OPC OS demo with the bundled Node runtime...
  "%DSH_NODE%" server.mjs
  goto :eof
)

echo Node.js 18+ was not found. Install Node.js or run: node server.mjs
pause
