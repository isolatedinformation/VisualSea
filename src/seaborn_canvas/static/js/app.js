// Initialize Select2 when the document is ready
$(document).ready(function() {
    initializeSelect2();
    setupEventListeners();
});

function initializeSelect2() {
    $('#yColumns').select2({
        placeholder: 'Select Y-axis column(s)',
        multiple: true,
        width: '100%'
    });
}

function setupEventListeners() {
    // File upload handling
    document.getElementById('file').addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Show loading state
        const visualizationOptions = document.getElementById('visualizationOptions');
        if (visualizationOptions) {
            visualizationOptions.style.opacity = '0.5';
            visualizationOptions.style.pointerEvents = 'none';
        }

        try {
            console.log('Processing file:', file.name);
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/columns', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'Failed to process file');
            }

            console.log('Received columns:', data.columns);
            
            // Update column selectors
            updateColumnSelectors(data.columns);
            
            // Show visualization options
            if (visualizationOptions) {
                visualizationOptions.classList.remove('hidden');
                visualizationOptions.style.opacity = '1';
                visualizationOptions.style.pointerEvents = 'auto';
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Error processing file: ' + error.message);
            
            // Reset file input
            e.target.value = '';
            
            // Hide visualization options
            if (visualizationOptions) {
                visualizationOptions.classList.add('hidden');
            }
        }
    });

    // Plot type change handler
    document.getElementById('plotType').addEventListener('change', function() {
        const lineStylesContainer = document.getElementById('lineStylesContainer');
        if (this.value === 'line') {
            lineStylesContainer.classList.remove('hidden');
            updateLineStyleOptions();
        } else {
            lineStylesContainer.classList.add('hidden');
        }
    });

    // Y columns change handler
    $('#yColumns').on('change', function() {
        if (document.getElementById('plotType').value === 'line') {
            updateLineStyleOptions();
        }
    });

    document.getElementById('visualizationForm').addEventListener('submit', handleVisualizationSubmit);
}

function updateColumnSelectors(columns) {
    if (!columns || !Array.isArray(columns)) {
        console.error('Invalid columns data:', columns);
        return;
    }

    console.log('Updating column selectors with:', columns);

    // Update X-axis column selector
    const xColumnSelect = document.getElementById('xColumn');
    if (xColumnSelect) {
        xColumnSelect.innerHTML = columns
            .map(col => `<option value="${col}">${col}</option>`)
            .join('');
    }

    // Update Y-axis column selector
    const yColumnsSelect = document.getElementById('yColumns');
    if (yColumnsSelect) {
        // Destroy existing Select2 instance if it exists
        if ($(yColumnsSelect).data('select2')) {
            $(yColumnsSelect).select2('destroy');
        }
        
        // Clear and update options
        yColumnsSelect.innerHTML = columns
            .map(col => `<option value="${col}">${col}</option>`)
            .join('');
        
        // Reinitialize Select2
        initializeSelect2();
    }
}

function updateLineStyleOptions() {
    const selectedColumns = Array.from($('#yColumns').select2('data')).map(item => item.id);
    const container = document.getElementById('lineStylesContainer');
    
    if (!container) return;
    
    container.innerHTML = selectedColumns.map((column, index) => `
        <div class="line-style-config border rounded-lg p-4 mb-4">
            <h3 class="font-medium text-lg mb-3">Line ${index + 1} Settings</h3>
            
            <!-- Legend Label -->
            <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 mb-1">Legend Label</label>
                <input type="text" class="legend-label mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                       value="${column}" data-column="${column}">
            </div>
            
            <!-- Line Style -->
            <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 mb-1">Line Style</label>
                <select class="line-style mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="-">Solid</option>
                    <option value="--">Dashed</option>
                    <option value=":">Dotted</option>
                    <option value="-.">Dash-dot</option>
                </select>
            </div>
            
            <!-- Line Width -->
            <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 mb-1">Line Width</label>
                <input type="number" class="line-width mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                       value="2" min="0.5" max="5" step="0.5">
            </div>
            
            <!-- Marker Style -->
            <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 mb-1">Marker Style</label>
                <select class="marker-style mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="o">Circle</option>
                    <option value="s">Square</option>
                    <option value="^">Triangle</option>
                    <option value="*">Star</option>
                    <option value="+">Plus</option>
                    <option value="x">X</option>
                    <option value="none">None</option>
                </select>
            </div>

            <!-- Marker Size -->
            <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 mb-1">Marker Size</label>
                <input type="number" class="marker-size mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                       value="6" min="0" max="20" step="1">
            </div>
        </div>
    `).join('');
}

