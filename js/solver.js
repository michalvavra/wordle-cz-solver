// Solver logic for Wordle.cz
import { filterWords, loadWordsFromFile, getSuggestions, normalizeCzechText } from './algorithm.js';

export class WordleSolver {
    constructor(words = null) {
        this.wordMetadata = words || [];
        this.wordsPromise = words ? Promise.resolve(words) : this.loadWords();
    }

    /**
     * Load words asynchronously
     */
    async loadWords() {
        try {
            this.wordMetadata = await loadWordsFromFile();
            return this.wordMetadata;
        } catch (error) {
            console.error('Failed to load words:', error);
            this.wordMetadata = [];
            return this.wordMetadata;
        }
    }

    /**
     * Filter words based on constraints
     */
    async filterWords(constraints) {
        await this.wordsPromise;
        return filterWords(this.wordMetadata, constraints);
    }

    /**
     * Get best word suggestions
     */
    async getSuggestions(constraints, limit = 10) {
        await this.wordsPromise;
        const suggestions = getSuggestions(this.wordMetadata, constraints, limit);
        
        // Validate suggestions are 5 letters (safety check)
        return suggestions.filter(word => {
            if (word.length !== 5) {
                console.warn(`Invalid suggestion: "${word}"`);
                return false;
            }
            return true;
        });
    }

    /**
     * Check if a word exists in the database
     */
    async wordExists(word) {
        await this.wordsPromise;
        const normalized = normalizeCzechText(word);
        return this.wordMetadata.some(meta => meta.word === normalized);
    }

    /**
     * Score words based on letter frequency
     * @deprecated Use getSuggestions instead
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
}