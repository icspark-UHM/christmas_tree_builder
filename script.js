const canvas = document.getElementById('canvas');
        const inspector = document.getElementById('inspector');
        let shapeId = 0;
        let draggedElement = null;
        let selectedShape = null;
        let offsetX = 0;
        let offsetY = 0;

        const shapeCSS = {
            triangle: {
                name: 'Triangle',
                explanation: 'Made using CSS borders! The trick is to make the width and height 0, then use transparent left/right borders and a colored bottom border.',
                code: `.triangle {
  width: 0;
  height: 0;
  border-left: 50px solid transparent;
  border-right: 50px solid transparent;
  border-bottom: 80px solid #2e7d32;
  /* Green color for tree */
}`,
                adjustable: ['border-bottom-width', 'border-left-width', 'border-bottom-color']
            },
            circle: {
                name: 'Circle',
                explanation: 'Created with border-radius! A square becomes a circle when border-radius is 50%.',
                code: `.circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  /* 50% makes it perfectly round */
  background: #f44336;
  /* Red for ornament */
}`,
                adjustable: ['width', 'background']
            },
            star: {
                name: 'Star',
                explanation: 'A perfect 5-point star created with clip-path! This CSS property cuts the shape of a square into a star using polygon coordinates.',
                code: `.star {
  width: 80px;
  height: 80px;
  aspect-ratio: 1;
  background: #ffd700;
  clip-path: polygon(50% 0, 79% 90%, 2% 35%, 98% 35%, 21% 90%);
}`,
                adjustable: ['width', 'background']
            },
            rectangle: {
                name: 'Rectangle',
                explanation: 'Simple shape using width and height. Perfect for the tree trunk!',
                code: `.rectangle {
  width: 60px;
  height: 80px;
  background: #8b4513;
  /* Brown for tree trunk */
}`,
                adjustable: ['width', 'height', 'background']
            },
            square: {
                name: 'Square',
                explanation: 'Same as rectangle but width equals height. Use for presents!',
                code: `.square {
  width: 60px;
  height: 60px;
  background: #ff9800;
  /* Orange for decoration */
}`,
                adjustable: ['width', 'background']
            },
            snowflake: {
                name: 'Snowflake',
                explanation: 'Using text! CSS can style emoji and text with font-size and text-shadow.',
                code: `.snowflake {
  color: #fff;
  font-size: 40px;
  text-shadow: 0 0 10px rgba(255,255,255,0.8);
  /* Glow effect */
}`,
                adjustable: ['font-size']
            }
        };

        // Add falling snow effect
        function createSnowflakes() {
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const snowflake = document.createElement('div');
                    snowflake.className = 'falling-snow';
                    snowflake.textContent = '❄';
                    snowflake.style.left = Math.random() * 100 + '%';
                    snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
                    snowflake.style.animationDelay = Math.random() * 2 + 's';
                    canvas.appendChild(snowflake);
                    
                    setTimeout(() => snowflake.remove(), 5000);
                }, i * 250);
            }
        }

        setInterval(createSnowflakes, 5000);
        createSnowflakes();

        // Shape button click handlers
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shapeType = btn.dataset.shape;
                createShape(shapeType, canvas.offsetWidth / 2, 100);
            });
        });

        function createShape(type, x, y) {
            const shape = document.createElement('div');
            shape.className = `shape ${type}`;
            shape.id = `shape-${shapeId++}`;
            shape.dataset.type = type;
            shape.dataset.scale = '1';
            shape.dataset.color = getDefaultColor(type);
            
            if (type === 'snowflake') {
                shape.textContent = '❄️';
            }
            
            shape.style.left = (x - 50) + 'px';
            shape.style.top = (y - 50) + 'px';
            shape.style.zIndex = 1;
            
            canvas.appendChild(shape);
            makeDraggable(shape);
            
            shape.addEventListener('click', (e) => {
                if (!draggedElement) {
                    e.stopPropagation();
                    selectShape(shape);
                }
            });
        }

        function getDefaultColor(type) {
            const colors = {
                triangle: '#2e7d32',
                circle: '#f44336',
                star: '#ffd700',
                rectangle: '#8b4513',
                square: '#ff9800',
                snowflake: '#ffffff'
            };
            return colors[type] || '#000000';
        }

        function selectShape(shape) {
            if (selectedShape) {
                selectedShape.classList.remove('selected');
            }
            selectedShape = shape;
            shape.classList.add('selected');
            updateInspector(shape);
        }

        function updateInspector(shape) {
            const type = shape.dataset.type;
            const cssInfo = shapeCSS[type];
            const scale = parseFloat(shape.dataset.scale) || 1;
            const color = shape.dataset.color;
            
            // Generate live CSS based on current values
            const liveCSS = generateLiveCSS(type, scale, color);
            
            inspector.innerHTML = `
                <div class="inspector-title">💻 CSS Inspector</div>
                <div class="inspector-content">
                    <div class="shape-info">
                        <h3>${cssInfo.name}</h3>
                        <p>${cssInfo.explanation}</p>
                    </div>
                    
                    <div class="css-code" id="live-css">${highlightCSS(liveCSS)}</div>
                    
                    <div class="size-controls">
                        <h4>🎛️ Adjust Properties:</h4>
                        <div class="slider-group">
                            <label>Size: <span class="slider-value" id="size-display">${Math.round(scale * 100)}%</span></label>
                            <input type="range" min="50" max="200" value="${scale * 100}" 
                                   oninput="updateShapeScale('${shape.id}', this.value)">
                        </div>
                        ${type !== 'snowflake' ? `
                        <div class="color-picker-group">
                            <label>Color:</label>
                            <input type="color" value="${color}" 
                                   oninput="updateShapeColor('${shape.id}', this.value)">
                        </div>
                        ` : ''}
                        <div class="layering-controls">
                            <button class="layer-btn" onclick="sendForward('${shape.id}')">⬆️ Send Forward</button>
                            <button class="layer-btn" onclick="sendBackward('${shape.id}')">⬇️ Send Backward</button>
                        </div>
                        <button class="delete-btn" onclick="deleteShape('${shape.id}')">🗑️ Delete Shape</button>
                    </div>
                </div>
            `;
        }

        function generateLiveCSS(type, scale, color) {
            const baseSize = {
                triangle: { borderLeft: 50, borderRight: 50, borderBottom: 80 },
                circle: { size: 60 },
                star: { size: 80 },
                rectangle: { width: 60, height: 80 },
                square: { size: 60 },
                snowflake: { fontSize: 40 }
            };

            const scaled = (val) => Math.round(val * scale);

            switch(type) {
                case 'triangle':
                    return `.triangle {
  width: 0;
  height: 0;
  border-left: ${scaled(baseSize.triangle.borderLeft)}px solid transparent;
  border-right: ${scaled(baseSize.triangle.borderRight)}px solid transparent;
  border-bottom: ${scaled(baseSize.triangle.borderBottom)}px solid ${color};
  transform: scale(${scale});
}`;
                case 'circle':
                    return `.circle {
  width: ${scaled(baseSize.circle.size)}px;
  height: ${scaled(baseSize.circle.size)}px;
  border-radius: 50%;
  background: ${color};
  transform: scale(${scale});
}`;
                case 'star':
                    return `.star {
  width: ${scaled(baseSize.star.size)}px;
  height: ${scaled(baseSize.star.size)}px;
  aspect-ratio: 1;
  background: ${color};
  clip-path: polygon(50% 0, 79% 90%, 2% 35%, 98% 35%, 21% 90%);
}`;
                case 'rectangle':
                    return `.rectangle {
  width: ${scaled(baseSize.rectangle.width)}px;
  height: ${scaled(baseSize.rectangle.height)}px;
  background: ${color};
  transform: scale(${scale});
}`;
                case 'square':
                    return `.square {
  width: ${scaled(baseSize.square.size)}px;
  height: ${scaled(baseSize.square.size)}px;
  background: ${color};
  transform: scale(${scale});
}`;
                case 'snowflake':
                    return `.snowflake {
  color: #fff;
  font-size: ${scaled(baseSize.snowflake.fontSize)}px;
  text-shadow: 0 0 10px rgba(255,255,255,0.8);
  transform: scale(${scale});
}`;
            }
        }

        function highlightCSS(code) {
            return code
                .replace(/\/\*.+?\*\//g, match => `<span class="css-comment">${match}</span>`)
                .replace(/(\.[a-z-]+)/g, '<span class="css-selector">$1</span>')
                .replace(/([a-z-]+):/g, '<span class="css-property">$1</span>:')
                .replace(/(#[0-9a-f]+|[0-9]+px|[0-9]+%|solid|transparent|rgba?\([^)]+\))/gi, 
                         '<span class="css-value">$1</span>');
        }

        window.updateShapeScale = function(id, value) {
            const shape = document.getElementById(id);
            const scale = value / 100;
            shape.dataset.scale = scale;
            shape.style.transform = `scale(${scale})`;
            
            // Update the display value
            const label = document.getElementById('size-display');
            if (label) label.textContent = `${Math.round(scale * 100)}%`;
            
            // Update live CSS code
            const type = shape.dataset.type;
            const color = shape.dataset.color;
            const liveCSS = generateLiveCSS(type, scale, color);
            const codeBlock = document.getElementById('live-css');
            if (codeBlock) {
                codeBlock.innerHTML = highlightCSS(liveCSS);
            }
        };

        window.updateShapeColor = function(id, color) {
            const shape = document.getElementById(id);
            const type = shape.dataset.type;
            shape.dataset.color = color;
            
            if (type === 'triangle') {
                shape.style.borderBottomColor = color;
            } else if (type === 'star') {
                shape.style.borderBottomColor = color;
                const style = document.createElement('style');
                style.textContent = `#${id}:before { border-top-color: ${color} !important; }`;
                document.head.appendChild(style);
            } else if (type === 'circle' || type === 'rectangle' || type === 'square') {
                shape.style.background = color;
            }
            
            // Update live CSS code
            const scale = parseFloat(shape.dataset.scale) || 1;
            const liveCSS = generateLiveCSS(type, scale, color);
            const codeBlock = document.getElementById('live-css');
            if (codeBlock) {
                codeBlock.innerHTML = highlightCSS(liveCSS);
            }
        };

        window.deleteShape = function(id) {
            const shape = document.getElementById(id);
            if (shape === selectedShape) {
                selectedShape = null;
                inspector.innerHTML = `
                    <div class="inspector-title">💻 CSS Inspector</div>
                    <div class="inspector-content">
                        <div class="no-selection">
                            👆 Click on a shape to see its CSS code and adjust its properties!
                        </div>
                    </div>
                `;
            }
            shape.remove();
        };

        canvas.addEventListener('click', (e) => {
            if (e.target === canvas && selectedShape) {
                selectedShape.classList.remove('selected');
                selectedShape = null;
                inspector.innerHTML = `
                    <div class="inspector-title">💻 CSS Inspector</div>
                    <div class="no-selection">
                        👆 Click on a shape to see its CSS code and adjust its properties!
                    </div>
                `;
            }
        });

        function makeDraggable(element) {
            element.addEventListener('mousedown', startDrag);
            element.addEventListener('touchstart', startDrag);
        }

        function startDrag(e) {
            const shape = e.target.closest('.shape');
            if (!shape) return;
            
            e.preventDefault();
            draggedElement = shape;
            draggedElement.classList.add('dragging');
            
            const rect = draggedElement.getBoundingClientRect();
            
            if (e.type === 'mousedown') {
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
            } else {
                offsetX = e.touches[0].clientX - rect.left;
                offsetY = e.touches[0].clientY - rect.top;
            }
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchmove', drag);
            document.addEventListener('touchend', stopDrag);
        }

        function drag(e) {
            if (!draggedElement) return;
            e.preventDefault();
            
            const canvasRect = canvas.getBoundingClientRect();
            let clientX, clientY;
            
            if (e.type === 'mousemove') {
                clientX = e.clientX;
                clientY = e.clientY;
            } else {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }
            
            let x = clientX - canvasRect.left - offsetX;
            let y = clientY - canvasRect.top - offsetY;
            
            x = Math.max(0, Math.min(x, canvasRect.width - 100));
            y = Math.max(0, Math.min(y, canvasRect.height - 100));
            
            draggedElement.style.left = x + 'px';
            draggedElement.style.top = y + 'px';
        }

        function stopDrag() {
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
                draggedElement = null;
            }
            
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('touchend', stopDrag);
        }

        function clearCanvas() {
            if (confirm('Are you sure you want to clear your tree?')) {
                const shapes = canvas.querySelectorAll('.shape:not(.falling-snow)');
                shapes.forEach(shape => shape.remove());
                selectedShape = null;
                inspector.innerHTML = `
                    <div class="inspector-title">💻 CSS Inspector</div>
                    <div class="no-selection">
                        👆 Click on a shape to see its CSS code and adjust its properties!
                    </div>
                `;
            }
        }

        function saveTree() {
            alert('Great job! 🎄\n\nYour Christmas tree looks amazing!\n\nYou learned:\n✓ How CSS creates shapes\n✓ How to adjust size and colors\n✓ How CSS properties work together\n\nKeep practicing CSS!');
        }

        window.sendForward = function(id) {
            const shape = document.getElementById(id);
            if (!shape) return;
            
            const currentZ = parseInt(shape.style.zIndex) || 1;
            shape.style.zIndex = currentZ + 1;
        };

        window.sendBackward = function(id) {
            const shape = document.getElementById(id);
            if (!shape) return;
            
            const currentZ = parseInt(shape.style.zIndex) || 1;
            // Prevent going below z-index of 1 so shapes stay above the canvas
            if (currentZ > 1) {
                shape.style.zIndex = currentZ - 1;
            }
        };