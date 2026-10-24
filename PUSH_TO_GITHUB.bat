@echo off
title Push SafeCity AI to GitHub
echo ========================================================
echo   Uploading SafeCity AI to your GitHub Repository
echo   Target: https://github.com/sanjaykumarpathak640-png/safecity-ai
echo ========================================================
echo.
"C:\Users\sanja\AppData\Local\Programs\MinGit\cmd\git.exe" push -u origin main
echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo   SUCCESS! SafeCity AI successfully pushed to GitHub!
    echo   View at: https://github.com/sanjaykumarpathak640-png/safecity-ai
    echo ========================================================
) else (
    echo.
    echo If repository does not exist yet, create it first at:
    echo https://github.com/new (Name: safecity-ai)
    echo Then run this file again!
)
echo.
pause
