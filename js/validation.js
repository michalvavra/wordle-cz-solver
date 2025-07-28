// Validation utilities for Wordle solver
import { normalizeCzechText } from './algorithm.js';

/**
 * Validates word input according to Wordle.cz rules
 * @param {string} word - Word to validate
 * @param {Object} solver - Solver instance (optional, for dictionary check)
 * @returns {Promise<Object>} Validation result with isValid flag and message
 */
export async function validateWordInput(word, solver = null) {
    // Check length
    if (word.length !== 5) {
        return {
            isValid: false,
            message: 'Slovo musí mít přesně 5 písmen!'
        };
    }
    
    // Check character set
    if (!/^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]{5}$/.test(word)) {
        return {
            isValid: false,
            message: 'Slovo může obsahovat pouze česká písmena!'
        };
    }
    
    // Check if word exists in dictionary
    if (solver) {
        const wordExists = await solver.wordExists(word);
        if (!wordExists) {
            return {
                isValid: false,
                message: 'Toto slovo není ve slovníku Wordle.cz'
            };
        }
    }
    
    return { isValid: true };
}

/**
 * Validates green letter constraints for Wordle rules
 * Ensures no conflicts: same letter can't be green at different positions
 * @param {NodeList} wordRows - Collection of word-row elements
 * @returns {Object} Validation result with isValid flag and conflictInfo
 */
export function validateGreenLetterConstraints(wordRows) {
    // Track what letter is green at each position across all words
    const positionLetters = {}; // position -> letter
    
    for (const wordRow of wordRows) {
        const letterBoxes = wordRow.getLetterBoxes();
        
        for (let position = 0; position < letterBoxes.length; position++) {
            const box = letterBoxes[position];
            
            if (box.stateString === 'green') {
                const letter = box.letter.toLowerCase();
                
                // Check if this position already has a different green letter
                if (positionLetters[position] && positionLetters[position] !== letter) {
                    return {
                        isValid: false,
                        conflictType: 'position',
                        conflictInfo: {
                            position,
                            existingLetter: positionLetters[position],
                            newLetter: letter
                        }
                    };
                }
                
                // Check if this letter is already green at a different position
                for (const [pos, existingLetter] of Object.entries(positionLetters)) {
                    if (parseInt(pos) !== position && existingLetter === letter) {
                        return {
                            isValid: false,
                            conflictType: 'letter',
                            conflictInfo: {
                                letter,
                                positions: [parseInt(pos), position]
                            }
                        };
                    }
                }
                
                positionLetters[position] = letter;
            }
        }
    }
    
    return { isValid: true };
}

/**
 * Validates that a word can be added to the grid
 * @param {number} currentWordCount - Current number of words in grid
 * @param {number} maxWords - Maximum allowed words (typically 6)
 * @returns {Object} Validation result
 */
export function validateWordAddition(currentWordCount, maxWords = 6) {
    if (currentWordCount >= maxWords) {
        return {
            isValid: false,
            message: `Maximální počet slov je ${maxWords}!`
        };
    }
    
    return { isValid: true };
}

/**
 * Normalizes and validates a Czech word
 * @param {string} word - Input word
 * @returns {Object} Result with normalized word and validation status  
 */
export function normalizeAndValidateWord(word) {
    if (!word || typeof word !== 'string') {
        return {
            isValid: false,
            message: 'Neplatný vstup'
        };
    }
    
    const trimmed = word.trim().toUpperCase();
    const normalized = normalizeCzechText(trimmed).toUpperCase();
    
    return {
        isValid: true,
        original: trimmed,
        normalized: normalized
    };
}