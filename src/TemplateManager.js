class PatternLibrary {
    constructor() {
        this.patterns = [
            { id: '1', name: 'pattern 1' },
            { id: '2', name: 'pattern 2' },
            { id: '3', name: 'pattern 3' }
        ];
        this.activePattern = null;
        this.nextPatternId = 4;
        
        this.initializeEventHandlers();
        this.renderPatterns();
    }

    initializeEventHandlers() {
        document.getElementById('addTemplate').addEventListener('click', () => {
            this.addNewPattern();
        });

        document.getElementById('removeTemplate').addEventListener('click', () => {
            this.removeActivePattern();
        });

        const editInput = document.getElementById('editTemplateInput');
        
        editInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.savePatternChanges();
            }
        });

        editInput.addEventListener('blur', () => {
            this.savePatternChanges();
        });
    }

    renderPatterns() {
        const patternsList = document.getElementById('templatesList');
        patternsList.innerHTML = '';

        this.patterns.forEach(pattern => {
            const patternElement = document.createElement('div');
            patternElement.className = 'template-item';
            patternElement.textContent = pattern.name;
            patternElement.dataset.templateId = pattern.id;

            if (this.activePattern && this.activePattern.id === pattern.id) {
                patternElement.classList.add('selected');
                document.getElementById('editTemplateInput').value = pattern.name;
            }

            patternElement.addEventListener('click', () => {
                this.selectPattern(pattern);
            });

            patternsList.appendChild(patternElement);
        });

        this.refreshAllDropdowns();
    }

    selectPattern(pattern) {
        this.activePattern = pattern;
        this.renderPatterns();
    }

    addNewPattern() {
        const newPattern = {
            id: this.nextPatternId.toString(),
            name: 'pattern'
        };
        this.patterns.push(newPattern);
        this.nextPatternId++;
        this.activePattern = newPattern;
        this.renderPatterns();
        
        setTimeout(() => {
            const editInput = document.getElementById('editTemplateInput');
            editInput.focus();
            editInput.select();
        }, 0);
    }

    removeActivePattern() {
        if (!this.activePattern) {
            return;
        }

        const patternId = this.activePattern.id;
        this.patterns = this.patterns.filter(pattern => pattern.id !== patternId);
        this.activePattern = null;
        
        document.getElementById('editTemplateInput').value = '';
        
        this.renderPatterns();
        
        document.dispatchEvent(new CustomEvent('template-removed', {
            detail: { templateId: patternId }
        }));
    }

    savePatternChanges() {
        if (!this.activePattern) {
            return;
        }

        const editInput = document.getElementById('editTemplateInput');
        const newName = editInput.value.trim();
        
        if (newName) {
            this.activePattern.name = newName;
            this.renderPatterns();
        }
    }

    getTemplates() {
        return [...this.patterns];
    }

    getTemplateById(id) {
        return this.patterns.find(pattern => pattern.id === id);
    }

    refreshAllDropdowns() {
        console.log('Refreshing all dropdowns...');
        
        const dropdowns = document.querySelectorAll('custom-dropdown');
        console.log('Main document dropdowns:', dropdowns.length);
        dropdowns.forEach(dropdown => {
            if (dropdown.refresh) {
                dropdown.refresh();
            }
        });

        if (window.tinymce && window.tinymce.activeEditor) {
            const editor = window.tinymce.activeEditor;
            const iframeDoc = editor.getDoc();
            if (iframeDoc) {
                const iframeDropdowns = iframeDoc.querySelectorAll('custom-dropdown');
                console.log('TinyMCE iframe dropdowns:', iframeDropdowns.length);
                iframeDropdowns.forEach(dropdown => {
                    if (dropdown.refresh) {
                        dropdown.refresh();
                    }
                    if (dropdown.updateDropdown) {
                        dropdown.updateDropdown();
                    }
                });
                
                const nonActiveDropdowns = iframeDoc.querySelectorAll('custom-dropdown:not(:defined)');
                if (nonActiveDropdowns.length > 0) {
                    console.log('Found non-active dropdowns, triggering activation...');
                    if (window.contentEditorHub && window.contentEditorHub.activateDropdownComponents) {
                        window.contentEditorHub.activateDropdownComponents();
                    }
                }
            }
        }
    }
}

export default PatternLibrary; 