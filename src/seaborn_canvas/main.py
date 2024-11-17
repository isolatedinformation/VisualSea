from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import io
import base64
import json
import os
from pathlib import Path

app = FastAPI()

# Get the absolute path to the project root directory
BASE_DIR = Path(__file__).resolve().parent

# Mount static files
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
app.mount("/js", StaticFiles(directory=str(BASE_DIR / "static/js")), name="js")

# Setup templates
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

def read_data_file(file_content: bytes, file_name: str) -> pd.DataFrame:
    """
    Read data from uploaded file based on its extension.
    Supports CSV and Excel files.
    """
    file_extension = Path(file_name).suffix.lower()
    
    try:
        if file_extension == '.csv':
            return pd.read_csv(io.StringIO(file_content.decode('utf-8')))
        elif file_extension in ['.xlsx', '.xls']:
            return pd.read_excel(io.BytesIO(file_content))
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
    except Exception as e:
        raise ValueError(f"Error reading file: {str(e)}")

@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Read the file content
        contents = await file.read()
        
        # Parse the file based on its format
        df = read_data_file(contents, file.filename)
        
        # Return the column names
        return {"columns": df.columns.tolist()}
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"detail": str(e)}
        )

@app.post("/visualize")
async def visualize(
    data: UploadFile = File(...),
    plot_type: str = Form(...),
    plot_title: str = Form(...),
    x_column: str = Form(...),
    y_columns: str = Form(...),
    grid_style: str = Form(...),
    color_scheme: str = Form(...),
    use_log_scale: str = Form(...),
    legend_position: str = Form(...),
    line_configs: str = Form(...)
):
    try:
        # Parse JSON strings
        y_columns = json.loads(y_columns)
        line_configs = json.loads(line_configs)
        use_log_scale = json.loads(use_log_scale.lower())

        # Read the file content
        contents = await data.read()
        
        # Parse the file based on its format
        df = read_data_file(contents, data.filename)

        # Set the style
        sns.set_style(grid_style)
        sns.set_palette(color_scheme)

        # Create a new figure with a larger size
        plt.figure(figsize=(12, 8))

        # Create the plot based on type
        if plot_type == "line":
            for y_column, config in zip(y_columns, line_configs):
                plt.plot(
                    df[x_column],
                    df[y_column],
                    label=config['legendLabel'],
                    linestyle=config['lineStyle'],
                    linewidth=float(config['lineWidth']),
                    marker=config['markerStyle'] if config['markerStyle'] != 'none' else None,
                    markersize=float(config['markerSize']) if config['markerStyle'] != 'none' else None
                )
        elif plot_type == "scatter":
            for y_column, config in zip(y_columns, line_configs):
                plt.scatter(
                    df[x_column],
                    df[y_column],
                    label=config['legendLabel'],
                    marker=config['markerStyle'] if config['markerStyle'] != 'none' else 'o',
                    s=float(config['markerSize']) ** 2
                )
        elif plot_type == "bar":
            # For bar plots, we'll use the first y-column and its config
            plt.bar(
                df[x_column],
                df[y_columns[0]],
                label=line_configs[0]['legendLabel']
            )

        # Set the title
        plt.title(plot_title, pad=20, fontsize=14)

        # Set axis labels
        plt.xlabel(x_column)
        plt.ylabel(', '.join(y_columns))

        # Set log scale if requested
        if use_log_scale:
            plt.yscale('log')

        # Add legend if position is not 'none'
        if legend_position.lower() != 'none':
            plt.legend(loc=legend_position)

        # Adjust layout to prevent label cutoff
        plt.tight_layout()

        # Save the plot to a bytes buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=300, bbox_inches='tight')
        plt.close()
        
        # Encode the bytes buffer to base64
        buf.seek(0)
        plot_base64 = base64.b64encode(buf.getvalue()).decode()
        
        return {"plot": plot_base64}
    
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"detail": str(e)}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
