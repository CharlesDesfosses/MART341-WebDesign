class TShirtCustomizer {
    constructor() {
        this.canvas = new fabric.Canvas('tshirtCanvas');
        this.history = [];
        this.currentStep = -1;
        this.maxHistory = 20;
        this.zoomLevel = 1;
        this.maxZoom = 3;
        this.minZoom = 0.5;
        this.initializeCanvas();
        this.setupEventListeners();
        this.drawTShirt('#ffffff');
        this.templates = this.initializeTemplates();
        this.setupUndoRedo();
        this.setupKeyboardShortcuts();
    }

    initializeCanvas() {
        try {
            this.canvas.setDimensions({
                width: 600,
                height: 400
            });
            this.canvas.setBackgroundColor('#ffffff', this.canvas.renderAll.bind(this.canvas));
            
            // Enable object constraints
            this.canvas.on('object:moving', (e) => this.constrainObject(e.target));
            this.canvas.on('object:scaling', (e) => this.constrainObject(e.target));
            this.canvas.on('selection:created', () => this.updateControlButtons());
            this.canvas.on('selection:cleared', () => this.updateControlButtons());

            // Enable snap to center
            this.canvas.on('object:moving', this.snapToCenter.bind(this));
        } catch (error) {
            this.showError('Failed to initialize canvas', error);
        }
    }

    updateControlButtons() {
        const hasSelection = !!this.canvas.getActiveObject();
        document.getElementById('deleteSelected').disabled = !hasSelection;
        document.getElementById('moveForward').disabled = !hasSelection;
        document.getElementById('moveBackward').disabled = !hasSelection;
    }

    snapToCenter(e) {
        const obj = e.target;
        const canvasCenter = this.canvas.getCenter();
        const snapThreshold = 10;

        if (Math.abs(obj.left - canvasCenter.left) < snapThreshold) {
            obj.set('left', canvasCenter.left);
        }
        if (Math.abs(obj.top - canvasCenter.top) < snapThreshold) {
            obj.set('top', canvasCenter.top);
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 'c':
                        e.preventDefault();
                        this.copySelectedObject();
                        break;
                    case 'v':
                        e.preventDefault();
                        this.pasteObject();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveDesign();
                        break;
                }
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                const activeObject = this.canvas.getActiveObject();
                if (activeObject && document.activeElement.tagName !== 'INPUT') {
                    e.preventDefault();
                    this.deleteSelectedObject();
                }
            }
        });
    }

    copySelectedObject() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            activeObject.clone(cloned => {
                this.clipboard = cloned;
                this.showToast('Object copied');
            });
        }
    }

    pasteObject() {
        if (this.clipboard) {
            this.clipboard.clone(clonedObj => {
                clonedObj.set({
                    left: clonedObj.left + 10,
                    top: clonedObj.top + 10,
                    evented: true,
                });
                this.canvas.add(clonedObj);
                this.canvas.setActiveObject(clonedObj);
                this.canvas.renderAll();
                this.saveState();
                this.showToast('Object pasted');
            });
        }
    }

    constrainObject(obj) {
        const bound = obj.getBoundingRect();
        if (bound.left < 0) {
            obj.left += Math.abs(bound.left);
        }
        if (bound.top < 0) {
            obj.top += Math.abs(bound.top);
        }
        if (bound.left + bound.width > this.canvas.width) {
            obj.left -= bound.left + bound.width - this.canvas.width;
        }
        if (bound.top + bound.height > this.canvas.height) {
            obj.top -= bound.top + bound.height - this.canvas.height;
        }
    }

    setupEventListeners() {
        // Color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.drawTShirt(color);
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.saveState();
            });
        });

        // Text controls
        document.getElementById('addTextBtn')?.addEventListener('click', () => {
            const text = document.getElementById('customText').value;
            const fontFamily = document.getElementById('fontFamily').value;
            const textColor = document.getElementById('textColor').value;
            const fontSize = parseInt(document.getElementById('fontSize').value);
            const textAlign = document.getElementById('textAlign').value;

            this.addText(text, {
                fontFamily,
                fill: textColor,
                fontSize,
                textAlign
            });
        });

        // Image upload
        document.getElementById('imageUpload')?.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // Template buttons
        document.querySelectorAll('[data-template]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateName = e.target.dataset.template;
                this.applyTemplate(templateName);
            });
        });

        // Canvas controls
        document.getElementById('moveForward')?.addEventListener('click', () => this.moveLayer('forward'));
        document.getElementById('moveBackward')?.addEventListener('click', () => this.moveLayer('backward'));
        document.getElementById('deleteSelected')?.addEventListener('click', () => this.deleteSelectedObject());
        document.getElementById('resetCanvas')?.addEventListener('click', () => this.resetCanvas());
        document.getElementById('downloadDesign')?.addEventListener('click', () => this.downloadDesign());
        document.getElementById('saveDesign')?.addEventListener('click', () => this.saveDesign());

        // Zoom controls
        document.getElementById('zoomIn')?.addEventListener('click', () => this.zoom('in'));
        document.getElementById('zoomOut')?.addEventListener('click', () => this.zoom('out'));
        document.getElementById('resetZoom')?.addEventListener('click', () => this.resetZoom());
    }

    zoom(direction) {
        const factor = direction === 'in' ? 1.1 : 0.9;
        const newZoom = this.zoomLevel * factor;

        if (newZoom >= this.minZoom && newZoom <= this.maxZoom) {
            this.zoomLevel = newZoom;
            this.canvas.setZoom(this.zoomLevel);
            this.canvas.renderAll();
        }
    }

    resetZoom() {
        this.zoomLevel = 1;
        this.canvas.setZoom(1);
        this.canvas.renderAll();
    }

    moveLayer(direction) {
        const activeObject = this.canvas.getActiveObject();
        if (!activeObject) return;

        if (direction === 'forward') {
            activeObject.bringForward();
        } else {
            activeObject.sendBackwards();
        }
        this.canvas.renderAll();
        this.saveState();
    }

    deleteSelectedObject() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            this.canvas.remove(activeObject);
            this.canvas.renderAll();
            this.saveState();
            this.showToast('Object deleted');
        }
    }

    drawTShirt(color) {
        try {
            const ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw t-shirt body
            ctx.beginPath();
            ctx.moveTo(200, 100);
            ctx.quadraticCurveTo(300, 100, 400, 100);
            ctx.lineTo(450, 300);
            ctx.lineTo(150, 300);
            ctx.lineTo(200, 100);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.stroke();

            // Draw collar
            ctx.beginPath();
            ctx.moveTo(275, 100);
            ctx.quadraticCurveTo(300, 120, 325, 100);
            ctx.stroke();

            // Draw sleeves
            ctx.beginPath();
            ctx.moveTo(200, 100);
            ctx.lineTo(150, 150);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(400, 100);
            ctx.lineTo(450, 150);
            ctx.stroke();

            this.saveState();
        } catch (error) {
            this.showError('Failed to draw t-shirt', error);
        }
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            this.showError('Invalid file type', 'Please upload a JPEG, PNG, or GIF file.');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('File too large', 'Maximum file size is 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                this.addImage(img);
            };
            img.onerror = () => {
                this.showError('Image load failed', 'Failed to load the image. Please try another file.');
            };
            img.src = event.target.result;
        };
        reader.onerror = () => {
            this.showError('File read failed', 'Failed to read the file. Please try again.');
        };
        reader.readAsDataURL(file);
    }

    addImage(img) {
        try {
            const maxDimension = 300;
            let width = img.width;
            let height = img.height;

            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = (height * maxDimension) / width;
                    width = maxDimension;
                } else {
                    width = (width * maxDimension) / height;
                    height = maxDimension;
                }
            }

            const fabricImage = new fabric.Image(img, {
                left: (this.canvas.width - width) / 2,
                top: (this.canvas.height - height) / 2,
                width: width,
                height: height
            });

            this.canvas.add(fabricImage);
            this.canvas.setActiveObject(fabricImage);
            this.canvas.renderAll();
            this.saveState();
            this.showToast('Image added successfully');
        } catch (error) {
            this.showError('Failed to add image', error);
        }
    }

    addText(text, options = {}) {
        if (!text) {
            this.showToast('Please enter some text', 'warning');
            return;
        }

        try {
            const defaultOptions = {
                left: this.canvas.width / 2,
                top: this.canvas.height / 2,
                fontSize: 20,
                fontFamily: 'Arial',
                fill: '#000000',
                textAlign: 'center',
                originX: 'center',
                originY: 'center'
            };

            const fabricText = new fabric.Text(text, {
                ...defaultOptions,
                ...options
            });

            this.canvas.add(fabricText);
            this.canvas.setActiveObject(fabricText);
            this.canvas.renderAll();
            this.saveState();
            this.showToast('Text added successfully');
        } catch (error) {
            this.showError('Failed to add text', error);
        }
    }

    applyTemplate(templateName) {
        const template = this.templates[templateName];
        if (!template) {
            this.showError('Template not found', `Template "${templateName}" is not available.`);
            return;
        }

        try {
            this.addText(template.text, {
                fontSize: template.fontSize,
                fontFamily: template.font,
                fill: template.color,
                left: this.canvas.width / 2,
                top: this.canvas.height / 2,
                textAlign: 'center'
            });
        } catch (error) {
            this.showError('Failed to apply template', error);
        }
    }

    saveDesign() {
        try {
            const designData = this.canvas.toJSON();
            localStorage.setItem('savedDesign', JSON.stringify(designData));
            this.showToast('Design saved successfully');
        } catch (error) {
            this.showError('Failed to save design', error);
        }
    }

    loadSavedDesign() {
        try {
            const savedDesign = localStorage.getItem('savedDesign');
            if (savedDesign) {
                this.canvas.loadFromJSON(JSON.parse(savedDesign), () => {
                    this.canvas.renderAll();
                    this.showToast('Design loaded successfully');
                });
            }
        } catch (error) {
            this.showError('Failed to load saved design', error);
        }
    }

    downloadDesign() {
        try {
            const dataURL = this.canvas.toDataURL({
                format: 'png',
                quality: 1
            });

            const link = document.createElement('a');
            link.download = 'tshirt-design.png';
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.showToast('Design downloaded successfully');
        } catch (error) {
            this.showError('Failed to download design', error);
        }
    }

    showError(title, error) {
        const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
        document.getElementById('errorModalLabel').textContent = title;
        document.getElementById('errorMessage').textContent = error.message || error;
        errorModal.show();
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class
<div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        const toastContainer = document.getElementById('toastContainer');
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
        bsToast.show();

        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toastContainer.removeChild(toast);
        });
    }

    resetCanvas() {
        try {
            if (confirm('Are you sure you want to reset the canvas? This action cannot be undone.')) {
                this.canvas.clear();
                this.drawTShirt('#ffffff');
                document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelector('.color-btn[data-color="#ffffff"]').classList.add('active');
                this.saveState();
                this.showToast('Canvas reset successfully');
            }
        } catch (error) {
            this.showError('Failed to reset canvas', error);
        }
    }

    initializeTemplates() {
        return {
            birthday: {
                text: "Happy Birthday!",
                font: "Arial",
                fontSize: 40,
                color: "#FF1493"
            },
            custom: {
                text: "Custom Design",
                font: "Helvetica",
                fontSize: 35,
                color: "#4CAF50"
            },
            funny: {
                text: "Keep Calm\nand\nWear This Shirt",
                font: "Times New Roman",
                fontSize: 30,
                color: "#FF5722"
            },
            holiday: {
                text: "Happy Holidays!",
                font: "Arial",
                fontSize: 40,
                color: "#2196F3"
            },
            motivational: {
                text: "Dream Big\nWork Hard",
                font: "Helvetica",
                fontSize: 35,
                color: "#9C27B0"
            }
        };
    }

    saveState() {
        const json = JSON.stringify(this.canvas.toJSON());
        if (this.currentStep < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentStep + 1);
        }
        this.history.push(json);
        this.currentStep++;
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.currentStep--;
        }
        
        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.loadState();
        }
    }

    redo() {
        if (this.currentStep < this.history.length - 1) {
            this.currentStep++;
            this.loadState();
        }
    }

    loadState() {
        this.canvas.loadFromJSON(this.history[this.currentStep], () => {
            this.canvas.renderAll();
            this.updateUndoRedoButtons();
        });
    }

    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn && redoBtn) {
            undoBtn.disabled = this.currentStep <= 0;
            redoBtn.disabled = this.currentStep >= this.history.length - 1;
        }
    }

    setupUndoRedo() {
        document.getElementById('undoBtn')?.addEventListener('click', () => this.undo());
        document.getElementById('redoBtn')?.addEventListener('click', () => this.redo());
        this.saveState(); // Save initial state
    }
}

// Initialize the customizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.customizer = new TShirtCustomizer();
        
        // Load saved design if available
        const savedDesign = localStorage.getItem('savedDesign');
        if (savedDesign) {
            const loadDesign = confirm('Would you like to load your previously saved design?');
            if (loadDesign) {
                window.customizer.loadSavedDesign();
            }
        }
    } catch (error) {
        console.error('Failed to initialize T-Shirt Customizer:', error);
        // Show user-friendly error message
        const errorElement = document.createElement('div');
        errorElement.className = 'alert alert-danger';
        errorElement.textContent = 'Failed to load the T-Shirt Customizer. Please refresh the page.';
        document.querySelector('.customizer-section')?.prepend(errorElement);
    }
});