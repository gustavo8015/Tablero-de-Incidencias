@echo off
chcp 65001 >nul
title Tablero de Incidencias de Vehiculos Electricos
cd /d "%~dp0"

echo ============================================================
echo   TABLERO DE INCIDENCIAS DE VEHICULOS ELECTRICOS
echo ============================================================
echo.

REM --- 1. Verificar que Python este instalado ---
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] No se encontro Python en este equipo.
    echo.
    echo Instalalo desde https://www.python.org/downloads/
    echo IMPORTANTE: marca la casilla "Add Python to PATH" durante la instalacion.
    echo.
    pause
    exit /b 1
)
echo [OK] Python detectado:
python --version
echo.

REM --- 2. Instalar Flask si hace falta ---
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo [..] Instalando Flask, espera un momento...
    python -m pip install --quiet --upgrade pip
    python -m pip install --quiet flask
    echo [OK] Flask instalado.
) else (
    echo [OK] Flask ya estaba instalado.
)
echo.

REM --- 3. Abrir el navegador y arrancar el servidor ---
echo [..] Abriendo el navegador en http://127.0.0.1:5000
start "" http://127.0.0.1:5000
echo.
echo ============================================================
echo   El tablero ya esta corriendo.
echo   NO CIERRES ESTA VENTANA mientras lo uses.
echo   Para detenerlo: presiona Ctrl + C o cierra esta ventana.
echo ============================================================
echo.
python app.py

pause
