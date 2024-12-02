class TShirtCustomizer {
    constructor() {
        this.canvas = new fabric.Canvas('tshirtCanvas');
        this.initializeCanvas();
        this.setupEventListeners();
        this.drawTShirt('#ffffff');
        this.templates = this.initializeTemplates();
    }

    initializeCanvas() {
        this.canvas.setDimensions({
            width: 600,
            height: 400
        });
        this.canvas.setBackgroundColor('#ffffff', this.canvas.renderAll.bind(this.canvas));
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
            }
        };
    }

    setupEventListeners() {
        // Color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.drawTShirt(color);
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Enhanced text controls
        document.getElementById('addTextBtn').addEventListener('click', () => {
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

        // Template buttons
        document.querySelectorAll('[data-template]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateName = e.target.dataset.template;
                this.applyTemplate(templateName);
            });
        });

        // Image controls
        document.getElementById('moveForward').addEventListener('click', () => {
            const active = this.canvas.getActiveObject();
            if (active) active.bringForward();
            this.canvas.renderAll();
        });

        document.getElementById('moveBackward').addEventListener('click', () => {
            const active = this.canvas.getActiveObject();
            if (active) active.sendBackwards();
            this.canvas.renderAll();
        });

        document.getElementById('deleteSelected').addEventListener('click', () => {
            const active = this.canvas.getActiveObject();
            if (active) {
                this.canvas.remove(active);
                this.canvas.renderAll();
            }
        });

        // Image upload
        document.getElementById('imageUpload').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // Download design
        document.getElementById('downloadDesign').addEventListener('click', () => {
            this.downloadDesign();
        });

        // Reset button
        document.getElementById('resetCanvas').addEventListener('click', () => {
            this.resetCanvas();
        });

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const active = this.canvas.getActiveObject();
                if (active) {
                    this.canvas.remove(active);
                    this.canvas.renderAll();
                }
            }
        });
    }

    drawTShirt(color) {
        // Create basic t-shirt shape
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
    }

    addText(text, options = {}) {
        if (!text) return;

        const defaultOptions = {
            left: 250,
            top: 200,
            fontSize: 20,
            fontFamily: 'Arial',
            fill: '#000000',
            textAlign: 'left'
        };

        const fabricText = new fabric.Text(text, {
            ...defaultOptions,
            ...options
        });

        this.canvas.add(fabricText);
        this.canvas.setActiveObject(fabricText);
        this.canvas.renderAll();
    }

    applyTemplate(templateName) {
        const template = this.templates[templateName];
        if (!template) return;

        this.addText(template.text, {
            fontSize: template.fontSize,
            fontFamily: template.font,
            fill: template.color,
            left: 250,
            top: 200,
            textAlign: 'center'
        });
    }

    handleImageUpload(e) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const imgObj = new Image();
            imgObj.src = event.target.result;
            imgObj.onload = () => {
                const image = new fabric.Image(imgObj);
                image.scale(0.5);
                this.canvas.add(image);
                this.canvas.renderAll();
            }
        }
        reader.readAsDataURL(e.target.files[0]);
    }

    downloadDesign() {
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
    }

    resetCanvas() {
        this.canvas.clear();
        this.drawTShirt('#ffffff');
        document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.color-btn[data-color="#ffffff"]').classList.add('active');
    }
}

// Initialize the customizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TShirtCustomizer();
});