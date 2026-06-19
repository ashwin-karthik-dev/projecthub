@echo off
echo ============================================
echo   Resetting MySQL root password to: password
echo ============================================
echo.

echo [1/4] Stopping MySQL96 service...
net stop MySQL96 2>nul
timeout /t 3 /nobreak >nul

echo [2/4] Starting MySQL with password reset...
start /b "" "C:\Program Files\MySQL\MySQL Server 9.6\bin\mysqld.exe" --init-file="d:\ISMO\mysql_reset.sql" --console
echo Waiting for MySQL to process init file...
timeout /t 8 /nobreak >nul

echo [3/4] Shutting down temporary MySQL instance...
"C:\Program Files\MySQL\MySQL Server 9.6\bin\mysqladmin.exe" -u root -ppassword shutdown 2>nul
timeout /t 5 /nobreak >nul

echo [4/4] Starting MySQL96 service normally...
net start MySQL96
timeout /t 3 /nobreak >nul

echo.
echo Testing connection...
"C:\Program Files\MySQL\MySQL Server 9.6\bin\mysql.exe" -u root -ppassword -e "SELECT 'SUCCESS! MySQL root password reset to: password' AS result;"

echo.
echo [5/5] Creating pms database if it doesn't exist...
"C:\Program Files\MySQL\MySQL Server 9.6\bin\mysql.exe" -u root -ppassword -e "CREATE DATABASE IF NOT EXISTS pms;"

echo.
echo ============================================
echo   DONE! You can close this window now.
echo ============================================
pause
