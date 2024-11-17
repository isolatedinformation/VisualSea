from fastapi import FastAPI, File, UploadFile, Form, Request, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import io
import base64
import json
from pathlib import Path
from typing import List
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Seaborn No-Code Visualizer")

# Create directories for static files and templates
Path("static").mkdir(exist_ok=True)
Path("templates").mkdir(exist_ok=True)

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Setup templates
templates = Jinja2Templates(directory="templates")

# Color schemes
COLOR_PALETTES = ["deep", "muted", "pastel", "bright", "dark", "colorblind"]

# Style options
STYLE_OPTIONS = ["darkgrid", "whitegrid", "dark", "white", "ticks"]

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        columns = df.columns.tolist()
        return {"columns": columns, "message": "File uploaded successfully"}
    except Exception as e:
        logger.error(f"Error in upload_file: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/visualize")
async def create_visualization(
    plot_type: str = Form(...),
    x_column: str = Form(...),
    y_columns: str = Form(...),
    grid_style: str = Form(...),
    color_scheme: str = Form(...),
    use_log_scale: str = Form(...),  # Changed to str to match frontend
    legend_position: str = Form(...),
    data: UploadFile = File(...)
):
    try:
        logger.info(f"Received request - plot_type: {plot_type}, x_column: {x_column}, "
                   f"y_columns: {y_columns}, grid_style: {grid_style}, "
                   f"color_scheme: {color_scheme}, use_log_scale: {use_log_scale}, "
                   f"legend_position: {legend_position}")

        # Read the data
        content = await data.read()
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        
        # Parse y_columns from JSON string
        y_columns_list = json.loads(y_columns)
        logger.info(f"Parsed y_columns: {y_columns_list}")
        
        # Set the style
        if grid_style in STYLE_OPTIONS:
            sns.set_style(grid_style)
        else:
            sns.set_style("white")
        
        plt.figure(figsize=(12, 6))
        
        # Set color palette
        if color_scheme in COLOR_PALETTES:
            sns.set_palette(color_scheme)
        
        # Create the plot based on type
        if plot_type == "line":
            for y_col in y_columns_list:
                sns.lineplot(data=df, x=x_column, y=y_col, label=y_col)
        elif plot_type == "scatter":
            for y_col in y_columns_list:
                sns.scatterplot(data=df, x=x_column, y=y_col, label=y_col)
        elif plot_type == "bar":
            for y_col in y_columns_list:
                sns.barplot(data=df, x=x_column, y=y_col, label=y_col)
        
        # Customize the plot
        if use_log_scale.lower() == 'true':
            plt.yscale('log')
        
        # Set legend position
        if legend_position != "none":
            plt.legend(bbox_to_anchor=(1.05, 1), loc=legend_position)
        else:
            plt.legend([])
        
        # Adjust layout to prevent label cutoff
        plt.tight_layout()
        
        # Save plot to bytes
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        plt.close()
        buf.seek(0)
        
        # Convert to base64 for embedding in HTML
        img_str = base64.b64encode(buf.getvalue()).decode()
        return {"plot": img_str}
    
    except Exception as e:
        logger.error(f"Error in create_visualization: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
