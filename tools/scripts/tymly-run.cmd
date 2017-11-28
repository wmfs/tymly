@echo off
setlocal

set DEV_DIR=%~dp0..\..
cd %DEV_DIR%

set TYMLY_BLUEPRINTS_PATH=%cd%\blueprints\*-blueprint
set TYMLY_PLUGINS_PATH=%cd%\plugins\*-plugin

set TYMLY_CERTIFICATE_PATH=%cd%\tools\certificate\wmfs.pem
set TYMLY_AUTH_AUDIENCE=bUQ3oUgVddfjNAKc3iOq3Lbkx99IQXns

set TYMLY_SERVER_PORT=3210

REM need these for now
set TYMLY_EMAIL_FROM=tymly@xyz.com
set TYMLY_EMAIL_HOST=localhost
set TYMLY_EMAIL_POST=25

if defined PG_CONNECTION_STRING GOTO :start
set PG_CONNECTION_STRING=postgres://postgres:postgres@localhost:5432/my_test_db
echo PG_CONNECTION_STRING not set, using default %PG_CONNECTION_STRING%

:start
cd packages\tymly-runner
node lib\index.js
