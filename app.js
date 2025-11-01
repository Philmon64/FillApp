// FilApp - Main Application JavaScript

class FilApp {
    constructor() {
        this.currentNote = null;
        this.notes = {};
        this.notebooks = {};
        this.settings = {
            theme: 'light',
            autoSync: false,
            autoExportPDF: true,
            syncPath: '',
            claudeApiKey: ''
        };
        this.graphNodes = [];
        this.graphEdges = [];
        this.isDrawing = false;
        this.drawingContext = null;
        this.codeEditor = null;
        
        this.init();
    }
    
    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.setupEditor();
        this.setupDrawingCanvas();
        this.setupCodeEditor();
        this.applyTheme();
        this.updateNotebookTree();
        this.startAutoSave();
        
        // Initialize with a default note if none exists
        if (Object.keys(this.notes).length === 0) {
            this.createNewNote();
        }
    }
    
    // Storage Management
    loadFromStorage() {
        const savedNotes = localStorage.getItem('filapp_notes');
        const savedNotebooks = localStorage.getItem('filapp_notebooks');
        const savedSettings = localStorage.getItem('filapp_settings');
        
        if (savedNotes) {
            this.notes = JSON.parse(savedNotes);
        }
        
        if (savedNotebooks) {
            this.notebooks = JSON.parse(savedNotebooks);
        } else {
            // Create default notebook
            this.notebooks = {
                'default': {
                    id: 'default',
                    name: 'My Notebook',
                    notes: [],
                    created: new Date().toISOString()
                }
            };
        }
        
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
    }
    
    saveToStorage() {
        localStorage.setItem('filapp_notes', JSON.stringify(this.notes));
        localStorage.setItem('filapp_notebooks', JSON.stringify(this.notebooks));
        localStorage.setItem('filapp_settings', JSON.stringify(this.settings));
        
        // Update last saved time
        document.getElementById('lastSaved').textContent = `Last saved: ${new Date().toLocaleTimeString()}`;
        
        // Auto-export to PDF if enabled
        if (this.settings.autoExportPDF && this.currentNote) {
            this.exportToPDF(true); // Silent export
        }
    }
    
    // Event Listeners Setup
    setupEventListeners() {
        // Sidebar
        document.getElementById('toggleSidebar').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('addNotebook').addEventListener('click', () => this.createNewNotebook());
        document.getElementById('searchNotes').addEventListener('input', (e) => this.searchNotes(e.target.value));
        
        // Toolbar
        document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.dataset.command;
                document.execCommand(command, false, null);
                this.saveCurrentNote();
            });
        });
        
        document.getElementById('fontFamily').addEventListener('change', (e) => {
            document.execCommand('fontName', false, e.target.value);
        });
        
        document.getElementById('fontSize').addEventListener('change', (e) => {
            document.execCommand('fontSize', false, e.target.value);
        });
        
        document.getElementById('colorPicker').addEventListener('input', (e) => {
            document.execCommand('foreColor', false, e.target.value);
        });
        
        // Special toolbar buttons
        document.getElementById('insertLink').addEventListener('click', () => this.insertLink());
        document.getElementById('insertImage').addEventListener('click', () => this.insertImage());
        document.getElementById('insertPDF').addEventListener('click', () => this.insertPDF());
        document.getElementById('insertCode').addEventListener('click', () => this.showCodeModal());
        document.getElementById('insertTable').addEventListener('click', () => this.insertTable());
        document.getElementById('drawBtn').addEventListener('click', () => this.toggleDrawingMode());
        document.getElementById('highlightBtn').addEventListener('click', () => this.toggleHighlight());
        document.getElementById('exportPDF').addEventListener('click', () => this.exportToPDF());
        document.getElementById('syncBtn').addEventListener('click', () => this.syncToCloud());
        
        // Note title
        document.getElementById('noteTitle').addEventListener('input', () => this.saveCurrentNote());
        
        // Footer buttons
        document.getElementById('graphViewBtn').addEventListener('click', () => this.showGraphView());
        document.getElementById('calendarBtn').addEventListener('click', () => this.showCalendar());
        document.getElementById('claudeBtn').addEventListener('click', () => this.showClaude());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        
        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('show');
            });
        });
        
        // File inputs
        document.getElementById('imageInput').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('pdfInput').addEventListener('change', (e) => this.handlePDFUpload(e));
        
        // Settings
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        
        // Claude
        document.getElementById('sendToClaude').addEventListener('click', () => this.sendToClaude());
        document.getElementById('claudeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendToClaude();
            }
        });
        
        // Code Editor
        document.getElementById('runCode').addEventListener('click', () => this.runCode());
        document.getElementById('insertCodeBlock').addEventListener('click', () => this.insertCodeToNote());
        
        // Graph View
        document.getElementById('resetGraph').addEventListener('click', () => this.resetGraph());
        document.getElementById('togglePhysics').addEventListener('click', () => this.toggleGraphPhysics());
        
        // Calendar
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
        document.getElementById('syncCalendar').addEventListener('click', () => this.syncWithOutlook());
        
        // Context menu for graph
        document.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }
    
    // Editor Setup
    setupEditor() {
        const editor = document.getElementById('editor');
        
        editor.addEventListener('input', () => {
            this.saveCurrentNote();
            this.updateWordCount();
        });
        
        editor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
            document.execCommand('insertHTML', false, text);
        });
    }
    
    // Drawing Canvas Setup
    setupDrawingCanvas() {
        const canvas = document.getElementById('drawingCanvas');
        const ctx = canvas.getContext('2d');
        this.drawingContext = ctx;
        
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        
        const startDrawing = (e) => {
            if (!this.isDrawing) return;
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            lastX = (e.clientX || e.touches[0].clientX) - rect.left;
            lastY = (e.clientY || e.touches[0].clientY) - rect.top;
        };
        
        const draw = (e) => {
            if (!isDrawing || !this.isDrawing) return;
            
            const rect = canvas.getBoundingClientRect();
            const currentX = (e.clientX || e.touches[0].clientX) - rect.left;
            const currentY = (e.clientY || e.touches[0].clientY) - rect.top;
            
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(currentX, currentY);
            ctx.strokeStyle = document.getElementById('colorPicker').value;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            lastX = currentX;
            lastY = currentY;
        };
        
        const stopDrawing = () => {
            isDrawing = false;
            if (this.isDrawing) {
                this.saveDrawingToNote();
            }
        };
        
        // Mouse events
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        
        // Touch events for iPad/tablet
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startDrawing(e);
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            draw(e);
        });
        canvas.addEventListener('touchend', stopDrawing);
    }
    
    // Code Editor Setup
    setupCodeEditor() {
        if (typeof CodeMirror !== 'undefined') {
            this.codeEditor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
                lineNumbers: true,
                mode: 'javascript',
                theme: 'monokai',
                autoCloseBrackets: true,
                matchBrackets: true,
                indentUnit: 4,
                tabSize: 4,
                lineWrapping: true
            });
        }
    }
    
    // Note Management
    createNewNote(notebookId = 'default') {
        const noteId = this.generateId();
        const note = {
            id: noteId,
            title: 'Untitled Note',
            content: '<p>Start typing your note here...</p>',
            notebook: notebookId,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            tags: [],
            linkedNotes: []
        };
        
        this.notes[noteId] = note;
        this.notebooks[notebookId].notes.push(noteId);
        this.currentNote = noteId;
        this.loadNote(noteId);
        this.updateNotebookTree();
        this.saveToStorage();
        
        return noteId;
    }
    
    loadNote(noteId) {
        const note = this.notes[noteId];
        if (!note) return;
        
        this.currentNote = noteId;
        document.getElementById('noteTitle').value = note.title;
        document.getElementById('editor').innerHTML = note.content;
        this.updateWordCount();
        
        // Highlight active note in sidebar
        document.querySelectorAll('.tree-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.noteId === noteId) {
                item.classList.add('active');
            }
        });
    }
    
    saveCurrentNote() {
        if (!this.currentNote) return;
        
        const note = this.notes[this.currentNote];
        note.title = document.getElementById('noteTitle').value;
        note.content = document.getElementById('editor').innerHTML;
        note.modified = new Date().toISOString();
        
        this.saveToStorage();
    }
    
    deleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this note?')) return;
        
        const note = this.notes[noteId];
        const notebook = this.notebooks[note.notebook];
        
        // Remove from notebook
        notebook.notes = notebook.notes.filter(id => id !== noteId);
        
        // Delete note
        delete this.notes[noteId];
        
        // Load another note or create new one
        if (this.currentNote === noteId) {
            const remainingNotes = Object.keys(this.notes);
            if (remainingNotes.length > 0) {
                this.loadNote(remainingNotes[0]);
            } else {
                this.createNewNote();
            }
        }
        
        this.updateNotebookTree();
        this.saveToStorage();
    }
    
    // Notebook Management
    createNewNotebook() {
        const name = prompt('Enter notebook name:');
        if (!name) return;
        
        const notebookId = this.generateId();
        this.notebooks[notebookId] = {
            id: notebookId,
            name: name,
            notes: [],
            created: new Date().toISOString()
        };
        
        this.updateNotebookTree();
        this.saveToStorage();
    }
    
    updateNotebookTree() {
        const treeContent = document.getElementById('treeContent');
        treeContent.innerHTML = '';
        
        Object.values(this.notebooks).forEach(notebook => {
            const notebookEl = document.createElement('div');
            notebookEl.className = 'tree-folder';
            notebookEl.innerHTML = `
                <div class="tree-item" data-notebook-id="${notebook.id}">
                    <i class="fas fa-folder"></i>
                    ${notebook.name}
                </div>
                <div class="tree-children">
                    ${notebook.notes.map(noteId => {
                        const note = this.notes[noteId];
                        if (!note) return '';
                        return `
                            <div class="tree-item" data-note-id="${noteId}">
                                <i class="fas fa-file-alt"></i>
                                ${note.title}
                            </div>
                        `;
                    }).join('')}
                    <div class="tree-item" data-new-note="${notebook.id}">
                        <i class="fas fa-plus"></i>
                        New Note
                    </div>
                </div>
            `;
            
            treeContent.appendChild(notebookEl);
        });
        
        // Add click handlers
        document.querySelectorAll('[data-note-id]').forEach(el => {
            el.addEventListener('click', () => this.loadNote(el.dataset.noteId));
            el.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (confirm('Delete this note?')) {
                    this.deleteNote(el.dataset.noteId);
                }
            });
        });
        
        document.querySelectorAll('[data-new-note]').forEach(el => {
            el.addEventListener('click', () => this.createNewNote(el.dataset.newNote));
        });
    }
    
    // Search Functionality
    searchNotes(query) {
        if (!query) {
            this.updateNotebookTree();
            return;
        }
        
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        Object.values(this.notes).forEach(note => {
            if (note.title.toLowerCase().includes(lowerQuery) || 
                note.content.toLowerCase().includes(lowerQuery)) {
                results.push(note);
            }
        });
        
        // Display search results
        const treeContent = document.getElementById('treeContent');
        treeContent.innerHTML = `
            <div class="tree-folder">
                <div class="tree-item">
                    <i class="fas fa-search"></i>
                    Search Results (${results.length})
                </div>
                <div class="tree-children">
                    ${results.map(note => `
                        <div class="tree-item" data-note-id="${note.id}">
                            <i class="fas fa-file-alt"></i>
                            ${note.title}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Re-add click handlers
        document.querySelectorAll('[data-note-id]').forEach(el => {
            el.addEventListener('click', () => this.loadNote(el.dataset.noteId));
        });
    }
    
    // Export Functionality
    async exportToPDF(silent = false) {
        if (typeof window.jspdf === 'undefined') {
            if (!silent) alert('PDF library not loaded. Please check your internet connection.');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const title = document.getElementById('noteTitle').value;
        const content = document.getElementById('editor').innerText;
        
        // Add title
        doc.setFontSize(20);
        doc.text(title, 20, 20);
        
        // Add content
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(content, 170);
        doc.text(splitText, 20, 40);
        
        // Save
        const filename = `${title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        if (silent && this.settings.syncPath) {
            // In a real implementation, this would save to iCloud
            // For now, we'll store in IndexedDB or trigger download
            const pdfBlob = doc.output('blob');
            this.savePDFToCloud(filename, pdfBlob);
        } else {
            doc.save(filename);
            if (!silent) {
                this.showNotification('PDF exported successfully!');
            }
        }
    }
    
    async savePDFToCloud(filename, blob) {
        // This would integrate with iCloud API
        // For now, we'll use IndexedDB as a demonstration
        if ('indexedDB' in window) {
            const db = await this.openDatabase();
            const transaction = db.transaction(['pdfs'], 'readwrite');
            const store = transaction.objectStore('pdfs');
            
            store.put({
                filename: filename,
                blob: blob,
                created: new Date().toISOString(),
                noteId: this.currentNote
            });
        }
    }
    
    async openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('FilAppDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('pdfs')) {
                    db.createObjectStore('pdfs', { keyPath: 'filename' });
                }
            };
        });
    }
    
    // Drawing Functions
    toggleDrawingMode() {
        this.isDrawing = !this.isDrawing;
        const canvas = document.getElementById('drawingCanvas');
        const editor = document.getElementById('editor');
        const drawBtn = document.getElementById('drawBtn');
        
        if (this.isDrawing) {
            // Setup canvas
            const rect = editor.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            canvas.style.display = 'block';
            drawBtn.classList.add('active');
        } else {
            canvas.style.display = 'none';
            drawBtn.classList.remove('active');
        }
    }
    
    saveDrawingToNote() {
        const canvas = document.getElementById('drawingCanvas');
        const dataURL = canvas.toDataURL('image/png');
        
        const img = document.createElement('img');
        img.src = dataURL;
        img.style.maxWidth = '100%';
        
        document.getElementById('editor').appendChild(img);
        this.saveCurrentNote();
        
        // Clear canvas
        this.drawingContext.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Insert Functions
    insertLink() {
        const url = prompt('Enter URL:');
        if (url) {
            const text = prompt('Enter link text:') || url;
            document.execCommand('insertHTML', false, `<a href="${url}" target="_blank">${text}</a>`);
            this.saveCurrentNote();
        }
    }
    
    insertImage() {
        document.getElementById('imageInput').click();
    }
    
    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target.result;
            img.style.maxWidth = '100%';
            document.getElementById('editor').appendChild(img);
            this.saveCurrentNote();
        };
        reader.readAsDataURL(file);
    }
    
    insertPDF() {
        document.getElementById('pdfInput').click();
    }
    
    handlePDFUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const embed = document.createElement('embed');
            embed.src = event.target.result;
            embed.type = 'application/pdf';
            embed.style.width = '100%';
            embed.style.height = '600px';
            document.getElementById('editor').appendChild(embed);
            this.saveCurrentNote();
        };
        reader.readAsDataURL(file);
    }
    
    insertTable() {
        const rows = prompt('Number of rows:', '3');
        const cols = prompt('Number of columns:', '3');
        
        if (rows && cols) {
            let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%;">';
            for (let i = 0; i < parseInt(rows); i++) {
                tableHTML += '<tr>';
                for (let j = 0; j < parseInt(cols); j++) {
                    tableHTML += '<td style="padding: 8px; border: 1px solid #ddd;">&nbsp;</td>';
                }
                tableHTML += '</tr>';
            }
            tableHTML += '</table>';
            document.execCommand('insertHTML', false, tableHTML);
            this.saveCurrentNote();
        }
    }
    
    // Graph View
    showGraphView() {
        document.getElementById('graphModal').classList.add('show');
        this.renderGraph();
    }
    
    renderGraph() {
        const canvas = document.getElementById('graphCanvas');
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Generate nodes from notes
        this.graphNodes = [];
        let index = 0;
        Object.values(this.notes).forEach(note => {
            this.graphNodes.push({
                id: note.id,
                label: note.title,
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: 0,
                vy: 0
            });
            index++;
        });
        
        // Generate edges from linked notes
        this.graphEdges = [];
        Object.values(this.notes).forEach(note => {
            if (note.linkedNotes) {
                note.linkedNotes.forEach(linkedId => {
                    this.graphEdges.push({
                        source: note.id,
                        target: linkedId
                    });
                });
            }
        });
        
        this.animateGraph();
    }
    
    animateGraph() {
        const canvas = document.getElementById('graphCanvas');
        const ctx = canvas.getContext('2d');
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw edges
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 1;
            this.graphEdges.forEach(edge => {
                const sourceNode = this.graphNodes.find(n => n.id === edge.source);
                const targetNode = this.graphNodes.find(n => n.id === edge.target);
                if (sourceNode && targetNode) {
                    ctx.beginPath();
                    ctx.moveTo(sourceNode.x, sourceNode.y);
                    ctx.lineTo(targetNode.x, targetNode.y);
                    ctx.stroke();
                }
            });
            
            // Draw nodes
            this.graphNodes.forEach(node => {
                ctx.fillStyle = '#6200ea';
                ctx.beginPath();
                ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
                ctx.fill();
                
                // Draw label
                if (document.getElementById('showLabels').checked) {
                    ctx.fillStyle = '#000';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(node.label, node.x, node.y - 25);
                }
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    resetGraph() {
        this.renderGraph();
    }
    
    toggleGraphPhysics() {
        // Implementation for physics simulation
        console.log('Toggle physics simulation');
    }
    
    // Calendar
    showCalendar() {
        document.getElementById('calendarModal').classList.add('show');
        this.renderCalendar();
    }
    
    renderCalendar() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        document.getElementById('currentMonth').textContent = 
            new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        
        // Day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            header.style.fontWeight = 'bold';
            grid.appendChild(header);
        });
        
        // Empty cells for alignment
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            grid.appendChild(empty);
        }
        
        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = day;
            
            if (day === now.getDate()) {
                dayEl.classList.add('today');
            }
            
            // Check if there are notes for this day
            const dayDate = new Date(year, month, day).toDateString();
            const hasNotes = Object.values(this.notes).some(note => {
                return new Date(note.created).toDateString() === dayDate ||
                       new Date(note.modified).toDateString() === dayDate;
            });
            
            if (hasNotes) {
                dayEl.classList.add('has-note');
            }
            
            dayEl.addEventListener('click', () => this.showNotesForDate(dayDate));
            grid.appendChild(dayEl);
        }
    }
    
    changeMonth(direction) {
        // Implementation for changing calendar months
        console.log('Change month:', direction);
    }
    
    showNotesForDate(date) {
        console.log('Show notes for date:', date);
    }
    
    syncWithOutlook() {
        alert('Outlook sync feature requires OAuth setup. This would connect to Microsoft Graph API.');
    }
    
    // Claude Integration
    showClaude() {
        document.getElementById('claudeModal').classList.add('show');
    }
    
    async sendToClaude() {
        const input = document.getElementById('claudeInput');
        const message = input.value.trim();
        if (!message) return;
        
        const chatContainer = document.getElementById('claudeChat');
        
        // Add user message
        const userMsg = document.createElement('div');
        userMsg.className = 'chat-message user';
        userMsg.textContent = message;
        chatContainer.appendChild(userMsg);
        
        input.value = '';
        
        // Add assistant response
        const assistantMsg = document.createElement('div');
        assistantMsg.className = 'chat-message assistant';
        assistantMsg.textContent = 'Claude integration requires an API key. Please add your API key in settings.';
        chatContainer.appendChild(assistantMsg);
        
        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // In production, this would call the Claude API
        if (this.settings.claudeApiKey) {
            // await this.callClaudeAPI(message);
        }
    }
    
    // Code Editor
    showCodeModal() {
        document.getElementById('codeModal').classList.add('show');
    }
    
    runCode() {
        const language = document.getElementById('languageSelect').value;
        const code = this.codeEditor.getValue();
        const output = document.getElementById('codeOutput');
        
        output.innerHTML = '<div>Running code...</div>';
        
        try {
            if (language === 'javascript') {
                // Create sandboxed execution
                const result = eval(code);
                output.innerHTML = `<div>Output: ${result}</div>`;
            } else if (language === 'html') {
                const iframe = document.createElement('iframe');
                iframe.style.width = '100%';
                iframe.style.height = '200px';
                iframe.style.border = '1px solid #ccc';
                output.innerHTML = '';
                output.appendChild(iframe);
                iframe.contentDocument.write(code);
            } else {
                output.innerHTML = `<div>Runtime for ${language} not available in browser. Consider using an online compiler API.</div>`;
            }
        } catch (error) {
            output.innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
        }
    }
    
    insertCodeToNote() {
        const language = document.getElementById('languageSelect').value;
        const code = this.codeEditor.getValue();
        
        const codeBlock = document.createElement('div');
        codeBlock.className = 'code-block';
        codeBlock.innerHTML = `
            <div class="code-block-header">
                <span class="code-language">${language}</span>
                <div class="code-actions">
                    <button class="code-btn" onclick="navigator.clipboard.writeText(this.parentElement.parentElement.nextElementSibling.textContent)">Copy</button>
                </div>
            </div>
            <pre><code>${this.escapeHtml(code)}</code></pre>
        `;
        
        document.getElementById('editor').appendChild(codeBlock);
        this.saveCurrentNote();
        document.getElementById('codeModal').classList.remove('show');
    }
    
    // Settings
    showSettings() {
        document.getElementById('settingsModal').classList.add('show');
        
        // Load current settings
        document.getElementById('themeSelect').value = this.settings.theme;
        document.getElementById('autoSync').checked = this.settings.autoSync;
        document.getElementById('autoExportPDF').checked = this.settings.autoExportPDF;
        document.getElementById('syncPath').value = this.settings.syncPath;
        document.getElementById('claudeApiKey').value = this.settings.claudeApiKey;
    }
    
    saveSettings() {
        this.settings.theme = document.getElementById('themeSelect').value;
        this.settings.autoSync = document.getElementById('autoSync').checked;
        this.settings.autoExportPDF = document.getElementById('autoExportPDF').checked;
        this.settings.syncPath = document.getElementById('syncPath').value;
        this.settings.claudeApiKey = document.getElementById('claudeApiKey').value;
        
        this.saveToStorage();
        this.applyTheme();
        
        document.getElementById('settingsModal').classList.remove('show');
        this.showNotification('Settings saved!');
    }
    
    // UI Helper Functions
    toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('collapsed');
    }
    
    toggleHighlight() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            span.style.backgroundColor = 'yellow';
            range.surroundContents(span);
            this.saveCurrentNote();
        }
    }
    
    applyTheme() {
        const theme = this.settings.theme;
        if (theme === 'auto') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        } else {
            document.body.setAttribute('data-theme', theme);
        }
    }
    
    updateWordCount() {
        const text = document.getElementById('editor').innerText;
        const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        document.getElementById('wordCount').textContent = `Words: ${words}`;
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    handleContextMenu(e) {
        // Implementation for context menu
        const selection = window.getSelection().toString();
        if (selection && this.currentNote) {
            e.preventDefault();
            // Add to graph view logic
        }
    }
    
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S: Save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveCurrentNote();
            this.showNotification('Note saved!');
        }
        
        // Ctrl/Cmd + N: New note
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.createNewNote();
        }
        
        // Ctrl/Cmd + F: Search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchNotes').focus();
        }
        
        // Ctrl/Cmd + P: Export PDF
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            this.exportToPDF();
        }
    }
    
    syncToCloud() {
        if (this.settings.autoSync && this.settings.syncPath) {
            // Implementation for cloud sync
            this.showNotification('Syncing to cloud...');
            // In production, this would use iCloud API or similar
            setTimeout(() => {
                this.showNotification('Sync complete!');
            }, 2000);
        } else {
            alert('Please configure cloud sync in settings.');
        }
    }
    
    startAutoSave() {
        setInterval(() => {
            if (this.currentNote) {
                this.saveCurrentNote();
            }
        }, 30000); // Auto-save every 30 seconds
    }
    
    // Utility Functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.filApp = new FilApp();
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => console.log('ServiceWorker registered'))
            .catch(err => console.log('ServiceWorker registration failed'));
    });
}
