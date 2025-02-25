from setuptools import setup, find_packages

setup(
    name="seaborn-canvas",
    version="0.1.0",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    install_requires=[
        "matplotlib>=3.7.0",
        "numpy>=1.23.5",
        "pandas>=1.5.3",
        "fastapi==0.104.1",
        "uvicorn==0.24.0",
        "python-multipart==0.0.6",
        "seaborn==0.13.0",
        "jinja2==3.1.2",
        "openpyxl>=3.1.2",
    ],
    entry_points={
        'console_scripts': [
            'seaborn-canvas=seaborn_canvas.main:run_cli',
        ],
    },
)
