@echo off
REM CRM Management System - Windows Run Script
REM This script starts the FastAPI application

cd src
echo Starting CRM Management System...
echo API will be available at: http://{ip_address}:8000
echo API Documentation at: http://{ip_address}:8000/api/docs
echo.
python main.py
pause
