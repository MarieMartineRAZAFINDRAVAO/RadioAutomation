@echo off
cd /d D:\RadioAutomation\RadioAutomation\backend
call venv\Scripts\activate.bat
chcp 65001 > nul
python -X utf8 manage.py envoyer_programmations_jour >> logs_pad.txt 2>&1