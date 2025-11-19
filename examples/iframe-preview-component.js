/**
 * IframePreview Web Component
 * Borderless Segmented Toolbar style preview component
 */

// Constants
const CONSTRAINTS = {
  WIDTH: { MIN: 100, MAX: 3840, DEFAULT: 800 },
  HEIGHT: { MIN: 100, MAX: 2160, DEFAULT: 600 },
  ZOOM: { MIN: 0.1, MAX: 3, STEP: 0.1, DEFAULT: 1 },
  VIEWPORT: { HEIGHT: 500 },
  HEADER: { HEIGHT: 32 },
  CONTROLS: { HEIGHT: 28 },
};

class IframePreview extends HTMLElement {
  static observedAttributes = ['url', 'width', 'height', 'mode'];

  constructor() {
    super();

    // State
    this.zoom = CONSTRAINTS.ZOOM.DEFAULT;
    this.panX = 0;
    this.panY = 0;
    this.frameWidth = CONSTRAINTS.WIDTH.DEFAULT;
    this.frameHeight = CONSTRAINTS.HEIGHT.DEFAULT;
    this.frameUrl = './standalone-child.html';
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.startPanX = 0;
    this.startPanY = 0;
    this.startWidth = 0;
    this.startHeight = 0;
    this._mode = 'move'; // 'move' or 'click'

    // Bind methods for event listener cleanup
    this.boundDrag = (e) => this.drag(e);
    this.boundDragTouch = (e) => this.dragTouch(e);
    this.boundEndDrag = () => this.endDrag();
  }

  connectedCallback() {
    // Get initial attributes
    if (this.hasAttribute('url')) {
      this.frameUrl = this.getAttribute('url');
    }
    if (this.hasAttribute('width')) {
      this.frameWidth = parseInt(this.getAttribute('width'));
    }
    if (this.hasAttribute('height')) {
      this.frameHeight = parseInt(this.getAttribute('height'));
    }
    if (this.hasAttribute('mode')) {
      this._mode = this.getAttribute('mode');
    }

    this.render();
    this.setupEventListeners();
    this.updateMode(this._mode);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.isConnected) return;

