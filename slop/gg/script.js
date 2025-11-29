// Global State
let selectedWidget = null;
let widgets = [];
let dragData = { widgetType: null };
let isResizing = false;

const previewWindow = document.getElementById('preview-window');
const generatedCodeArea = document.getElementById('generated-code');
const toggleCodeButton = document.getElementById('toggle-code-btn');
const windowSizeDisplay = document.getElementById('window-size-display');
const propertiesPanel = document.getElementById('properties-panel');

// --- 1. Drag and Drop from Toolbox ---

document.querySelectorAll('.widget-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
        dragData.widgetType = item.getAttribute('data-widget');
    });
});

previewWindow.addEventListener('dragover', (e) => {
    e.preventDefault(); // Allows drop
});

previewWindow.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!dragData.widgetType) return;

    // Calculate position relative to the preview window
    const rect = previewWindow.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    createWidget(dragData.widgetType, x, y);
    dragData.widgetType = null;
});

/**
 * Creates and appends a new HTML widget element to the preview window.
 * @param {string} type - The Tkinter widget type (e.g., 'Button', 'Label').
 * @param {number} x - The x-coordinate for placement.
 * @param {number} y - The y-coordinate for placement.
 */
function createWidget(type, x, y) {
    const newWidget = document.createElement('div');
    newWidget.classList.add('dropped-widget');
    newWidget.setAttribute('data-widget', type);
    newWidget.setAttribute('data-id', Date.now()); // Simple unique ID

    // Set initial text/content based on widget type
    switch (type) {
        case 'Button':
            newWidget.textContent = 'Button';
            newWidget.style.width = '100px';
            newWidget.style.height = '30px';
            break;
        case 'Label':
            newWidget.textContent = 'Tkinter Label';
            newWidget.style.width = '120px';
            newWidget.style.height = '20px';
            break;
        case 'Entry':
            newWidget.textContent = '';
            newWidget.style.width = '150px';
            newWidget.style.height = '24px';
            break;
        default:
            newWidget.textContent = type;
            newWidget.style.width = '100px';
            newWidget.style.height = '30px';
    }

    // Set position
    newWidget.style.left = `${x}px`;
    newWidget.style.top = `${y}px`;

    // Add event listeners for selection and movement
    newWidget.addEventListener('click', selectWidget);
    newWidget.addEventListener('mousedown', startWidgetDrag);

    previewWindow.appendChild(newWidget);

    // Add to state
    widgets.push({
        id: newWidget.getAttribute('data-id'),
        type: type,
        x: x,
        y: y,
        width: parseInt(newWidget.style.width),
        height: parseInt(newWidget.style.height),
        text: newWidget.textContent
        // ... add more properties
    });

    selectWidget({ target: newWidget });
}

// --- 2. Widget Selection ---

function selectWidget(e) {
    // Stop event from propagating to main window (which would deselect)
    e.stopPropagation();

    // Deselect previously selected widget
    if (selectedWidget) {
        selectedWidget.classList.remove('selected');
        // TODO: Remove element resize handles here
    }

    // Select the new widget
    const newSelection = e.target.closest('.dropped-widget');
    if (newSelection) {
        selectedWidget = newSelection;
        selectedWidget.classList.add('selected');
        // TODO: Add element resize handles here
        updatePropertiesPanel(selectedWidget);
    } else {
        selectedWidget = null;
        updatePropertiesPanel(null);
    }
}

// Deselect when clicking on the preview window itself
previewWindow.addEventListener('click', (e) => {
    if (e.target.id === 'preview-window' || e.target.id === 'window-preview-container') {
        selectWidget({ target: null });
    }
});

// --- 3. Widget Movement (Simplified) ---

function startWidgetDrag(e) {
    if (e.button !== 0 || !e.target.classList.contains('dropped-widget')) return; // Left click only

    e.preventDefault();
    const widget = e.target;
    const startX = e.clientX;
    const startY = e.clientY;
    const initialLeft = widget.offsetLeft;
    const initialTop = widget.offsetTop;

    function move(e) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // Apply movement, constrained by previewWindow bounds (omitted for brevity)
        widget.style.left = `${initialLeft + dx}px`;
        widget.style.top = `${initialTop + dy}px`;

        // TODO: Implement snapping guides logic here
        // TODO: Update properties panel with new X/Y
    }

    function stop() {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', stop);
        // TODO: Update state array (widgets) with final X/Y
    }

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', stop);
}

