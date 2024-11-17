from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request, Response
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import io
import json
import base64
from typing import List, Optional
from pathlib import Path
from PIL import Image
from io import BytesIO
import traceback
import numpy as np

app = FastAPI()

# Get the absolute path to the project root directory
BASE_DIR = Path(__file__).resolve().parent

# Mount static files and templates
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Store uploaded data in memory
DATA_STORE = {}

class DownloadRequest(BaseModel):
    image_data: str
    format: str
    filename: str

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(content.decode()))
        else:  # Excel files
            df = pd.read_excel(io.BytesIO(content))
        
        # Store the dataframe
        DATA_STORE['current_df'] = df
        
        # Return column names
        return JSONResponse(content={
            "columns": df.columns.tolist(),
            "message": "File uploaded successfully"
        })
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e)}
        )

@app.post("/columns")
async def get_columns(file: UploadFile = File(...)):
    try:
        print(f"Processing file: {file.filename}")
        contents = await file.read()
        
        # Read the file into a pandas DataFrame
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        # Get column names
        columns = df.columns.tolist()
        print(f"Found columns: {columns}")
        
        return {"columns": columns}
        
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/visualize")
async def visualize(
    file: UploadFile = File(...),
    plot_type: str = Form(...),
    plot_title: str = Form(...),
    x_column: str = Form(...),
    y_columns: str = Form(...),
    grid_style: str = Form(...),
    color_scheme: str = Form(...),
    use_log_scale: str = Form(...),
    legend_position: str = Form(...),
    line_configs: str = Form(...),
    figure_width: float = Form(12.0),
    figure_height: float = Form(8.0),
    x_axis_label: str = Form(""),
    y_axis_label: str = Form("")
):
    try:
        print("\n=== Starting Visualization Request ===")
        print(f"Plot Type: {plot_type}")
        print(f"X Column: {x_column}")
        
        # Read the uploaded file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents)) if file.filename.endswith('.csv') else pd.read_excel(io.BytesIO(contents))
        print(f"\nData loaded successfully: {len(df)} rows")
        print(f"Columns: {df.columns.tolist()}")
        print("Data types:")
        print(df.dtypes)
        print("\nData Preview:")
        print(df.head())
        
        # Parse JSON strings
        y_columns = json.loads(y_columns)
        line_configs = json.loads(line_configs)
        use_log_scale = use_log_scale.lower() == "true"
        
        # Clear any existing plots
        plt.clf()
        plt.close('all')
        
        # Set style first
        sns.set_style(grid_style)
        if color_scheme != "default":
            sns.set_palette(color_scheme)
        
        # Create new figure with seaborn style
        plt.figure(figsize=(float(figure_width), float(figure_height)))
        
        if plot_type == "line":
            print("\nGenerating Line Plot...")
            
            # Process each y-column
            for config in line_configs:
                y_col = config['column']
                print(f"\nProcessing column: {y_col}")
                
                try:
                    # Create a copy of the data for this line
                    plot_df = df[[x_column, y_col]].copy()
                    print(f"Original data shape: {plot_df.shape}")
                    
                    # Handle month names or other categorical x-axis
                    month_map = {
                        'january': 1, 'february': 2, 'march': 3, 'april': 4,
                        'may': 5, 'june': 6, 'july': 7, 'august': 8,
                        'september': 9, 'october': 10, 'november': 11, 'december': 12
                    }
                    
                    # Check if x_column contains month names
                    if plot_df[x_column].dtype == 'object' and plot_df[x_column].iloc[0].lower() in month_map:
                        plot_df['x_numeric'] = plot_df[x_column].str.lower().map(month_map)
                        x_column_plot = 'x_numeric'
                    else:
                        # Try normal numeric conversion
                        try:
                            plot_df[x_column] = pd.to_numeric(plot_df[x_column], errors='raise')
                            x_column_plot = x_column
                        except:
                            # If not months and not numeric, create sequential numbers
                            plot_df['x_numeric'] = range(len(plot_df))
                            x_column_plot = 'x_numeric'
                    
                    # Convert y column to numeric
                    plot_df[y_col] = pd.to_numeric(plot_df[y_col], errors='coerce')
                    
                    # Remove any rows with NaN values
                    plot_df = plot_df.dropna()
                    print(f"Clean data shape: {plot_df.shape}")
                    
                    # Sort by x values for proper line connection
                    plot_df = plot_df.sort_values(by=x_column_plot)
                    
                    if len(plot_df) > 0:
                        # Use seaborn's lineplot
                        sns.lineplot(data=plot_df, x=x_column_plot, y=y_col, label=y_col, marker='o')
                        
                        # If we used numeric mapping, set the original values as x-tick labels
                        if x_column_plot == 'x_numeric':
                            plt.xticks(plot_df[x_column_plot], plot_df[x_column], rotation=45)
                        
                        print(f"Line plotted successfully for {y_col}")
                    else:
                        print(f"Warning: No valid data points for {y_col}")
                
                except Exception as e:
                    print(f"Error plotting {y_col}: {str(e)}")
                    continue
            
            # Set labels and title
            plt.xlabel(x_axis_label if x_axis_label else x_column)
            plt.ylabel(y_axis_label if y_axis_label else ', '.join(y_columns))
            plt.title(plot_title)
            
            # Set scale if needed
            if use_log_scale:
                plt.yscale('log')
            
            # Add legend
            if legend_position != "none":
                plt.legend(loc=legend_position)
            
            # Adjust layout to prevent label cutoff
            plt.tight_layout()
        
        elif plot_type == "scatter":
            for y_col in y_columns:
                sns.scatterplot(data=df, x=x_column, y=y_col)
                plt.grid(True, linestyle='--', alpha=0.7)
        elif plot_type == "bar":
            for y_col in y_columns:
                sns.barplot(data=df, x=x_column, y=y_col)
                plt.grid(True, linestyle='--', alpha=0.7)
        elif plot_type == "box":
            for y_col in y_columns:
                sns.boxplot(data=df, x=x_column, y=y_col)
                plt.grid(True, linestyle='--', alpha=0.7)
        
        print("\nSaving plot...")
        
        # Save plot to bytes
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', dpi=100, facecolor='white')
        buf.seek(0)
        
        # Encode the bytes as base64
        encoded = base64.b64encode(buf.getvalue()).decode()
        print("Plot saved and encoded successfully")
        
        return JSONResponse(content={"plot": encoded})
        
    except Exception as e:
        print(f"\nError in visualization endpoint: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        plt.close('all')
        if 'buf' in locals():
            buf.close()

@app.post("/download")
async def download_plot(request: DownloadRequest):
    try:
        # Decode base64 image
        image_data = base64.b64decode(request.image_data)
        
        # Create a BytesIO object from the image data
        image_stream = BytesIO(image_data)
        
        # Read the image with PIL
        image = Image.open(image_stream)
        
        # Convert to RGB if needed (for JPG format)
        if request.format.lower() == 'jpg':
            image = image.convert('RGB')
        
        # Create a new BytesIO for the output
        output = BytesIO()
        
        # Save in the requested format
        image.save(output, format=request.format.upper())
        output.seek(0)
        
        # Create the response with the appropriate filename
        filename = f"{request.filename}.{request.format}"
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"'
        }
        
        # Return the file response
        return Response(
            content=output.getvalue(),
            headers=headers,
            media_type=f"image/{request.format.lower()}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def run_cli():
    """Entry point for the CLI."""
    import argparse
    import uvicorn
    
    parser = argparse.ArgumentParser(description='SeabornCanvas - A web-based data visualization tool')
    parser.add_argument('--host', default='127.0.0.1', help='Host to bind to')
    parser.add_argument('--port', type=int, default=8000, help='Port to bind to')
    parser.add_argument('--reload', action='store_true', help='Enable auto-reload')
    
    args = parser.parse_args()
    
    uvicorn.run("seaborn_canvas.main:app", 
                host=args.host, 
                port=args.port, 
                reload=args.reload)

if __name__ == "__main__":
    run_cli()
