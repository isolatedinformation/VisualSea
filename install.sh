#!/bin/bash

echo "Installing SeabornCanvas..."

# Check if Python is installed (try both python3 and python)
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
elif command -v python &> /dev/null; then
    # Check if it's Python 3.x
    PYTHON_VERSION=$(python -c 'import sys; print(sys.version_info[0])')
    if [ "$PYTHON_VERSION" -eq 3 ]; then
        PYTHON_CMD="python"
        PIP_CMD="pip"
    else
        echo "Python 3 is required but Python 2 is installed. Please install Python 3 and try again."
        exit 1
    fi
else
    echo "Python 3 is not installed. Please install Python 3 and try again."
    exit 1
fi

echo "Using Python command: $PYTHON_CMD"

# Check if pip is installed
if ! command -v $PIP_CMD &> /dev/null; then
    echo "pip is not installed. Please install pip and try again."
    exit 1
fi

# Create virtual environment
echo "Creating virtual environment..."
$PYTHON_CMD -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
$PIP_CMD install --upgrade pip

# Install package in development mode
echo "Installing seaborn-canvas package..."
$PIP_CMD install -e .

# Create run script
echo "Creating run script..."
cat > run.sh << 'EOL'
#!/bin/bash
source venv/bin/activate
seaborn-canvas "$@"
EOL

chmod +x run.sh

echo "Installation complete!"
echo "The 'seaborn-canvas' command is now available in the virtual environment"
echo "To start the application:"
echo "1. With the run script: ./run.sh"
echo "2. Directly (after activating venv): seaborn-canvas"
echo "3. With options: seaborn-canvas --host 0.0.0.0 --port 8080 --reload"
