@echo off
setlocal

rem echo Starting MongoDB server...
rem set MONGO_BIN_DIR=C:\mongodb\bin
rem set MONGO_DATA_DIR=C:\mongodb\data
rem "%MONGO_BIN_DIR%\mongod.exe" -dbpath "%MONGO_DATA_DIR%"

echo Starting MongoDB service...
net start MongoDB

if errorlevel 1 (
	echo Unable to start MongoDB
	endlocal
	exit /b %errorlevel%
)
endlocal
@echo on