    if (name === 'url' && newValue !== oldValue) {
      this.frameUrl = newValue;
      if (this.iframe) {
        this.iframe.src = newValue;
        this.urlInput.value = newValue;
      }
    } else if (name === 'width' && newValue !== oldValue) {
      this.frameWidth = parseInt(newValue);
      if (this.iframe) {
        this.updateSize(this.frameWidth, this.frameHeight);
      }
    } else if (name === 'height' && newValue !== oldValue) {
      this.frameHeight = parseInt(newValue);
      if (this.iframe) {
        this.updateSize(this.frameWidth, this.frameHeight);
      }
    } else if (name === 'mode' && newValue !== oldValue) {
      this._mode = newValue;
      this.updateMode(newValue);
    }
  }

  disconnectedCallback() {
    // Clean up document-level event listeners to prevent memory leaks
    document.removeEventListener('mousemove', this.boundDrag);
    document.removeEventListener('mouseup', this.boundEndDrag);
    document.removeEventListener('touchmove', this.boundDragTouch);
    document.removeEventListener('touchend', this.boundEndDrag);
    document.removeEventListener('touchcancel', this.boundEndDrag);
  }

  // Mode property with getter/setter
  get mode() {
    return this._mode;
  }

  set mode(value) {
    if (value === 'move' || value === 'click') {
      this.setAttribute('mode', value);
    }
  }

  render() {
    const componentId = this.getAttribute('id') || 'preview';

    this.innerHTML = `
      <style>
        iframe-preview {
          display: block;
        }

        .preview-wrapper {
          background: #252526;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          border: 1px solid #3e3e42;
        }

        .preview-header {
          background: #2d2d30;
          padding: 0;
          display: flex;
          gap: 0;
          align-items: stretch;
          border-bottom: 1px solid #1e1e1e;
          height: 32px;
        }

        .preview-id {
          font-size: 12px;
          font-weight: 600;
          color: #cccccc;
          min-width: 40px;
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #252526;
          border-right: 1px solid #1e1e1e;
        }

        .control-btn {
          padding: 0 12px;
          background: transparent;
          color: #cccccc;
          border: none;
          border-right: 1px solid #1e1e1e;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .control-btn:hover {
          background: #505050;
          color: #ffffff;
        }

        .preview-header .url-input {
          flex: 1;
          min-width: 0;
          max-width: none;
          padding: 0 10px;
          background: #1e1e1e;
          color: #cccccc;
          border: none;
          border-right: 1px solid #1e1e1e;
          font-size: 11px;
          height: 100%;
        }

        .preview-header .url-input:focus {
          outline: none;
          background: #252526;
        }

        .load-btn {
          padding: 0 14px;
          background: transparent;
          color: #4ec9b0;
          border: none;
          cursor: pointer;
          font-size: 11px;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .load-btn:hover {
          background: #0e639c;
          color: white;
        }

        .iframe-viewport {
          position: relative;
          width: 100%;
          height: 500px;
          overflow: hidden;
          background: #1e1e1e;
        }

        .iframe-viewport.move-mode {
          cursor: grab;
        }

        .iframe-viewport.move-mode.grabbing {
          cursor: grabbing;
        }

        .iframe-viewport.click-mode {
          cursor: default;
        }

        .iframe-container {
          position: absolute;
          transform-origin: 0 0;
          transition: transform 0.1s ease-out;
        }

        .iframe-wrapper {
          position: relative;
          display: inline-block;
        }

        .iframe-container iframe {
          border: 2px solid #3e3e42;
          border-radius: 4px;
          background: white;
          display: block;
          pointer-events: auto;
        }

        .iframe-viewport.move-mode .iframe-container iframe {
          pointer-events: none;
        }

        .resize-handle {
          position: absolute;
          width: 16px;
          height: 16px;
          background: #0e639c;
          border: 2px solid #ffffff;
          border-radius: 50%;
          z-index: 10;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .resize-handle:hover {
          opacity: 1;
          background: #1177bb;
        }

        .resize-handle.nw { top: -8px; left: -8px; cursor: nw-resize; }
        .resize-handle.ne { top: -8px; right: -8px; cursor: ne-resize; }
        .resize-handle.sw { bottom: -8px; left: -8px; cursor: sw-resize; }
        .resize-handle.se { bottom: -8px; right: -8px; cursor: se-resize; }

        .controls-bar {
          background: #2d2d30;
          padding: 0;
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          gap: 0;
          border-top: 1px solid #1e1e1e;
          height: 28px;
        }

        .zoom-controls {
          display: flex;
          gap: 0;
          align-items: stretch;
        }

        .zoom-controls .control-btn {
          min-width: 28px;
          padding: 0 10px;
          border-right: 1px solid #1e1e1e;
        }

        .zoom-input {
          width: 60px;
          padding: 0 8px;
          background: #1e1e1e;
          color: #cccccc;
          border: none;
          border-right: 1px solid #1e1e1e;
          font-size: 11px;
          text-align: center;
        }

        .info-controls {
          display: flex;
          gap: 0;
          align-items: stretch;
        }

        .info-group {
          display: flex;
          gap: 0;
          align-items: stretch;
          border-right: 1px solid #1e1e1e;
        }

        .info-group:last-child {
          border-right: none;
        }

        .size-input, .position-input {
          width: 45px;
          padding: 0 6px;
          background: #1e1e1e;
          color: #cccccc;
          border: none;
          font-size: 11px;
          text-align: center;
        }

        .size-label {
          font-size: 10px;
          color: #858585;
          padding: 0 6px;
          display: flex;
          align-items: center;
          background: #252526;
          border-right: 1px solid #1e1e1e;
          min-width: 18px;
          justify-content: center;
        }
      </style>

      <div class="preview-wrapper">
        <div class="preview-header">
          <span class="preview-id">${componentId}</span>
          <button class="control-btn reset-pan" title="Reset Position">⌖ Reset</button>
          <input type="text" class="url-input" name="${componentId}-url" placeholder="Enter iframe URL" value="${this.frameUrl}">
          <button class="load-btn">Load</button>
        </div>
        <div class="iframe-viewport">
          <div class="iframe-container">
            <div class="iframe-wrapper">
              <iframe src="${this.frameUrl}" width="${this.frameWidth}" height="${this.frameHeight}"></iframe>
              <div class="resize-handle nw" data-handle="nw"></div>
              <div class="resize-handle ne" data-handle="ne"></div>
              <div class="resize-handle sw" data-handle="sw"></div>
              <div class="resize-handle se" data-handle="se"></div>
            </div>
          </div>
        </div>
        <div class="controls-bar">
          <div class="zoom-controls">
            <button class="control-btn zoom-out" title="Zoom Out">-</button>
            <input type="number" class="zoom-input" name="${componentId}-zoom" value="100" min="10" max="300" step="10">
            <span class="size-label">%</span>
            <button class="control-btn zoom-in" title="Zoom In">+</button>
          </div>
          <div class="info-controls">
            <div class="info-group">
              <span class="size-label">X:</span>
              <input type="number" class="position-input x-input" name="${componentId}-x" value="0">
            </div>
            <div class="info-group">
              <span class="size-label">Y:</span>
              <input type="number" class="position-input y-input" name="${componentId}-y" value="0">
            </div>
            <div class="info-group">
              <span class="size-label">W:</span>
              <input type="number" class="size-input width-input" name="${componentId}-width" value="${this.frameWidth}" min="100" max="3840">
            </div>
            <div class="info-group">
              <span class="size-label">H:</span>
              <input type="number" class="size-input height-input" name="${componentId}-height" value="${this.frameHeight}" min="100" max="2160">
            </div>
          </div>
        </div>
      </div>
    `;

    // Get element references
    this.viewport = this.querySelector('.iframe-viewport');
    this.iframeContainer = this.querySelector('.iframe-container');
    this.iframe = this.querySelector('iframe');
    this.urlInput = this.querySelector('.url-input');
    this.zoomInput = this.querySelector('.zoom-input');
    this.xInput = this.querySelector('.x-input');
    this.yInput = this.querySelector('.y-input');

    this.updateTransform();
  }

  setupEventListeners() {
    // Zoom controls
    this.querySelector('.zoom-in').addEventListener('click', () => this.zoomIn());
    this.querySelector('.zoom-out').addEventListener('click', () => this.zoomOut());
    this.zoomInput.addEventListener('change', (e) => {
      const value = parseInt(e.target.value);
      this.zoom = Math.max(CONSTRAINTS.ZOOM.MIN, Math.min(value / 100, CONSTRAINTS.ZOOM.MAX));
      this.updateTransform();
      this.updateIndicators();
    });

    // Reset
    this.querySelector('.reset-pan').addEventListener('click', () => this.resetPan());

    // Size controls
    const widthInput = this.querySelector('.width-input');
    const heightInput = this.querySelector('.height-input');
    widthInput.addEventListener('change', (e) => this.updateSize(parseInt(e.target.value), this.frameHeight));
    heightInput.addEventListener('change', (e) => this.updateSize(this.frameWidth, parseInt(e.target.value)));

    // Position controls
    this.xInput.addEventListener('change', (e) => this.updatePosition(parseInt(e.target.value) || 0, this.panY));
    this.yInput.addEventListener('change', (e) => this.updatePosition(this.panX, parseInt(e.target.value) || 0));

    // URL controls
    const loadBtn = this.querySelector('.load-btn');
    loadBtn.addEventListener('click', () => this.loadUrl());
    this.urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.loadUrl();
    });

    // Pan with drag (mouse)
    this.viewport.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', this.boundDrag);
    document.addEventListener('mouseup', this.boundEndDrag);

    // Pan with drag (touch)
    this.viewport.addEventListener('touchstart', (e) => this.startDragTouch(e), { passive: false });
    document.addEventListener('touchmove', this.boundDragTouch, { passive: false });
    document.addEventListener('touchend', this.boundEndDrag);
    document.addEventListener('touchcancel', this.boundEndDrag);

    // Resize handles
    const handles = this.querySelectorAll('.resize-handle');
    handles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => this.startResize(e, handle.dataset.handle));
      handle.addEventListener('touchstart', (e) => this.startResizeTouch(e, handle.dataset.handle), { passive: false });
    });
  }

  // Public API for parent-child communication
  getIframe() {
    return this.iframe;
  }

  getContentWindow() {
    return this.iframe?.contentWindow;
  }

  // Mode control
  updateMode(mode) {
    this._mode = mode;
    this.viewport.className = `iframe-viewport ${mode}-mode`;
  }

  setMode(mode) {
    this.mode = mode; // Use property setter (triggers setAttribute)
  }

  // Zoom methods
  zoomIn() {
    this.zoom = Math.min(this.zoom + CONSTRAINTS.ZOOM.STEP, CONSTRAINTS.ZOOM.MAX);
    this.updateTransform();
    this.updateIndicators();
  }

  zoomOut() {
    this.zoom = Math.max(this.zoom - CONSTRAINTS.ZOOM.STEP, CONSTRAINTS.ZOOM.MIN);
    this.updateTransform();
    this.updateIndicators();
  }

  // Pan methods
  resetPan() {
    this.panX = 0;
    this.panY = 0;
    this.updateTransform();
    this.updateIndicators();
  }

  startDrag(e) {
    if (this._mode !== 'move') return;
    if (this.isResizing) return;
    if (e.target.classList.contains('resize-handle')) return;

    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.startPanX = this.panX;
    this.startPanY = this.panY;
    this.viewport.classList.add('grabbing');
  }

  drag(e) {
    if (this.isDragging) {
      const deltaX = e.clientX - this.dragStartX;
      const deltaY = e.clientY - this.dragStartY;
      this.panX = this.startPanX + deltaX;
      this.panY = this.startPanY + deltaY;
      this.updateTransform();
      this.updateIndicators();
    } else if (this.isResizing) {
      this.doResize(e.clientX, e.clientY);
    }
  }

  endDrag() {
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
    this.viewport.classList.remove('grabbing');
  }

  // Touch drag methods
  startDragTouch(e) {
    if (this._mode !== 'move') return;
    if (this.isResizing) return;
    if (e.target.classList.contains('resize-handle')) return;

    e.preventDefault();
    const touch = e.touches[0];
    this.isDragging = true;
    this.dragStartX = touch.clientX;
    this.dragStartY = touch.clientY;
    this.startPanX = this.panX;
    this.startPanY = this.panY;
    this.viewport.classList.add('grabbing');
  }

  dragTouch(e) {
    if (this.isDragging) {
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.dragStartX;
      const deltaY = touch.clientY - this.dragStartY;
      this.panX = this.startPanX + deltaX;
      this.panY = this.startPanY + deltaY;
      this.updateTransform();
      this.updateIndicators();
    } else if (this.isResizing) {
      e.preventDefault();
      const touch = e.touches[0];
      this.doResize(touch.clientX, touch.clientY);
    }
  }

  // Resize methods
  startResize(e, handle) {
    e.stopPropagation();
    this.isResizing = true;
    this.resizeHandle = handle;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.startWidth = this.frameWidth;
    this.startHeight = this.frameHeight;
    this.startPanX = this.panX;
    this.startPanY = this.panY;
  }

  doResize(clientX, clientY) {
    const deltaX = clientX - this.dragStartX;
    const deltaY = clientY - this.dragStartY;

    let newWidth = this.startWidth;
    let newHeight = this.startHeight;
    let newPanX = this.startPanX;
    let newPanY = this.startPanY;

    switch (this.resizeHandle) {
      case 'se':
        newWidth = this.startWidth + deltaX / this.zoom;
        newHeight = this.startHeight + deltaY / this.zoom;
        break;
      case 'sw':
        newWidth = this.startWidth - deltaX / this.zoom;
        newHeight = this.startHeight + deltaY / this.zoom;
        newPanX = this.startPanX + deltaX;
        break;
      case 'ne':
        newWidth = this.startWidth + deltaX / this.zoom;
        newHeight = this.startHeight - deltaY / this.zoom;
        newPanY = this.startPanY + deltaY;
        break;
      case 'nw':
        newWidth = this.startWidth - deltaX / this.zoom;
        newHeight = this.startHeight - deltaY / this.zoom;
        newPanX = this.startPanX + deltaX;
        newPanY = this.startPanY + deltaY;
        break;
    }

    newWidth = Math.max(CONSTRAINTS.WIDTH.MIN, Math.min(newWidth, CONSTRAINTS.WIDTH.MAX));
    newHeight = Math.max(CONSTRAINTS.HEIGHT.MIN, Math.min(newHeight, CONSTRAINTS.HEIGHT.MAX));

    this.frameWidth = newWidth;
    this.frameHeight = newHeight;
    this.panX = newPanX;
    this.panY = newPanY;

    this.iframe.width = this.frameWidth;
    this.iframe.height = this.frameHeight;

    this.querySelector('.width-input').value = Math.round(this.frameWidth);
    this.querySelector('.height-input').value = Math.round(this.frameHeight);

    this.updateTransform();
    this.updateIndicators();
  }

  // Touch resize start
  startResizeTouch(e, handle) {
    e.stopPropagation();
    e.preventDefault();
    const touch = e.touches[0];
    this.isResizing = true;
    this.resizeHandle = handle;
    this.dragStartX = touch.clientX;
    this.dragStartY = touch.clientY;
    this.startWidth = this.frameWidth;
    this.startHeight = this.frameHeight;
    this.startPanX = this.panX;
    this.startPanY = this.panY;
  }

  // Size and position updates
  updateSize(width, height) {
    this.frameWidth = Math.max(CONSTRAINTS.WIDTH.MIN, Math.min(width, CONSTRAINTS.WIDTH.MAX));
    this.frameHeight = Math.max(CONSTRAINTS.HEIGHT.MIN, Math.min(height, CONSTRAINTS.HEIGHT.MAX));
    this.iframe.width = this.frameWidth;
    this.iframe.height = this.frameHeight;
    this.querySelector('.width-input').value = this.frameWidth;
    this.querySelector('.height-input').value = this.frameHeight;
  }

  updatePosition(x, y) {
    this.panX = x;
    this.panY = y;
    this.updateTransform();
    this.updateIndicators();
  }

  loadUrl() {
    const url = this.urlInput.value.trim();
    if (url) {
      this.frameUrl = url;
      this.iframe.src = url;
      this.setAttribute('url', url);
    }
  }

  updateTransform() {
    this.iframeContainer.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
  }

  updateIndicators() {
    this.zoomInput.value = Math.round(this.zoom * 100);
    this.xInput.value = Math.round(this.panX);
    this.yInput.value = Math.round(this.panY);
  }
}

// Register the custom element
customElements.define('iframe-preview', IframePreview);
