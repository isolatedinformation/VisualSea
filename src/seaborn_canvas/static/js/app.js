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

    document.getElementById('visualizationForm').addEventListener('submit', handleVisualizationSubmit);
    document.getElementById('downloadPng').addEventListener('click', () => downloadPlot('png'));
    document.getElementById('downloadPdf').addEventListener('click', () => downloadPlot('pdf'));
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
        $(yColumnsSelect).select2({
            placeholder: 'Select Y-axis column(s)',
            multiple: true,
            width: '100%'
        });
    }
}

// Function to update line style options
function updateLineStyleOptions() {
    const selectedColumns = Array.from($('#yColumns').select2('data')).map(item => item.id);
    const container = document.getElementById('lineStylesContainer');
    
    if (!container) return;
    
    container.innerHTML = selectedColumns.map(column => `
        <div class="line-style-config border rounded p-4 space-y-3">
            <div class="flex items-center justify-between">
                <span class="font-medium">${column}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Legend Label</label>
                    <input type="text" class="legend-label mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                           value="${column}" data-column="${column}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Line Style</label>
                    <select class="line-style mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="-">Solid</option>
                        <option value="--">Dashed</option>
                        <option value=":">Dotted</option>
                        <option value="-.">Dash-dot</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Line Width</label>
                    <input type="number" class="line-width mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                           value="2" min="0.5" max="10" step="0.5">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Marker Style</label>
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
                <div>
                    <label class="block text-sm font-medium text-gray-700">Marker Size</label>
                    <input type="number" class="marker-size mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                           value="6" min="1" max="20" step="1">
                </div>
            </div>
        </div>
    `).join('');
}

// Update line styles when Y columns change
$('#yColumns').on('change', updateLineStyleOptions);

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

    const formData = new FormData();
    
    // Get basic form values
    const formValues = {
        plotType: document.getElementById('plotType').value,
        plotTitle: document.getElementById('plotTitle').value,
        xColumn: document.getElementById('xColumn').value,
        yColumns: Array.from($('#yColumns').select2('data')).map(item => item.id),
        gridStyle: document.getElementById('gridStyle').value,
        colorScheme: document.getElementById('colorScheme').value,
        useLogScale: document.getElementById('useLogScale').checked,
        legendPosition: document.getElementById('legendPosition').value,
        figureWidth: document.getElementById('figureWidth')?.value || "12.0",
        figureHeight: document.getElementById('figureHeight')?.value || "8.0",
        xAxisLabel: document.getElementById('xAxisLabel').value,
        yAxisLabel: document.getElementById('yAxisLabel').value
    };

    console.log('Form Values:', formValues);

    // Get line style configurations
    const lineConfigs = formValues.yColumns.map(column => ({
        column: column,
        legendLabel: column,
        lineStyle: '-',  // solid line
        lineWidth: '2',  // medium width
        markerStyle: 'o',  // circle marker
        markerSize: '6'  // medium size
    }));

    console.log('Line Configs:', lineConfigs);

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

    try {
        console.log('Sending visualization request...');
        const response = await fetch('/visualize', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to generate visualization');
        }

        const data = await response.json();
        console.log('Received response from server');
        
        if (!data.plot) {
            throw new Error('No plot data received from server');
        }

        // Display the plot
        displayPlot(data.plot);
        
    } catch (error) {
        console.error('Error:', error);
        alert(`Error generating visualization: ${error.message}`);
    } finally {
        // Restore button state
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
}

// Display the plot
function displayPlot(base64Image) {
    const plotContainer = document.getElementById('plotContainer');
    const plotImage = document.getElementById('plot');
    
    // Set the image source
    plotImage.src = `data:image/png;base64,${base64Image}`;
    
    // Show the container
    plotContainer.classList.remove('hidden');
    
    // Scroll to the plot
    plotContainer.scrollIntoView({ behavior: 'smooth' });
}

// Clear the plot
function clearPlot() {
    const plotContainer = document.getElementById('plotContainer');
    const plotImage = document.getElementById('plot');
    
    // Clear the image
    plotImage.src = '';
    
    // Hide the container
    plotContainer.classList.add('hidden');
}

async function downloadPlot(format) {
    const plotImage = document.getElementById('plot');
    const base64Data = plotImage.src.split(',')[1];
    let filename = document.getElementById('downloadFilename').value.trim();
    
    // Validate filename
    if (!filename) {
        filename = `plot_${new Date().toISOString().slice(0,19).replace(/[:-]/g, '')}`; // Default filename with timestamp
    }
    
    try {
        const response = await fetch('/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image_data: base64Data,
                format: format,
                filename: filename
            })
        });

        if (!response.ok) {
            throw new Error('Failed to download plot');
        }

        // Get the blob from response
        const blob = await response.blob();
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${format}`; // Use the provided filename
        
        // Trigger download dialog
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error downloading plot: ' + error.message);
    }
}
