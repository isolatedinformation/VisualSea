from fastapi import FastAPI, File, UploadFile, Form, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import io
from pathlib import Path
import base64
import json

app = FastAPI()

# Get the absolute path to the project root directory
BASE_DIR = Path(__file__).resolve().parent

# Mount static files and templates
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Store uploaded data in memory
DATA_STORE = {}

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
    line_configs: str = Form(...)
):
    try:
        # Parse JSON strings
        y_columns = json.loads(y_columns)
        line_configs = json.loads(line_configs)
        use_log_scale = json.loads(use_log_scale.lower())

        # Read the file
        content = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(content.decode()))
        else:  # Excel files
            df = pd.read_excel(io.BytesIO(content))

        # Set style
        sns.set_style(grid_style)
        sns.set_palette(color_scheme)

        # Create plot
        plt.figure(figsize=(12, 8))

        # Create the plot based on type
        if plot_type == "line":
            for y_column, config in zip(y_columns, line_configs):
                plt.plot(
                    df[x_column],
                    df[y_column],
                    label=config['legendLabel'] or y_column,
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
                    label=config['legendLabel'] or y_column,
                    marker=config['markerStyle'] if config['markerStyle'] != 'none' else 'o',
                    s=float(config['markerSize']) ** 2
                )
        elif plot_type == "bar":
            plt.bar(
                df[x_column],
                df[y_columns[0]],
                label=line_configs[0]['legendLabel'] or y_columns[0]
            )

        # Set title and labels
        plt.title(plot_title, pad=20, fontsize=14)
        plt.xlabel(x_column)
        plt.ylabel(', '.join(y_columns))

        # Set log scale if requested
        if use_log_scale:
            plt.yscale('log')

        # Add legend if position is not 'none'
        if legend_position.lower() != 'none':
            plt.legend(loc=legend_position)

        # Adjust layout
        plt.tight_layout()

        # Save plot to bytes
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=300, bbox_inches='tight')
        plt.close()
        
        # Encode to base64
        buf.seek(0)
        plot_base64 = base64.b64encode(buf.getvalue()).decode()
        
        return JSONResponse(content={"plot": plot_base64})
    
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e)}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
