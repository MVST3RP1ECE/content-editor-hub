import './styles.css';
import './components/CustomDropdown.js';
import PatternLibrary from './TemplateManager.js';
import tinymce from 'tinymce/tinymce';

import 'tinymce/models/dom';
import 'tinymce/themes/silver';
import 'tinymce/icons/default';

class ContentEditorHub {
    constructor() {
        this.editorInstance = null;
        this.patternLibrary = null;
        this.initialize();
    }

    async initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.configureEditor());
        } else {
            this.configureEditor();
        }
    }

    configureEditor() {
        this.patternLibrary = new PatternLibrary();
        window.patternLibrary = this.patternLibrary; 

        this.initializeEditor();
        this.setupEventHandlers();
    }

    initializeEditor() {
        tinymce.init({
            selector: '#editor',
            height: '100%',
            menubar: false,
            statusbar: false,
            plugins: '',
            toolbar: 'undo redo | bold italic | removeformat',
            
            custom_elements: 'custom-dropdown',
            
            extended_valid_elements: 'custom-dropdown[*]',
            
            verify_html: false,
            
            valid_elements: '*[*]',
            
            inline_elements: 'custom-dropdown',
            
            valid_children: '+body[custom-dropdown],+p[custom-dropdown],+span[custom-dropdown],+strong[custom-dropdown],+em[custom-dropdown]',
            
            content_style: `
                body { 
                    font-family: Inter, Arial, sans-serif; 
                    font-size: 14px; 
                    background-color: #ffffff;
                    color: #333;
                    padding: 10px;
                }
                .tox .tox-tbtn svg {
                    display: block;
                    fill: #fff;
                }
                custom-dropdown {
                    display: inline-block !important;
                    margin: 0 2px;
                    background-color: #ffffff;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    padding: 4px 8px;
                    color: #495057;
                    min-width: 100px;
                    vertical-align: middle;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                custom-dropdown:hover {
                    background-color: #f8f9fa;
                    border-color: #007bff;
                }
                custom-dropdown[data-deletable="backspace"] {
                    outline: 2px solid #dc3545 !important;
                    background-color: #f8d7da !important;
                    border-color: #f5c6cb !important;
                }
                custom-dropdown[data-deletable="delete"] {
                    outline: 2px solid #17a2b8 !important;
                    background-color: #d1ecf1 !important;
                    border-color: #bee5eb !important;
                }
            `,
            setup: (editor) => {
                this.editorInstance = editor;
                
                editor.on('init', () => {
                    console.log('Editor initialized');
                    
                    editor.setContent('There is some text that user typed manually');
                });

                editor.on('keydown', (e) => {
                    if (e.key === 'Delete' || e.key === 'Backspace') {
                        this.processDeletion(e, editor);
                    }
                });

                editor.on('keyup click', (e) => {
                    this.highlightAdjacentDropdowns(editor);
                });

                editor.on('SetContent', (e) => {
                    console.log('Content set:', e.content);
                    setTimeout(() => {
                        this.activateDropdownComponents();
                    }, 100);
                });

                editor.on('PostProcess', (e) => {
                    console.log('Post process:', e.content);
                });
            },
            init_instance_callback: (editor) => {
                console.log('Editor initialized, activating custom dropdowns...');
                this.activateDropdownComponents();
            }
        });
    }

    activateDropdownComponents() {
        if (!this.editorInstance) return;

        const editorDocument = this.editorInstance.getDoc();
        const editorWindow = this.editorInstance.getWin();
        
        if (!editorDocument || !editorWindow) {
            console.log('Editor document not ready yet');
            return;
        }

        if (!editorWindow.customElements.get('custom-dropdown')) {
            console.log('Registering custom element in editor iframe...');
            
            const scriptElement = editorDocument.createElement('script');
            scriptElement.textContent = this.getDropdownComponentCode();
            editorDocument.head.appendChild(scriptElement);
        }

        const dropdownElements = editorDocument.querySelectorAll('custom-dropdown');
        console.log('Found dropdowns:', dropdownElements.length);
        
        dropdownElements.forEach(dropdown => {
            if (dropdown.refresh) {
                dropdown.refresh();
            }
        });
    }

    setupEventHandlers() {
        document.getElementById('insertBtn').addEventListener('click', () => {
            this.insertDropdownComponent();
        });

        document.addEventListener('template-removed', (e) => {
            this.handleTemplateRemoval(e.detail.templateId);
        });
    }

    insertDropdownComponent() {
        if (!this.editorInstance) {
            console.error('Editor not initialized');
            return;
        }

        console.log('Inserting custom dropdown...');

        const componentId = 'dropdown_' + Math.random().toString(36).substr(2, 9);
        
        const dropdownHTML = `<custom-dropdown data-dropdown-id="${componentId}">Loading...</custom-dropdown>`;
        
        this.editorInstance.insertContent(dropdownHTML);
        
        console.log('Dropdown HTML inserted:', dropdownHTML);

        setTimeout(() => {
            this.activateDropdownComponents();
            this.patternLibrary.refreshAllDropdowns();
        }, 200);
    }

    processDeletion(e, editor) {
        const selection = editor.selection;
        const selectedNode = selection.getNode();
        const range = selection.getRng();
        
        console.log('Delete key pressed:', e.key);
        
        if (selectedNode.tagName === 'CUSTOM-DROPDOWN' || 
            selectedNode.closest('custom-dropdown')) {
            
            console.log('Deleting selected dropdown');
            const dropdown = selectedNode.tagName === 'CUSTOM-DROPDOWN' ? 
                selectedNode : selectedNode.closest('custom-dropdown');
            
            dropdown.remove();
            e.preventDefault();
            return false;
        }
        
        let targetDropdown = null;
        
        if (e.key === 'Backspace') {
            targetDropdown = this.findAdjacentDropdown(editor, 'before');
        } else if (e.key === 'Delete') {
            targetDropdown = this.findAdjacentDropdown(editor, 'after');
        }
        
        if (targetDropdown) {
            console.log('Deleting dropdown near cursor');
            targetDropdown.remove();
            e.preventDefault();
            return false;
        }
        
        const selectedContent = selection.getContent();
        if (selectedContent && selectedContent.includes('custom-dropdown')) {
            console.log('Deleting selected content with dropdowns');
            return true;
        }
        
        return true;
    }

    findAdjacentDropdown(editor, direction) {
        const selection = editor.selection;
        const range = selection.getRng();
        const container = range.startContainer;
        const offset = range.startOffset;
        
        console.log('Looking for dropdown', direction, 'cursor at offset:', offset);
        
        if (container.nodeType === Node.TEXT_NODE) {
            const parentElement = container.parentElement;
            
            if (direction === 'before' && offset === 0) {
                const prevElement = this.getPreviousElementSibling(container);
                if (prevElement && prevElement.tagName === 'CUSTOM-DROPDOWN') {
                    return prevElement;
                }
            } else if (direction === 'after' && offset === container.length) {
                const nextElement = this.getNextElementSibling(container);
                if (nextElement && nextElement.tagName === 'CUSTOM-DROPDOWN') {
                    return nextElement;
                }
            }
        }
        
        return null;
    }

    getPreviousElementSibling(node) {
        let sibling = node.previousSibling;
        while (sibling) {
            if (sibling.nodeType === Node.ELEMENT_NODE) {
                return sibling;
            }
            sibling = sibling.previousSibling;
        }
        return null;
    }

    getNextElementSibling(node) {
        let sibling = node.nextSibling;
        while (sibling) {
            if (sibling.nodeType === Node.ELEMENT_NODE) {
                return sibling;
            }
            sibling = sibling.nextSibling;
        }
        return null;
    }

    handleTemplateRemoval(templateId) {
        setTimeout(() => {
            this.patternLibrary.refreshAllDropdowns();
            this.activateDropdownComponents();
        }, 100);
    }

    getDropdownComponentCode() {
        return `
            console.log('Defining custom-dropdown in iframe...');
            
            class CustomDropdown extends HTMLElement {
                constructor() {
                    super();
                    this.attachShadow({ mode: 'open' });
                    this.selectedValue = '';
                    this.dropdownId = Math.random().toString(36).substr(2, 9);
                    console.log('CustomDropdown created:', this.dropdownId);
                }

                connectedCallback() {
                    console.log('CustomDropdown connected');
                    this.render();
                    this.setupEventListeners();
                    setTimeout(() => this.updateDropdown(), 100);
                }

                render() {
                    this.shadowRoot.innerHTML = \`
                        <style>
                            :host {
                                display: inline-block !important;
                                position: relative;
                                margin: 0 2px;
                                vertical-align: middle;
                            }
                            
                            .dropdown-container {
                                background-color: #ffffff;
                                border: 1px solid #ced4da;
                                border-radius: 4px;
                                padding: 4px 8px;
                                color: #495057;
                                cursor: pointer;
                                font-size: 12px;
                                min-width: 100px;
                                display: inline-block;
                                vertical-align: middle;
                                white-space: nowrap;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                                transition: all 0.2s ease;
                            }
                            
                            .dropdown-container:hover {
                                background-color: #f8f9fa;
                                border-color: #007bff;
                            }
                            
                            .dropdown-container.error {
                                background-color: #f8d7da;
                                color: #721c24;
                                border-color: #f5c6cb;
                            }
                            
                            select {
                                border: none;
                                background: transparent;
                                color: inherit;
                                font-size: inherit;
                                cursor: pointer;
                                width: 100%;
                                outline: none;
                                vertical-align: middle;
                            }
                            
                            .error-text {
                                font-weight: bold;
                            }
                        </style>
                        <div class="dropdown-container" id="container">
                            <select id="dropdown">
                                <option value="">Выберите элемент</option>
                            </select>
                            <span class="error-text" id="errorText" style="display: none;">ERROR</span>
                        </div>
                    \`;
                }

                setupEventListeners() {
                    const select = this.shadowRoot.getElementById('dropdown');
                    select.addEventListener('change', (e) => {
                        this.selectedValue = e.target.value;
                        this.setAttribute('selected-value', this.selectedValue);
                        console.log('Dropdown value changed:', this.selectedValue);
                    });
                }

                refresh() {
                    this.updateDropdown();
                }

                updateDropdown() {
                    const select = this.shadowRoot.getElementById('dropdown');
                    const container = this.shadowRoot.getElementById('container');
                    const errorText = this.shadowRoot.getElementById('errorText');
                    
                    const templates = window.parent.patternLibrary ? window.parent.patternLibrary.getTemplates() : [];
                    console.log('Updating dropdown with templates:', templates);
                    
                    select.innerHTML = '<option value="">Выберите элемент</option>';
                    
                    templates.forEach(template => {
                        const option = document.createElement('option');
                        option.value = template.id;
                        option.textContent = template.name;
                        if (template.id === this.selectedValue) {
                            option.selected = true;
                        }
                        select.appendChild(option);
                    });

                    const selectedExists = templates.some(template => template.id === this.selectedValue);
                    
                    if (this.selectedValue && !selectedExists) {
                        container.classList.add('error');
                        select.style.display = 'none';
                        errorText.style.display = 'inline';
                    } else {
                        container.classList.remove('error');
                        select.style.display = 'inline';
                        errorText.style.display = 'none';
                    }
                }
            }

            if (!customElements.get('custom-dropdown')) {
                customElements.define('custom-dropdown', CustomDropdown);
                console.log('custom-dropdown defined in iframe');
            } else {
                console.log('custom-dropdown already defined in iframe');
            }
        `;
    }

    highlightAdjacentDropdowns(editor) {
        const editorDoc = editor.getDoc();
        const allDropdowns = editorDoc.querySelectorAll('custom-dropdown');
        allDropdowns.forEach(dropdown => {
            dropdown.style.outline = '';
            dropdown.style.backgroundColor = '';
            dropdown.removeAttribute('data-deletable');
        });

        const beforeDropdown = this.findAdjacentDropdown(editor, 'before');
        const afterDropdown = this.findAdjacentDropdown(editor, 'after');

        if (beforeDropdown) {
            beforeDropdown.style.outline = '2px solid #dc3545';
            beforeDropdown.style.backgroundColor = '#f8d7da';
            beforeDropdown.setAttribute('data-deletable', 'backspace');
            beforeDropdown.setAttribute('title', 'Нажмите Backspace для удаления');
        }

        if (afterDropdown) {
            afterDropdown.style.outline = '2px solid #17a2b8';
            afterDropdown.style.backgroundColor = '#d1ecf1';
            afterDropdown.setAttribute('data-deletable', 'delete');
            afterDropdown.setAttribute('title', 'Нажмите Delete для удаления');
        }

        if (beforeDropdown || afterDropdown) {
            console.log('Dropdown(s) ready for deletion:', {
                backspace: !!beforeDropdown,
                delete: !!afterDropdown
            });
        }
    }
}

const app = new ContentEditorHub();
window.contentEditorHub = app; 