// UI management for Wordle.cz Solver using Web Components
import { normalizeCzechText } from './algorithm.js';
import { validateWordInput, validateGreenLetterConstraints, validateWordAddition, normalizeAndValidateWord } from './validation.js';
import { generateShareableUrl, restoreGameStateFromUrl, hasGameStateInUrl } from './url-state.js';

export class WordleUI {
    constructor() {
        // Cache DOM elements
        this.grid = document.getElementById('wordle-grid');
        this.wordInput = document.getElementById('word-input');
        this.suggestionList = document.getElementById('suggestion-list');
        this.suggestionsSection = document.getElementById('suggestions');
        this.showMoreBtn = document.getElementById('show-more-btn');
        this.copyUrlBtn = document.getElementById('copy-url-btn');
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
            
            // Auto-set green letters based on existing constraints
            this.#autoSetGreenLetters(e.detail.word);
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
        
        // Copy URL link click
        this.copyUrlBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.#handleCopyUrl();
        });
    }

    /**
     * Add a word to the grid using web components
     * @param {string} word - 5-letter word to add
     * @returns {boolean} Success status
     */
    addWord(word) {
        // Validate word addition
        const additionResult = validateWordAddition(this.grid.words.length);
        if (!additionResult.isValid) {
            this.wordInput.setCustomValidity(additionResult.message);
            this.wordInput.reportValidity();
            return false;
        }

        try {
            const wordRow = this.grid.addWord(word);
            
            // Apply pending green positions if any
            if (this.pendingGreenPositions && Object.keys(this.pendingGreenPositions).length > 0) {
                this.#applyPendingGreenPositions(wordRow);
                this.pendingGreenPositions = null; // Clear after applying
            }
            
            return true;
        } catch (error) {
            this.wordInput.setCustomValidity(error.message);
            this.wordInput.reportValidity();
            return false;
        }
    }

    /**
     * Handle copy URL link click
     */
    async #handleCopyUrl() {
        try {
            const shareableURL = this.#generateShareableURL();
            await navigator.clipboard.writeText(shareableURL);
        } catch (error) {
            console.error('Failed to copy URL:', error);
        }
    }
    
    
    /**
     * Generate shareable URL with current game state
     * @returns {string} Full shareable URL
     */
    #generateShareableURL() {
        const wordRows = [...this.grid.querySelectorAll('word-row')];
        return generateShareableUrl(this.grid.words, wordRows);
    }

    /**
     * Get current constraints from the grid
     * @returns {Object} Constraints object
     */
    getConstraints() {
        return this.grid.getConstraints();
    }

    /**
     * Validate green letter constraints for Wordle rules
     * @returns {boolean} True if valid, false if conflicting green letters exist
     */
    validateGreenLetters() {
        const wordRows = [...this.grid.querySelectorAll('word-row')];
        const result = validateGreenLetterConstraints(wordRows);
        return result.isValid;
    }

    /**
     * Show validation warning in the suggestion list
     */
    showValidationWarning() {
        this.suggestionList.innerHTML = '<div class="callout warning" style="grid-column: 1 / -1;">Neplatná kombinace: Zelená písmena na stejné pozici musí být stejná.</div>';
        this.showMoreBtn.hidden = true;
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
            this.suggestionList.innerHTML = '<div class="callout" style="grid-column: 1 / -1;">Žádná slova nebyla nalezena.</div>';
            this.showMoreBtn.hidden = true;
        } else {
            const wordsToShow = this.allSuggestions.slice(0, this.displayLimit);
            
            wordsToShow.forEach(word => {
                const item = document.createElement('suggestion-item');
                item.textContent = word;
                this.suggestionList.appendChild(item);
            });
            
            // Show/hide "show more" button
            if (this.allSuggestions.length > this.displayLimit) {
                this.showMoreBtn.hidden = false;
                const remaining = this.allSuggestions.length - this.displayLimit;
                this.showMoreBtn.textContent = `Zobrazit dalších ${remaining} slov`;
            } else {
                this.showMoreBtn.hidden = true;
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
        
        const result = await validateWordInput(word, this.solver);
        
        if (!result.isValid) {
            this.wordInput.setCustomValidity(result.message);
            this.wordInput.reportValidity();
            return false;
        }
        
        return true;
    }
    
    /**
     * Show suggestions panel
     */
    showSuggestionsPanel() {
        this.suggestionsSection.hidden = false;
    }
    
    /**
     * Auto-set green letters when clicking a suggestion based on existing green constraints
     * @param {string} suggestionWord - The clicked suggestion word
     */
    #autoSetGreenLetters(suggestionWord) {
        // Get current constraints to find existing green letters
        const constraints = this.getConstraints();
        const normalizedSuggestion = normalizeCzechText(suggestionWord.toLowerCase());
        
        // If there are no green constraints, nothing to auto-set
        if (Object.keys(constraints.green).length === 0) {
            return;
        }
        
        // Store positions that should be green when the word is added
        this.pendingGreenPositions = {};
        
        // Check each green constraint
        Object.entries(constraints.green).forEach(([position, letter]) => {
            const pos = parseInt(position);
            const suggestionLetter = normalizedSuggestion[pos];
            
            // If the suggestion has the same letter at the same position, mark it for auto-green
            if (suggestionLetter === letter.toLowerCase()) {
                this.pendingGreenPositions[pos] = letter;
            }
        });
    }
    
    /**
     * Apply pending green positions to the newly added word row
     * @param {WordRow} wordRow - The word row element
     */
    #applyPendingGreenPositions(wordRow) {
        const letterBoxes = wordRow.getLetterBoxes();
        
        Object.entries(this.pendingGreenPositions).forEach(([position, letter]) => {
            const pos = parseInt(position);
            const letterBox = letterBoxes[pos];
            
            if (letterBox) {
                // Set the letter box to green state (state 3 = green)
                letterBox.setAttribute('state', '3');
                
                // Dispatch state change event to maintain consistency
                letterBox.dispatchEvent(new CustomEvent('state-change', {
                    detail: {
                        letter: letterBox.letter,
                        state: 'green',
                        col: pos
                    },
                    bubbles: true
                }));
            }
        });
    }
    
    
    
    /**
     * Restore game state from URL parameters
     */
    restoreFromURL() {
        if (!hasGameStateInUrl()) return;
        
        const restored = restoreGameStateFromUrl(this.grid, (error, word) => {
            console.warn('Failed to restore word:', word, error);
        });
        
        if (restored) {
            // Show suggestions panel
            this.showSuggestionsPanel();
            
            // Trigger solver update if available
            if (this.solver) {
                this.#triggerSolverUpdate();
            }
        }
    }
    
    /**
     * Trigger solver update - dispatches event to be handled by app
     */
    #triggerSolverUpdate() {
        // Dispatch a custom event that the app can listen to
        document.dispatchEvent(new CustomEvent('solver-update-needed'));
    }
}