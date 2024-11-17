# SeabornCanvas

A user-friendly web application that allows non-programmers to create complex data visualizations using Seaborn without writing any code.

## Features

- **Multiple Plot Types**: Line plots, scatter plots, and bar plots
- **Advanced Customization**: 
  - Custom plot titles
  - Line styles (solid, dashed, dotted)
  - Marker styles and sizes
  - Custom legend labels
- **Multiple File Formats**: 
  - CSV files (.csv)
  - Excel files (.xlsx, .xls)
- **Interactive Interface**: Easy-to-use web interface with drag-and-drop file upload
- **Multi-Column Support**: Visualize multiple data columns simultaneously
- **Responsive Design**: Works on desktop and mobile devices

## Quicker Start

## Option 1: Quicker Start
UNIX like systems:
```bash
chmod +x install.sh
./install.sh
./run.sh
```

Windows:
```powershell
install.bat
run.bat
```

## Option 2: Install from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/seaborn-canvas.git
   cd seaborn-canvas
   ```

2. Install the package:
   ```bash
   pip install -e .
   ```




### Run

1. Open a terminal and run:
   ```bash
   seaborn-canvas
   ```

2. Open your web browser and navigate to http://localhost:8000




### Advanced Usage

```bash
seaborn-canvas --host 0.0.0.0 --port 8080 --reload
```

Options:
- `--host`: Host to run the server on (default: 127.0.0.1)
- `--port`: Port to run the server on (default: 8000)
- `--reload`: Enable auto-reload on code changes

## Creating Visualizations

1. **Upload Data**:
   - Click "Choose File" or drag and drop your CSV/Excel file
   - Supported formats: .csv, .xlsx, .xls

2. **Configure Plot**:
   - Select columns for X and Y axes
   - Choose plot type
   - Set plot title
   - Customize line styles:
     - Line type (solid, dashed, dotted)
     - Line width
     - Marker style
     - Marker size
   - Add custom legend labels

3. **Generate & Save**:
   - Click "Generate Plot" to create visualization
   - Download the plot as an image

## Requirements

- Python 3.11 or higher
- Modern web browser (Chrome, Firefox, or Safari recommended)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
