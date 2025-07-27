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
        this.copyUrlBtn = document.getElementById('copy-url-btn');
        this.copyFeedback = document.getElementById('copy-feedback');
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
        
        // Copy URL button click
        this.copyUrlBtn.addEventListener('click', () => {
            this.#handleCopyUrl();
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
            const wordRow = this.grid.addWord(word);
            
            // Apply pending green positions if any
            if (this.pendingGreenPositions && Object.keys(this.pendingGreenPositions).length > 0) {
                this.#applyPendingGreenPositions(wordRow);
                this.pendingGreenPositions = null; // Clear after applying
            }
            
            // Update copy button state
            this.#updateCopyButton();
            
            return true;
        } catch (error) {
            this.wordInput.setCustomValidity(error.message);
            this.wordInput.reportValidity();
            return false;
        }
    }

    /**
     * Handle copy URL button click
     */
    async #handleCopyUrl() {
        try {
            const shareableURL = this.#generateShareableURL();
            
            // Copy to clipboard
            await navigator.clipboard.writeText(shareableURL);
            
            // Show feedback
            this.copyFeedback.classList.remove('hidden');
            this.copyFeedback.textContent = 'URL zkopírováno!';
            
            // Hide feedback after 2 seconds
            setTimeout(() => {
                this.copyFeedback.classList.add('hidden');
            }, 2000);
            
        } catch (error) {
            console.error('Failed to copy URL:', error);
            this.copyFeedback.classList.remove('hidden');
            this.copyFeedback.textContent = 'Chyba při kopírování URL';
            this.copyFeedback.style.color = 'var(--red-600)';
            
            setTimeout(() => {
                this.copyFeedback.classList.add('hidden');
                this.copyFeedback.style.color = '';
            }, 3000);
        }
    }
    
    /**
     * Update copy button state based on game state
     */
    #updateCopyButton() {
        const hasWords = this.grid.words.length > 0;
        this.copyUrlBtn.disabled = !hasWords;
    }
    
    /**
     * Generate shareable URL with current game state
     * @returns {string} Full shareable URL
     */
    #generateShareableURL() {
        const slovoParams = this.serializeGameState();
        const url = new URL(window.location.origin + window.location.pathname);
        
        // Add slovo parameters
        slovoParams.forEach(slovo => {
            url.searchParams.append('slovo', slovo);
        });
        
        return url.toString();
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
            const wordExists = await this.solver.wordExists(word);
            
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
     * Serialize current game state to URL parameters
     * @returns {Array} Array of slovo parameters
     */
    serializeGameState() {
        const words = this.grid.words;
        if (words.length === 0) return [];
        
        const wordRows = [...this.grid.querySelectorAll('word-row')];
        const slovoParams = [];
        
        wordRows.forEach((row, index) => {
            const word = words[index];
            const letterBoxes = row.getLetterBoxes();
            const states = letterBoxes.map(box => box.state.toString()).join('');
            slovoParams.push(`${word}${states}`);
        });
        
        return slovoParams;
    }
    
    
    /**
     * Restore game state from URL parameters
     */
    restoreFromURL() {
        const params = new URLSearchParams(window.location.search);
        const slovoParams = params.getAll('slovo');
        
        if (slovoParams.length === 0) return;
        
        // Clear current grid
        this.grid.clear();
        
        // Parse and restore each word
        slovoParams.forEach(slovo => {
            if (slovo.length < 6) return; // Invalid format (5 letters + 5 states minimum)
            
            const word = slovo.slice(0, 5);
            const states = slovo.slice(5);
            
            if (states.length !== 5) return; // Invalid state length
            
            try {
                const wordRow = this.grid.addWord(word);
                const letterBoxes = wordRow.getLetterBoxes();
                
                // Apply states
                letterBoxes.forEach((box, index) => {
                    const state = parseInt(states[index]);
                    if (state >= 0 && state <= 3) {
                        box.setAttribute('state', state.toString());
                    }
                });
            } catch (error) {
                console.warn('Failed to restore word:', word, error);
            }
        });
        
        // Update copy button state
        this.#updateCopyButton();
        
        // Show suggestions panel if we have words
        if (slovoParams.length > 0) {
            this.showSuggestionsPanel();
        }
        
        // Trigger solver update if available
        if (this.solver) {
            this.#triggerSolverUpdate();
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