async function handleVisualizationSubmit(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('file');
    if (!fileInput.files[0]) {
        alert('Please select a file first');
        return;
    }

    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = 'Generating...';
    submitButton.disabled = true;

    try {
        const formData = new FormData();
        
        // Basic form values
        const formValues = {
            plotType: document.getElementById('plotType').value,
            plotTitle: document.getElementById('plotTitle').value,
            xColumn: document.getElementById('xColumn').value,
            yColumns: Array.from($('#yColumns').select2('data')).map(item => item.id),
            gridStyle: document.getElementById('gridStyle').value,
            colorScheme: document.getElementById('colorScheme').value,
            useLogScale: document.getElementById('useLogScale').value,
            legendPosition: document.getElementById('legendPosition').value,
            figureWidth: document.getElementById('figureWidth')?.value || "12.0",
            figureHeight: document.getElementById('figureHeight')?.value || "8.0",
            xAxisLabel: document.getElementById('xAxisLabel').value,
            yAxisLabel: document.getElementById('yAxisLabel').value
        };

        // Get line style configurations
        const lineConfigs = Array.from(document.querySelectorAll('.line-style-config')).map(config => {
            const column = config.querySelector('.legend-label').dataset.column;
            return {
                column: column,
                legendLabel: config.querySelector('.legend-label').value,
                lineStyle: config.querySelector('.line-style').value,
                lineWidth: config.querySelector('.line-width').value,
                markerStyle: config.querySelector('.marker-style').value,
                markerSize: config.querySelector('.marker-size').value
            };
        });

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
        formData.append('figure_width', formValues.figureWidth);
        formData.append('figure_height', formValues.figureHeight);
        formData.append('x_axis_label', formValues.xAxisLabel);
        formData.append('y_axis_label', formValues.yAxisLabel);

        // Send request
        const response = await fetch('/visualize', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Failed to generate visualization');
        }

        // Display the plot
        displayPlot(data.plot);

        // Scroll to plot
        document.getElementById('plotContainer').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error:', error);
        alert('Error generating visualization: ' + error.message);
    } finally {
        // Reset button state
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
}

function displayPlot(base64Image) {
    const plotContainer = document.getElementById('plotContainer');
    const plotImage = document.getElementById('plot');
    
    // Update image
    plotImage.src = `data:image/png;base64,${base64Image}`;
    
    // Show container
    plotContainer.classList.remove('hidden');
}

function clearPlot() {
    const plotContainer = document.getElementById('plotContainer');
    const plotImage = document.getElementById('plot');
    
    // Clear image
    plotImage.src = '';
    
    // Hide container
    plotContainer.classList.add('hidden');
}

function downloadPlot(format) {
    const plotImage = document.getElementById('plot');
    const filename = document.getElementById('downloadFilename').value || 'plot';
    
    if (!plotImage.src) {
        alert('No plot to download');
        return;
    }
    
    // Get base64 data
    const base64Data = plotImage.src.split(',')[1];
    
    // Create download request
    const downloadRequest = {
        image_data: base64Data,
        format: format,
        filename: filename
    };
    
    // Send download request
    fetch('/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(downloadRequest)
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${filename}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error downloading plot: ' + error.message);
    });
}
