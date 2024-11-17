@echo off
echo Installing SeabornCanvas...

REM Check if Python is installed
python3 --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=python3
    set PIP_CMD=pip3
    goto :python_found
)

python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed. Please install Python and try again.
    exit /b 1
)

REM Check if it's Python 3.x
python -c "import sys; assert sys.version_info[0] == 3" >nul 2>&1
if errorlevel 1 (
    echo Python 3 is required but Python 2 is installed. Please install Python 3 and try again.
    exit /b 1
)

set PYTHON_CMD=python
set PIP_CMD=pip

:python_found
echo Using Python command: %PYTHON_CMD%

REM Check if pip is installed
%PIP_CMD% --version >nul 2>&1
if errorlevel 1 (
    echo pip is not installed. Please install pip and try again.
    exit /b 1
)

REM Create virtual environment
echo Creating virtual environment...
%PYTHON_CMD% -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
%PYTHON_CMD% -m pip install --upgrade pip

REM Install package in development mode
echo Installing seaborn-canvas package...
%PIP_CMD% install -e .

REM Create run script
echo Creating run script...
(
echo @echo off
echo call venv\Scripts\activate.bat
echo seaborn-canvas %%*
echo pause
) > run.bat

echo Installation complete!
echo The 'seaborn-canvas' command is now available in the virtual environment
echo To start the application:
echo 1. With the run script: run.bat
echo 2. Directly (after activating venv): seaborn-canvas
echo 3. With options: seaborn-canvas --host 0.0.0.0 --port 8080 --reload
pause
