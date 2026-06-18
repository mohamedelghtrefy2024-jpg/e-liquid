@echo off
chcp 65001 >nul
title EPP Calculator - تشغيل محلي
cd /d "%~dp0"

echo ================================================
echo   EPP Calculator - تشغيل السيرفر المحلي
echo ================================================
echo.

set PORT=8000

REM تحقق هل البورت مستخدم بالفعل (سيرفر شغال من قبل)
netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo [تنبيه] فيه سيرفر شغال على البورت %PORT% بالفعل.
    echo سيتم فتح المتصفح مباشرة...
    timeout /t 1 >nul
    start "" "http://localhost:%PORT%/EPP-Calculator-merged.html"
    goto end
)

REM جرّب Python الأول (الأكثر شيوعاً)
where python >nul 2>nul
if %errorlevel%==0 (
    echo [✓] تم العثور على Python - جاري تشغيل السيرفر...
    start "EPP Server" /min cmd /c "python -m http.server %PORT%"
    goto waitandopen
)

where python3 >nul 2>nul
if %errorlevel%==0 (
    echo [✓] تم العثور على Python3 - جاري تشغيل السيرفر...
    start "EPP Server" /min cmd /c "python3 -m http.server %PORT%"
    goto waitandopen
)

REM جرّب Node.js كبديل
where npx >nul 2>nul
if %errorlevel%==0 (
    echo [✓] تم العثور على Node.js - جاري تشغيل السيرفر...
    start "EPP Server" /min cmd /c "npx --yes serve -l %PORT% ."
    goto waitandopen
)

REM لو مفيش حاجة متوفرة
echo.
echo [خطأ] لم يتم العثور على Python أو Node.js على الجهاز.
echo يرجى تثبيت أحدهما لتشغيل البرنامج:
echo   - Python: https://www.python.org/downloads/
echo   - Node.js: https://nodejs.org/
echo.
pause
exit /b 1

:waitandopen
echo جاري الانتظار حتى يبدأ السيرفر...
timeout /t 2 >nul
echo [✓] فتح البرنامج في المتصفح...
start "" "http://localhost:%PORT%/EPP-Calculator-merged.html"
echo.
echo ================================================
echo   البرنامج شغال الآن على:
echo   http://localhost:%PORT%/EPP-Calculator-merged.html
echo.
echo   لإغلاق السيرفر: أغلق نافذة "EPP Server"
echo   أو أغلق هذه النافذة
echo ================================================

:end
echo.
pause
