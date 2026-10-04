@echo off
REM Runner diario de Bluesky para el Programador de tareas de Windows.
REM Se auto-ubica en su carpeta y registra la salida en run.log.
cd /d "%~dp0"
node run.mjs >> run.log 2>&1