// --- 4. Main Window Resizing ---

document.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', startResize);
});

let activeHandle = null;
let startX, startY, startWidth, startHeight;

function startResize(e) {
    e.preventDefault();
    e.stopPropagation();
    activeHandle = e.target;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = previewWindow.offsetWidth;
    startHeight = previewWindow.offsetHeight;
    isResizing = true;
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
}

function resize(e) {
    if (!activeHandle) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newWidth = startWidth;
    let newHeight = startHeight;

    // Corner and Edge Logic
    if (activeHandle.classList.contains('right') || activeHandle.classList.contains('top-right') || activeHandle.classList.contains('bottom-right')) {
        newWidth = startWidth + dx;
    }
    if (activeHandle.classList.contains('bottom') || activeHandle.classList.contains('bottom-left') || activeHandle.classList.contains('bottom-right')) {
        newHeight = startHeight + dy;
    }
    // Left/Top edge logic (requires shifting position too, omitted for brevity)
    // ...

    // Minimum size check
    if (newWidth > 100) previewWindow.style.width = `${newWidth}px`;
    if (newHeight > 100) previewWindow.style.height = `${newHeight}px`;

    updateWindowSizeDisplay(newWidth, newHeight);
}

function stopResize() {
    isResizing = false;
    activeHandle = null;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
}

function updateWindowSizeDisplay(w, h) {
    const width = w ? Math.round(w) : previewWindow.offsetWidth;
    const height = h ? Math.round(h) : previewWindow.offsetHeight;
    windowSizeDisplay.textContent = `${width}x${height}`;
}
updateWindowSizeDisplay(); // Initial display

// --- 5. Properties Panel Update ---

function updatePropertiesPanel(widgetElement) {
    const selectedName = document.getElementById('selected-widget-name');
    const propsContent = document.getElementById('properties-content');

    if (!widgetElement) {
        selectedName.textContent = 'No Widget Selected';
        propsContent.style.display = 'none';
        return;
    }

    propsContent.style.display = 'block';
    const widgetType = widgetElement.getAttribute('data-widget');
    selectedName.textContent = `${widgetType} (${widgetElement.getAttribute('data-id')})`;

    // Find the state object
    const state = widgets.find(w => w.id === widgetElement.getAttribute('data-id'));

    // Populate common properties
    document.getElementById('prop-x').value = parseInt(widgetElement.style.left) || 0;
    document.getElementById('prop-y').value = parseInt(widgetElement.style.top) || 0;
    document.getElementById('prop-width').value = widgetElement.offsetWidth;
    document.getElementById('prop-height').value = widgetElement.offsetHeight;
    document.getElementById('prop-text').value = widgetElement.textContent;

    // TODO: Add event listeners to property inputs to update the selectedWidget's style/state

    // TODO: Dynamic properties based on widgetType (e.g., listbox items editor)
    // You would clear existing dynamic fields and insert new HTML here based on the widget type.
}

// --- 6. Code Generation and Toggle ---

toggleCodeButton.addEventListener('click', () => {
    generatedCodeArea.classList.toggle('expanded');
    // Change the arrow direction
    toggleCodeButton.textContent = generatedCodeArea.classList.contains('expanded')
        ? '▲ Generated Python Code (Click to Collapse)'
        : '▼ Generated Python Code (Click to Expand)';
});

function generateCode() {
    const windowWidth = previewWindow.offsetWidth;
    const windowHeight = previewWindow.offsetHeight;

    let code = `import tkinter as tk
from tkinter import ttk

class App:
    def __init__(self, master):
        self.master = master
        master.title("Tkinter GUI")
        master.geometry("${windowWidth}x${windowHeight}")\n\n`;

    // Generate widget code
    widgets.forEach((widget, index) => {
        const varName = `${widget.type.toLowerCase()}_${index + 1}`;
        code += `        # ${widget.type}
        self.${varName} = ttk.${widget.type}(master`;

        if (widget.text) {
             code += `, text="${widget.text}"`;
        }
        // TODO: Add more properties (font, color, command, etc.)

        code += `)\n`;

        // Use .place for absolute positioning (matching the drag/drop placement)
        code += `        self.${varName}.place(x=${Math.round(widget.x)}, y=${Math.round(widget.y)}, width=${widget.width}, height=${widget.height})\n\n`;
    });

    code += `if __name__ == '__main__':
    root = tk.Tk()
    app = App(root)
    root.mainloop()
`;

    generatedCodeArea.value = code;
}
