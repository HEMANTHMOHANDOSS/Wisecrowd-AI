#!/bin/bash

echo "=================================="
echo "WiseCrowd AI Backend Startup"
echo "=================================="
echo ""

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install -q -r requirements.txt

echo "Initializing database..."
python -c "from database import init_database; init_database()"

echo ""
echo "=================================="
echo "Starting FastAPI server..."
echo "API: http://localhost:8000"
echo "Docs: http://localhost:8000/docs"
echo "=================================="
echo ""

python main_api.py
