// UI management for Wordle.cz Solver using Web Components
import { normalizeCzechText } from './algorithm.js';

export class WordleUI {
    constructor() {
        // Cache DOM elements
        this.grid = document.getElementById('wordle-grid');
        this.wordInput = document.getElementById('word-input');
        this.suggestionList = document.getElementById('suggestion-list');
        this.suggestionsSection = document.getElementById('suggestions');
        this.showMoreBtn = document.getElementById('show-more-btn');
        this.solver = null; // Will be set by app
        this.allSuggestions = []; // Store all suggestions
        this.displayLimit = 10; // Initial display limit
        
        // Setup event listeners
        this.#setupEventListeners();
    }
    
    /**
     * Set solver instance for word validation
     * @param {WordleSolver} solver - Solver instance
     */
    setSolver(solver) {
        this.solver = solver;
    }

    #setupEventListeners() {
        // Listen for suggestion selections
        document.addEventListener('suggestion-select', (e) => {
            this.wordInput.value = e.detail.word;
            this.wordInput.focus();
        });

        // Clear custom validity when user starts typing
        this.wordInput.addEventListener('input', () => {
            this.wordInput.setCustomValidity('');
        });
        
        // Show more button click
        this.showMoreBtn.addEventListener('click', () => {
            this.displayLimit = this.allSuggestions.length;
            this.#renderSuggestions();
        });
    }

    /**
     * Add a word to the grid using web components
     * @param {string} word - 5-letter word to add
     * @returns {boolean} Success status
     */
    addWord(word) {
        if (!this.grid.canAddWord) {
            this.wordInput.setCustomValidity('Maximální počet slov je 6!');
            this.wordInput.reportValidity();
            return false;
        }

        try {
            this.grid.addWord(word);
            return true;
        } catch (error) {
            this.wordInput.setCustomValidity(error.message);
            this.wordInput.reportValidity();
            return false;
        }
    }

    /**
     * Get current constraints from the grid
     * @returns {Object} Constraints object
     */
    getConstraints() {
        return this.grid.getConstraints();
    }

    /**
     * Display word suggestions using web components
     * @param {Array} suggestions - Array of suggested words
     */
    displaySuggestions(suggestions) {
        this.allSuggestions = suggestions;
        this.displayLimit = 10; // Reset to initial limit
        this.#renderSuggestions();
    }
    
    /**
     * Render suggestions based on current display limit
     */
    #renderSuggestions() {
        this.suggestionList.innerHTML = '';
        
        if (this.allSuggestions.length === 0) {
            this.suggestionList.innerHTML = '<p>Žádná slova nebyla nalezena.</p>';
            this.showMoreBtn.classList.add('hidden');
        } else {
            const wordsToShow = this.allSuggestions.slice(0, this.displayLimit);
            
            wordsToShow.forEach(word => {
                const item = document.createElement('suggestion-item');
                item.textContent = word;
                this.suggestionList.appendChild(item);
            });
            
            // Show/hide "show more" button
            if (this.allSuggestions.length > this.displayLimit) {
                this.showMoreBtn.classList.remove('hidden');
                const remaining = this.allSuggestions.length - this.displayLimit;
                this.showMoreBtn.textContent = `Zobrazit dalších ${remaining} slov`;
            } else {
                this.showMoreBtn.classList.add('hidden');
            }
        }
    }


    /**
     * Validate word input using HTML5 validation
     * @param {string} word - Word to validate
     * @returns {Promise<boolean>} Validation result
     */
    async validateWord(word) {
        // Clear any previous custom validity
        this.wordInput.setCustomValidity('');
        
        if (word.length !== 5) {
            this.wordInput.setCustomValidity('Slovo musí mít přesně 5 písmen!');
            this.wordInput.reportValidity();
            return false;
        }
        
        if (!/^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]{5}$/.test(word)) {
            this.wordInput.setCustomValidity('Slovo může obsahovat pouze česká písmena!');
            this.wordInput.reportValidity();
            return false;
        }
        
        // Check if word exists in database
        if (this.solver) {
            await this.solver.wordsPromise; // Ensure words are loaded
            const normalizedWord = normalizeCzechText(word);
            const wordExists = this.solver.words.includes(normalizedWord);
            
            if (!wordExists) {
                this.wordInput.setCustomValidity('Toto slovo není ve slovníku Wordle.cz');
                this.wordInput.reportValidity();
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Show suggestions panel
     */
    showSuggestionsPanel() {
        this.suggestionsSection.classList.remove('hidden');
    }
}