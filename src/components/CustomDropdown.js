class CustomDropdown extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.selectedValue = '';
        this.dropdownId = Math.random().toString(36).substr(2, 9);
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    static get observedAttributes() {
        return ['selected-value'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'selected-value') {
            this.selectedValue = newValue;
            this.updateDropdown();
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
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
        `;
    }

    setupEventListeners() {
        const select = this.shadowRoot.getElementById('dropdown');
        select.addEventListener('change', (e) => {
            this.selectedValue = e.target.value;
            this.setAttribute('selected-value', this.selectedValue);
            
            this.dispatchEvent(new CustomEvent('dropdown-change', {
                detail: { 
                    value: this.selectedValue,
                    dropdownId: this.dropdownId 
                },
                bubbles: true
            }));
        });
    }

    updateDropdown() {
        const select = this.shadowRoot.getElementById('dropdown');
        const container = this.shadowRoot.getElementById('container');
        const errorText = this.shadowRoot.getElementById('errorText');
        
        const templates = window.templateManager ? window.templateManager.getTemplates() : [];
        
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

    refresh() {
        this.updateDropdown();
    }

    getDropdownId() {
        return this.dropdownId;
    }

    getSelectedValue() {
        return this.selectedValue;
    }
}

customElements.define('custom-dropdown', CustomDropdown);

export default CustomDropdown; 