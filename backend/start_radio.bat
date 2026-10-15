@echo off
title Radio Tsiry — Automatisation
cd /d D:\RadioAutomation\RadioAutomation\backend
call venv\Scripts\activate.bat
venv\Scripts\python.exe manage.py runserver
pause