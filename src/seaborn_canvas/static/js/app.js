// Initialize Select2 when the document is ready
$(document).ready(function() {
    initializeSelect2();
    setupEventListeners();
});

function initializeSelect2() {
    $('#yColumns').select2({
        placeholder: 'Select Y-axis columns',
        multiple: true
    }).on('change', function() {
        updateLineStyleConfigs();
    });
}

function setupEventListeners() {
    document.getElementById('file').addEventListener('change', handleFileUpload);
    document.getElementById('visualizationForm').addEventListener('submit', handleVisualizationSubmit);
}

async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload file');
        }

        const data = await response.json();
        if (data.columns) {
            populateColumnDropdowns(data.columns);
            showVisualizationOptions();
        } else {
            throw new Error('No columns data received');
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Error uploading file: ' + error.message);
    }
}

function populateColumnDropdowns(columns) {
    const xColumnSelect = document.getElementById('xColumn');
    const yColumnsSelect = document.getElementById('yColumns');
    
    // Clear existing options
    xColumnSelect.innerHTML = '';
    yColumnsSelect.innerHTML = '';
    
    columns.forEach(column => {
        // Add to X-axis dropdown
        const xOption = document.createElement('option');
        xOption.value = column;
        xOption.textContent = column;
        xColumnSelect.appendChild(xOption);

        // Add to Y-axis multi-select
        const yOption = document.createElement('option');
        yOption.value = column;
        yOption.textContent = column;
        yColumnsSelect.appendChild(yOption); // Fix: changed 'option' to 'yOption'
    });

    // Refresh Select2
    $('#yColumns').trigger('change');
}

function showVisualizationOptions() {
    document.getElementById('visualizationOptions').style.display = 'block';
}

function updateLineStyleConfigs() {
    const lineStylesContainer = document.getElementById('lineStylesContainer');
    const selectedColumns = Array.from($('#yColumns').select2('data'));
    const template = document.getElementById('lineStyleTemplate');
    
    // Clear existing configurations
    lineStylesContainer.innerHTML = '';
    
    // Create configuration section for each selected column
    selectedColumns.forEach((column, index) => {
        const lineConfig = template.content.cloneNode(true);
        
        // Update line number and set initial legend label
        lineConfig.querySelector('.line-number').textContent = index + 1;
        const legendInput = lineConfig.querySelector('.legend-label');
        legendInput.value = column.text;
        legendInput.dataset.column = column.id;
        
        // Add the configuration to the container
        lineStylesContainer.appendChild(lineConfig);
    });
}

async function handleVisualizationSubmit(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('file');
    if (!fileInput.files[0]) {
        alert('Please select a file first');
        return;
    }

    const formData = new FormData();
    
    // Get basic form values
    const formValues = {
        plotType: document.getElementById('plotType').value,
        plotTitle: document.getElementById('plotTitle').value,
        xColumn: document.getElementById('xColumn').value,
        yColumns: Array.from($('#yColumns').select2('data')).map(item => item.id),
        gridStyle: document.getElementById('gridStyle').value,
        colorScheme: document.getElementById('colorScheme').value,
        useLogScale: document.getElementById('useLogScale').value,
        legendPosition: document.getElementById('legendPosition').value
    };

    // Get line style configurations
    const lineConfigs = Array.from(document.querySelectorAll('.line-style-config')).map(config => ({
        column: config.querySelector('.legend-label').dataset.column,
        legendLabel: config.querySelector('.legend-label').value,
        lineStyle: config.querySelector('.line-style').value,
        lineWidth: config.querySelector('.line-width').value,
        markerStyle: config.querySelector('.marker-style').value,
        markerSize: config.querySelector('.marker-size').value
    }));

    // Append all form data
    formData.append('file', fileInput.files[0]);
    formData.append('plot_type', formValues.plotType);
    formData.append('plot_title', formValues.plotTitle);
    formData.append('x_column', formValues.xColumn);
    formData.append('y_columns', JSON.stringify(formValues.yColumns));
    formData.append('grid_style', formValues.gridStyle);
    formData.append('color_scheme', formValues.colorScheme);
    formData.append('use_log_scale', formValues.useLogScale);
    formData.append('legend_position', formValues.legendPosition);
    formData.append('line_configs', JSON.stringify(lineConfigs));

    try {
        const response = await fetch('/visualize', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate visualization');
        }

        const data = await response.json();
        updateVisualization(data.plot);
    } catch (error) {
        console.error('Error:', error);
        alert('Error generating visualization: ' + error.message);
    }
}

function updateVisualization(plotData) {
    const plotContainer = document.getElementById('plotContainer');
    const plotImage = document.getElementById('plot');
    
    plotImage.src = `data:image/png;base64,${plotData}`;
    plotContainer.style.display = 'block';
    
    // Scroll to the plot
    plotContainer.scrollIntoView({ behavior: 'smooth' });
}
