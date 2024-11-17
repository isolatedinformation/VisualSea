"""Command line interface for SeabornCanvas."""
import argparse
import uvicorn
from seaborn_canvas.main import app

def main():
    """Run the SeabornCanvas application."""
    parser = argparse.ArgumentParser(description='SeabornCanvas - No-code data visualization tool')
    parser.add_argument('--host', default='127.0.0.1', help='Host to run the server on')
    parser.add_argument('--port', type=int, default=8000, help='Port to run the server on')
    parser.add_argument('--reload', action='store_true', help='Enable auto-reload on code changes')

    args = parser.parse_args()

    print(f"🎨 Starting SeabornCanvas on http://{args.host}:{args.port}")
    print("📊 Create beautiful visualizations without code!")
    
    uvicorn.run(
        "seaborn_canvas.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )

if __name__ == "__main__":
    main()
