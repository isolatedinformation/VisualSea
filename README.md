# No-Code Seaborn Visualization App

A user-friendly web application that allows non-programmers to create complex data visualizations using Seaborn without writing any code.

## Features

- **Multiple Plot Types**: Line plots, scatter plots, and bar plots
- **Advanced Customization**: Grid styles, color schemes, and legend positioning
- **Interactive Interface**: Easy-to-use web interface with drag-and-drop file upload
- **Multi-Column Support**: Visualize multiple data columns simultaneously
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Python 3.11 or higher
- pip (Python package installer)
- Web browser (Chrome, Firefox, or Safari recommended)

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd windsurf-project
   ```

2. **Create a virtual environment**

    - Use either `python3 -m venv .venv` or `uv venv`. 
    - Activate the environment with `source .venv/bin/activate` or 
      `.\venv\Scripts\activate` to activate the virtual environment.




3. **Install dependencies**
Use `[uv] pip install -r requirements.txt` to install the required dependencies. Use       
`uv` if you have uv installed.

## Running the Application

1. **Start the server**
   ```bash
   python -m uvicorn main:app --reload
   ```

2. **Access the application**
   - Open your web browser
   - Navigate to `http://localhost:8000`
   - The application interface should load automatically

## Using the Application

1. **Upload Data**
   - Click "Select a CSV file" or drag and drop your CSV file
   - The application will automatically detect columns

2. **Configure Visualization**
   - Select plot type (line, scatter, or bar)
   - Choose X-axis column
   - Select one or more Y-axis columns
   - Customize appearance:
     - Grid style (darkgrid, whitegrid, dark, white, ticks)
     - Color scheme (deep, muted, pastel, bright, dark, colorblind)
     - Scale type (linear or logarithmic)
     - Legend position

3. **Generate Visualization**
   - Click "Generate Visualization"
   - Your plot will appear below the form

## Sample Data

The repository includes `sample_data.csv` with example data containing:
- Month
- Sales
- Temperature
- Customer_Satisfaction
- Marketing_Spend

Try these combinations with the sample data:
1. **Sales Trend**:
   - Line plot
   - X: Month
   - Y: Sales
   - Grid: darkgrid
   - Color: deep

2. **Multi-metric Analysis**:
   - Line plot
   - X: Month
   - Y: Sales, Temperature, Marketing_Spend
   - Grid: whitegrid
   - Color: pastel

## Customization Options

### Grid Styles
- darkgrid
- whitegrid
- dark
- white
- ticks

### Color Palettes
- deep
- muted
- pastel
- bright
- dark
- colorblind

### Legend Positions
- best
- upper right
- upper left
- lower right
- lower left
- none

## Troubleshooting

1. **Port already in use**
   ```bash
   # Find the process using port 8000
   lsof -i :8000
   
   # Kill the process
   kill -9 <PID>
   ```

2. **Missing dependencies**
   ```bash
   # Reinstall dependencies
   pip install -r requirements.txt
   ```

3. **File upload issues**
   - Ensure your CSV file is properly formatted
   - Check file size (keep it under 10MB for best performance)
   - Verify file encoding is UTF-8

## Development

- Built with FastAPI for the backend
- Uses Seaborn and Matplotlib for visualization
- Frontend styled with Tailwind CSS
- Interactive elements with jQuery and Select2

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Seaborn for the visualization library
- FastAPI for the web framework
- Tailwind CSS for styling
- Select2 for enhanced dropdowns