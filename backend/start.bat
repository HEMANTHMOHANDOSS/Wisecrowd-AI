@echo off
echo ==================================
echo WiseCrowd AI Backend Startup
echo ==================================
echo.

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -q -r requirements.txt

echo Initializing database...
python -c "from database import init_database; init_database()"

echo.
echo ==================================
echo Starting FastAPI server...
echo API: http://localhost:8000
echo Docs: http://localhost:8000/docs
echo ==================================
echo.

python main_api.py
