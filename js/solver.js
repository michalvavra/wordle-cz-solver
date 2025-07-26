// Solver logic for Wordle.cz
import { filterWords, loadWordsFromFile } from './algorithm.js';

export class WordleSolver {
    constructor(words = null) {
        this.words = words || [];
        this.wordsPromise = words ? Promise.resolve(words) : this.loadWords();
    }

    /**
     * Load words asynchronously
     * @returns {Promise<Array>} Promise that resolves to words array
     */
    async loadWords() {
        try {
            this.words = await loadWordsFromFile();
            return this.words;
        } catch (error) {
            console.error('Failed to load words:', error);
            this.words = [];
            return this.words;
        }
    }

    /**
     * Filter words based on constraints - now uses the tested algorithm
     * @param {Object} constraints - Object containing green, blue, orange, and gray constraints
     * @returns {Promise<Array>} Promise that resolves to filtered array of possible words
     */
    async filterWords(constraints) {
        await this.wordsPromise; // Ensure words are loaded
        return filterWords(this.words, constraints);
    }

    /**
     * Score words based on letter frequency
     * @param {Array} words - Array of words to score
     * @returns {Array} Sorted array of words with scores
     */
    scoreWords(words) {
        // Calculate letter frequency
        const letterFreq = {};
        for (const word of words) {
            for (const letter of word.toLowerCase()) {
                letterFreq[letter] = (letterFreq[letter] || 0) + 1;
            }
        }

        // Score each word
        const scoredWords = words.map(word => {
            const uniqueLetters = new Set(word.toLowerCase());
            const score = [...uniqueLetters].reduce((sum, letter) => 
                sum + (letterFreq[letter] || 0), 0
            );
            return { word, score };
        });

        // Sort by score (highest first)
        return scoredWords.sort((a, b) => b.score - a.score);
    }

    /**
     * Get best word suggestions
     * @param {Object} constraints - Filtering constraints
     * @param {number} limit - Maximum number of suggestions
     * @returns {Promise<Array>} Promise that resolves to array of suggested words
     */
    async getSuggestions(constraints, limit = 10) {
        const filtered = await this.filterWords(constraints);
        const scored = this.scoreWords(filtered);
        const suggestions = scored.slice(0, limit).map(item => item.word);
        
        // Validation: ensure all suggestions are 5 letters
        const validSuggestions = suggestions.filter(word => {
            if (word.length !== 5) {
                console.warn(`Invalid suggestion length: "${word}" (${word.length} chars)`);
                return false;
            }
            return true;
        });
        
        if (validSuggestions.length !== suggestions.length) {
            console.warn(`Filtered out ${suggestions.length - validSuggestions.length} invalid suggestions`);
        }
        
        return validSuggestions;
    }
}