@echo off
setlocal
cd /d "%~dp0"
echo.
echo KalaSutra - Razorpay one-time setup
echo Paste your TEST Key ID and TEST Key Secret below.
echo (These values stay only in this folder's .env file.)
echo.
set /p KEYID=Razorpay Test Key ID: 
set /p SECRET=Razorpay Test Key Secret: 
> .env echo # KalaSutra local Razorpay configuration
>> .env echo RAZORPAY_KEY_ID=%KEYID%
>> .env echo RAZORPAY_KEY_SECRET=%SECRET%
echo.
echo Saved. Now run npm start.
pause
