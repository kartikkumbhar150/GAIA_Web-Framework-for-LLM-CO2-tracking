#!/bin/bash
# quickstart.sh - Quick setup script for Carbon Optimizer API

set -e

echo "================================================"
echo "Carbon Optimizer API - Quick Start Setup"
echo "================================================"
echo ""

# Check Python version
echo "Checking Python version..."
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
echo "Found Python $PYTHON_VERSION"

# Create virtual environment
echo ""
echo "Creating virtual environment..."
if [ -d "venv" ]; then
    echo "Virtual environment already exists. Skipping."
else
    python3 -m venv venv
    echo "Virtual environment created."
fi

# Activate virtual environment
echo ""
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt

echo "Dependencies installed successfully."

# Setup environment file
echo ""
if [ ! -f ".env" ]; then
    echo "Setting up environment file..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Please edit .env file and add your Electricity Maps API key"
    echo "Get your free API key at: https://api-portal.electricitymaps.com/"
    echo ""
    read -p "Press Enter to continue once you've added your API key..."
else
    echo ".env file already exists."
fi

# Test the setup
echo ""
echo "Testing the setup..."
python -c "import flask; import requests; print('All dependencies loaded successfully!')"

echo ""
echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo ""
echo "To start the API:"
echo "  1. Activate the virtual environment: source venv/bin/activate"
echo "  2. Run the API: python app.py"
echo "     OR for production: gunicorn -w 4 -b 0.0.0.0:5000 app:app"
echo ""
echo "To test the API:"
echo "  python example_client.py"
echo ""
echo "API will be available at: http://localhost:5000"
echo "Health check: http://localhost:5000/health"
echo ""
echo "For full documentation, see README.md"
echo "================================================"
