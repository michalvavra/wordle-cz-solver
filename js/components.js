// Web Components for Wordle.cz Solver

// Letter Box Component
class LetterBox extends HTMLElement {
    #shadowRoot;
    #letter = '';
    #state = 0;
    #col = 0;
    
    static get observedAttributes() {
        return ['letter', 'state', 'col'];
    }

    constructor() {
        super();
        this.#shadowRoot = this.attachShadow({ mode: 'open' });
        this.#shadowRoot.innerHTML = `
            <style>
                :host {
                    width: 62px;
                    height: 62px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    border: 2px solid var(--color-border-subtle, var(--neutral-300));
                    border-radius: 4px;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    user-select: none;
                    background-color: var(--color-background-normal, white);
                    color: var(--color-text-normal, var(--neutral-900));
                    box-sizing: border-box;
                }
                
                :host(.gray) {
                    background-color: var(--wordle-gray);
                    color: var(--color-text-inverse, white);
                    border-color: var(--wordle-gray);
                }
                
                :host(.orange) {
                    background-color: var(--wordle-orange);
                    color: var(--color-text-inverse, white);
                    border-color: var(--wordle-orange);
                }
                
                :host(.blue) {
                    background-color: var(--wordle-blue);
                    color: var(--color-text-inverse, white);
                    border-color: var(--wordle-blue);
                }
                
                :host(.green) {
                    background-color: var(--wordle-green);
                    color: var(--color-text-inverse, white);
                    border-color: var(--wordle-green);
                }
                
                :host(:hover) {
                    transform: scale(1.05);
                    box-shadow: var(--shadow-sm);
                }
                
                @media (max-width: 600px) {
                    :host {
                        width: 50px;
                        height: 50px;
                        font-size: 1.5rem;
                    }
                }
                
                @media (max-width: 400px) {
                    :host {
                        width: 44px;
                        height: 44px;
                        font-size: 1.3rem;
                    }
                }
            </style>
            <slot></slot>
        `;
        
        this.addEventListener('click', this.#handleClick.bind(this));
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'letter':
                this.#letter = newValue;
                this.textContent = newValue;
                break;
            case 'state':
                this.#state = parseInt(newValue);
                this.#updateState();
                break;
            case 'col':
                this.#col = parseInt(newValue);
                break;
        }
    }

    #handleClick() {
        if (!this.#letter) return;
        
        const states = ['gray', 'orange', 'blue', 'green'];
        this.#state = (this.#state + 1) % states.length;
        this.setAttribute('state', this.#state.toString());
        
        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('state-change', {
            detail: {
                letter: this.#letter,
                state: states[this.#state],
                col: this.#col
            },
            bubbles: true
        }));
    }

    #updateState() {
        const states = ['gray', 'orange', 'blue', 'green'];
        // Remove all state classes
        states.forEach(state => this.classList.remove(state));
        // Add current state class
        if (states[this.#state]) {
            this.classList.add(states[this.#state]);
        }
    }

    get letter() { return this.#letter; }
    get state() { return this.#state; }
    get col() { return this.#col; }
    get stateString() {
        const states = ['gray', 'orange', 'blue', 'green'];
        return states[this.#state];
    }
}

// Word Row Component
class WordRow extends HTMLElement {
    #shadowRoot;
    #word = '';
    #rowIndex = 0;

    static get observedAttributes() {
        return ['word', 'row-index'];
    }

    constructor() {
        super();
        this.#shadowRoot = this.attachShadow({ mode: 'open' });
        this.#shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    gap: 0.25rem;
                    justify-content: center;
                }
            </style>
            <slot></slot>
        `;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'word':
                this.#word = newValue.toUpperCase();
                this.#createLetterBoxes();
                break;
            case 'row-index':
                this.#rowIndex = parseInt(newValue);
                break;
        }
    }

    #createLetterBoxes() {
        // Clear existing content
        this.innerHTML = '';
        
        // Create letter boxes for each letter
        [...this.#word].forEach((letter, index) => {
            const letterBox = document.createElement('letter-box');
            letterBox.setAttribute('letter', letter);
            letterBox.setAttribute('state', '0');
            letterBox.setAttribute('col', index.toString());
            letterBox.textContent = letter;
            this.appendChild(letterBox);
        });
    }

    get word() { return this.#word; }
    get rowIndex() { return this.#rowIndex; }
    
    getLetterBoxes() {
        return [...this.querySelectorAll('letter-box')];
    }
}

// Suggestion Item Component
class SuggestionItem extends HTMLElement {
    #shadowRoot;

    constructor() {
        super();
        this.#shadowRoot = this.attachShadow({ mode: 'open' });
        this.#shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    padding: 0.5rem 0.75rem;
                    text-align: center;
                    background-color: var(--color-background-elevation, var(--gray-100));
                    border: 1px solid var(--color-border-subtle, var(--gray-200));
                    border-radius: var(--radius);
                    font-size: 0.875rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    user-select: none;
                    color: var(--color-text-normal);
                }
                
                :host(:hover) {
                    background-color: var(--gray-200, #e5e7eb);
                    border-color: var(--gray-400, #9ca3af);
                    color: black;
                }
                
                /* Dark mode hover */
                @media (prefers-color-scheme: dark) {
                    :host(:hover) {
                        background-color: var(--gray-700, #374151);
                        border-color: var(--gray-600, #4b5563);
                        color: white;
                    }
                }
                
                :host(:active) {
                    background-color: var(--color-accent-emphasis, var(--blue-100, #dbeafe));
                    border-color: var(--color-accent, var(--blue-300, #93c5fd));
                }
            </style>
            <slot></slot>
        `;
        
        this.addEventListener('click', this.#handleClick.bind(this));
    }

    #handleClick() {
        this.dispatchEvent(new CustomEvent('suggestion-select', {
            detail: { word: this.textContent.trim() },
            bubbles: true
        }));
    }
}

// Wordle Grid Component
class WordleGrid extends HTMLElement {
    #shadowRoot;
    #maxWords = 6;
    #words = [];

    constructor() {
        super();
        this.#shadowRoot = this.attachShadow({ mode: 'open' });
        this.#shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    align-items: center;
                }
                
                .empty-row {
                    display: flex;
                    gap: 0.25rem;
                    justify-content: center;
                }
                
                .empty-letter-box {
                    width: 62px;
                    height: 62px;
                    border: 2px solid var(--color-border-muted, var(--gray-200));
                    border-radius: var(--radius);
                    box-sizing: border-box;
                    background-color: transparent;
                }
                
                @media (max-width: 600px) {
                    .empty-letter-box {
                        width: 50px;
                        height: 50px;
                    }
                }
                
                @media (max-width: 400px) {
                    .empty-letter-box {
                        width: 44px;
                        height: 44px;
                    }
                }
            </style>
            <slot></slot>
        `;
        
        // Initialize with 6 empty rows
        this.#initializeEmptyRows();
    }

    #initializeEmptyRows() {
        // Create 6 empty rows
        for (let i = 0; i < this.#maxWords; i++) {
            const emptyRow = document.createElement('div');
            emptyRow.className = 'empty-row';
            emptyRow.setAttribute('data-row-index', i.toString());
            
            // Create 5 empty letter boxes
            for (let j = 0; j < 5; j++) {
                const emptyBox = document.createElement('div');
                emptyBox.className = 'empty-letter-box';
                emptyRow.appendChild(emptyBox);
            }
            
            this.appendChild(emptyRow);
        }
    }

    addWord(word) {
        if (this.#words.length >= this.#maxWords) {
            throw new Error('Maximum number of words reached');
        }

        const rowIndex = this.#words.length;
        this.#words.push(word);
        
        // Find the empty row to replace
        const emptyRow = this.querySelector(`[data-row-index="${rowIndex}"]`);
        
        // Create the word row
        const wordRow = document.createElement('word-row');
        wordRow.setAttribute('word', word);
        wordRow.setAttribute('row-index', rowIndex.toString());
        
        // Replace empty row with word row
        this.replaceChild(wordRow, emptyRow);
        return wordRow;
    }

    clear() {
        this.#words = [];
        this.innerHTML = '';
        this.#initializeEmptyRows();
    }

    getConstraints() {
        const constraints = {
            green: {},
            blue: {},
            orange: {},
            gray: new Set()
        };

        const wordRows = [...this.querySelectorAll('word-row')];
        wordRows.forEach(row => {
            const letterBoxes = row.getLetterBoxes();
            letterBoxes.forEach(box => {
                const letter = box.letter;
                const col = box.col;
                const state = box.stateString;

                switch(state) {
                    case 'green':
                        constraints.green[col] = letter;
                        break;
                    case 'blue':
                        constraints.blue[col] = letter;
                        break;
                    case 'orange':
                        if (!constraints.orange[letter]) {
                            constraints.orange[letter] = [];
                        }
                        constraints.orange[letter].push(col);
                        break;
                    case 'gray':
                        constraints.gray.add(letter);
                        break;
                }
            });
        });

        return constraints;
    }

    get words() { return [...this.#words]; }
    get maxWords() { return this.#maxWords; }
    get canAddWord() { return this.#words.length < this.#maxWords; }
}

// Register custom elements
customElements.define('letter-box', LetterBox);
customElements.define('word-row', WordRow);
customElements.define('suggestion-item', SuggestionItem);
customElements.define('wordle-grid', WordleGrid);

export { LetterBox, WordRow, SuggestionItem, WordleGrid };