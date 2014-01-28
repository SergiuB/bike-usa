@echo off
setlocal

set MONGOHQ_URL=mongodb://biker:6423km@troup.mongohq.com:10041/bikeusa

echo Starting MongoDB server...
rem set MONGO_DATA_DIR=C:\mongodb\data
rem "%MONGO_BIN_DIR%\mongod.exe" -dbpath "%MONGO_DATA_DIR%"

net start MongoDB

if errorlevel 1 (
	echo Unable to start MongoDB
	endlocal
	exit /b %errorlevel%
)
endlocal
@echo on

