// Main application file
import { WordleSolver } from './solver.js';
import { WordleUI } from './ui.js';
import './components.js';

// Initialize application
class WordleApp {
    constructor() {
        this.ui = new WordleUI();
        this.solver = new WordleSolver(); // No predefined words - will load from words.txt
        this.initEventListeners();
        // Pass solver to UI for word validation
        this.ui.setSolver(this.solver);
        // Initialize the app after solver is ready
        this.initialize();
    }
    
    async initialize() {
        // Wait for solver to load words
        await this.solver.wordsPromise;
        // Restore state from URL if present (now that solver is ready)
        this.ui.restoreFromURL();
    }

    initEventListeners() {
        // Add word button
        const addWordBtn = document.getElementById('add-word-btn');
        addWordBtn.addEventListener('click', () => this.handleAddWord());

        // Enter key on input
        const wordInput = document.getElementById('word-input');
        wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleAddWord();
            }
        });



        // Letter state changes - automatically solve when letter colors change
        document.addEventListener('state-change', () => {
            this.handleSolve();
        });
        
        // Solver update needed event (e.g., when restoring from URL)
        document.addEventListener('solver-update-needed', () => {
            this.handleSolve();
        });

        // Focus input on load
        wordInput.focus();
    }

    async handleAddWord() {
        try {
            const word = this.ui.wordInput.value.trim().toUpperCase();
            
            if (!await this.ui.validateWord(word)) {
                return;
            }

            if (this.ui.addWord(word)) {
                this.ui.wordInput.value = '';
                this.ui.wordInput.focus();
                // Show suggestions panel when first word is added
                this.ui.showSuggestionsPanel();
                // Automatically show suggestions after adding a word
                await this.handleSolve();
            }
        } catch (error) {
            console.error('Error adding word:', error);
            this.ui.wordInput.setCustomValidity('Došlo k chybě při přidávání slova');
            this.ui.wordInput.reportValidity();
        }
    }

    async handleSolve() {
        const constraints = this.ui.getConstraints();
        try {
            const suggestions = await this.solver.getSuggestions(constraints, 50);
            this.ui.displaySuggestions(suggestions);
        } catch (error) {
            console.error('Error getting suggestions:', error);
            this.ui.displaySuggestions([]);
        }
    }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new WordleApp();
    });
} else {
    new WordleApp();
}