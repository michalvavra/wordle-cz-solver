// Wordle.cz word filtering algorithm - Optimized version

/**
 * Normalizes Czech text by removing diacritics and converting to lowercase
 */
export function normalizeCzechText(text) {
    const diacriticMap = {
        'á': 'a', 'Á': 'a', 'č': 'c', 'Č': 'c', 'ď': 'd', 'Ď': 'd',
        'é': 'e', 'É': 'e', 'ě': 'e', 'Ě': 'e', 'í': 'i', 'Í': 'i',
        'ň': 'n', 'Ň': 'n', 'ó': 'o', 'Ó': 'o', 'ř': 'r', 'Ř': 'r',
        'š': 's', 'Š': 's', 'ť': 't', 'Ť': 't', 'ú': 'u', 'Ú': 'u',
        'ů': 'u', 'Ů': 'u', 'ý': 'y', 'Ý': 'y', 'ž': 'z', 'Ž': 'z'
    };
    
    return text.toLowerCase()
        .split('')
        .map(char => diacriticMap[char] || char)
        .join('');
}

// Known invalid words to filter out
const INVALID_WORDS = new Set(['wnd22']);

/**
 * Creates metadata for a word to speed up constraint checking
 */
function createWordMetadata(word) {
    const chars = [...word];
    const letterCounts = {};
    
    for (const letter of chars) {
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    }
    
    return { word, chars, letterCounts };
}

/**
 * Parses concatenated words into array with metadata
 */
export function parseWordsFromContent(content) {
    const words = [];
    
    for (let i = 0; i < content.length; i += 5) {
        const word = content.substring(i, i + 5);
        if (word.length === 5) {
            const normalized = normalizeCzechText(word);
            
            if (!INVALID_WORDS.has(normalized) && normalized.length === 5) {
                words.push(createWordMetadata(normalized));
            }
        }
    }
    
    console.log(`Loaded ${words.length} valid 5-letter words`);
    return words;
}

/**
 * Loads words from file (works in both browser and Node.js)
 */
export async function loadWordsFromFile() {
    try {
        // Node.js environment
        if (typeof window === 'undefined' && typeof process !== 'undefined') {
            const { readFileSync } = await import('fs');
            const { join } = await import('path');
            const content = readFileSync(join(process.cwd(), 'words.txt'), 'utf-8');
            return parseWordsFromContent(content.trim());
        } 
        // Browser environment
        else {
            const response = await fetch('./words.txt');
            const content = await response.text();
            return parseWordsFromContent(content.trim());
        }
    } catch (error) {
        console.error('Failed to load words:', error);
        return [];
    }
}

/**
 * Normalizes constraint objects by applying Czech text normalization
 * @param {Object} constraints - Raw constraints from UI
 * @returns {Object} Normalized constraints
 */
function normalizeConstraints(constraints) {
    const { green = {}, blue = {}, orange = {}, gray = new Set() } = constraints;
    
    const normalizedGreen = Object.fromEntries(
        Object.entries(green).map(([pos, letter]) => [pos, normalizeCzechText(letter)])
    );
    
    const normalizedBlue = Object.fromEntries(
        Object.entries(blue).map(([pos, letter]) => [pos, normalizeCzechText(letter)])
    );
    
    const normalizedOrange = Object.fromEntries(
        Object.entries(orange).map(([letter, positions]) => [normalizeCzechText(letter), positions])
    );
    
    const normalizedGray = new Set([...gray].map(letter => normalizeCzechText(letter)));
    
    return { normalizedGreen, normalizedBlue, normalizedOrange, normalizedGray };
}

/**
 * Check all constraints for a word
 * @param {Object} wordMeta - Word metadata with chars and letterCounts
 * @param {Object} normalizedConstraints - Normalized constraints
 * @returns {Object} Validation result with valid flag and optional reason
 */
function checkConstraints(wordMeta, normalizedConstraints) {
    const { chars, letterCounts } = wordMeta;
    const { normalizedGreen, normalizedBlue, normalizedOrange, normalizedGray } = normalizedConstraints;
    
    // Check position constraints first (most likely to fail fast)
    const positionResult = checkPositionConstraints(chars, normalizedGreen, normalizedBlue);
    if (!positionResult.valid) return positionResult;
    
    // Check orange constraints
    const orangeResult = checkOrangeConstraints(chars, letterCounts, normalizedOrange);
    if (!orangeResult.valid) return orangeResult;
    
    // Check letter count constraints
    const countResult = checkLetterCountConstraints(letterCounts, normalizedGreen, normalizedBlue, normalizedOrange);
    if (!countResult.valid) return countResult;
    
    // Check gray constraints
    const grayResult = checkGrayConstraints(letterCounts, normalizedGray, normalizedGreen, normalizedBlue, normalizedOrange);
    if (!grayResult.valid) return grayResult;
    
    return { valid: true };
}

/**
 * Check green and blue position constraints
 * @param {Array} chars - Word characters array
 * @param {Object} normalizedGreen - Green letter constraints
 * @param {Object} normalizedBlue - Blue letter constraints
 * @returns {Object} Validation result
 */
function checkPositionConstraints(chars, normalizedGreen, normalizedBlue) {
    // Check green letters (exact position)
    for (const [pos, letter] of Object.entries(normalizedGreen)) {
        if (chars[pos] !== letter) {
            return { valid: false, reason: `Green constraint failed: ${letter} not at position ${pos}` };
        }
    }
    
    // Check blue letters (correct position AND appears elsewhere)
    for (const [pos, letter] of Object.entries(normalizedBlue)) {
        if (chars[pos] !== letter) {
            return { valid: false, reason: `Blue position constraint failed: ${letter} not at position ${pos}` };
        }
    }
    
    return { valid: true };
}

/**
 * Check orange constraints (letter in word but not at specified positions)
 * @param {Array} chars - Word characters array
 * @param {Object} letterCounts - Letter count map
 * @param {Object} normalizedOrange - Orange letter constraints
 * @returns {Object} Validation result
 */
function checkOrangeConstraints(chars, letterCounts, normalizedOrange) {
    for (const [letter, wrongPositions] of Object.entries(normalizedOrange)) {
        if (!letterCounts[letter]) {
            return { valid: false, reason: `Orange constraint failed: ${letter} not in word` };
        }
        
        for (const pos of wrongPositions) {
            if (chars[pos] === letter) {
                return { valid: false, reason: `Orange constraint failed: ${letter} at forbidden position ${pos}` };
            }
        }
    }
    
    return { valid: true };
}

/**
 * Check letter count constraints for green and blue letters
 * @param {Object} letterCounts - Letter count map
 * @param {Object} normalizedGreen - Green letter constraints
 * @param {Object} normalizedBlue - Blue letter constraints  
 * @param {Object} normalizedOrange - Orange letter constraints
 * @returns {Object} Validation result
 */
function checkLetterCountConstraints(letterCounts, normalizedGreen, normalizedBlue, normalizedOrange) {
    const greenLetters = new Set(Object.values(normalizedGreen));
    const blueLetters = new Set(Object.values(normalizedBlue));
    const orangeLetters = new Set(Object.keys(normalizedOrange));
    
    // Check green letter counts (exact count)
    for (const letter of greenLetters) {
        const greenCount = Object.values(normalizedGreen).filter(l => l === letter).length;
        const actualCount = letterCounts[letter] || 0;
        
        if (!blueLetters.has(letter) && !orangeLetters.has(letter)) {
            // Pure green - exact count
            if (actualCount !== greenCount) {
                return { valid: false, reason: `Green count constraint failed: ${letter} has ${actualCount}, expected ${greenCount}` };
            }
        } else if (orangeLetters.has(letter) && !blueLetters.has(letter)) {
            // Green + orange: Green overrides - exact count
            if (actualCount !== greenCount) {
                return { valid: false, reason: `Green+orange count constraint failed: ${letter} has ${actualCount}, expected ${greenCount}` };
            }
        }
    }
    
    // Check blue letter counts (minimum count)
    for (const letter of blueLetters) {
        const blueCount = Object.values(normalizedBlue).filter(l => l === letter).length;
        const actualCount = letterCounts[letter] || 0;
        
        // Blue means: appears at positions AND at least once elsewhere
        if (actualCount <= blueCount) {
            return { valid: false, reason: `Blue count constraint failed: ${letter} has ${actualCount}, expected > ${blueCount}` };
        }
    }
    
    return { valid: true };
}

/**
 * Check gray letter constraints
 * @param {Object} letterCounts - Letter count map
 * @param {Set} normalizedGray - Gray letter constraints
 * @param {Object} normalizedGreen - Green letter constraints
 * @param {Object} normalizedBlue - Blue letter constraints
 * @param {Object} normalizedOrange - Orange letter constraints
 * @returns {Object} Validation result
 */
function checkGrayConstraints(letterCounts, normalizedGray, normalizedGreen, normalizedBlue, normalizedOrange) {
    const greenLetters = new Set(Object.values(normalizedGreen));
    const blueLetters = new Set(Object.values(normalizedBlue));
    const orangeLetters = new Set(Object.keys(normalizedOrange));
    
    for (const letter of normalizedGray) {
        const isSpecial = greenLetters.has(letter) || orangeLetters.has(letter) || blueLetters.has(letter);
        
        if (!isSpecial && letterCounts[letter]) {
            // Letter is only gray - shouldn't appear at all
            return { valid: false, reason: `Gray constraint failed: ${letter} appears but should not` };
        } else if (isSpecial) {
            // Letter appears in other constraints - calculate expected count
            let requiredCount = 0;
            
            // Count green occurrences
            if (greenLetters.has(letter)) {
                requiredCount += Object.values(normalizedGreen).filter(l => l === letter).length;
            }
            
            // Count blue occurrences
            if (blueLetters.has(letter)) {
                requiredCount += Object.values(normalizedBlue).filter(l => l === letter).length;
            }
            
            // Orange-only constraint
            if (orangeLetters.has(letter) && !greenLetters.has(letter) && !blueLetters.has(letter)) {
                requiredCount = Math.max(requiredCount, 1);
            }
            
            // Handle mixed constraints
            const actualCount = letterCounts[letter] || 0;
            
            if (greenLetters.has(letter) && !blueLetters.has(letter)) {
                if (actualCount !== requiredCount) {
                    return { valid: false, reason: `Gray+green constraint failed: ${letter} has ${actualCount}, expected ${requiredCount}` };
                }
            } else if (blueLetters.has(letter) && !greenLetters.has(letter)) {
                if (actualCount !== requiredCount) {
                    return { valid: false, reason: `Gray+blue constraint failed: ${letter} has ${actualCount}, expected ${requiredCount}` };
                }
            } else if (!greenLetters.has(letter) && !blueLetters.has(letter) && orangeLetters.has(letter)) {
                if (actualCount !== requiredCount) {
                    return { valid: false, reason: `Gray+orange constraint failed: ${letter} has ${actualCount}, expected ${requiredCount}` };
                }
            }
        }
    }
    
    return { valid: true };
}

/**
 * Checks if word matches all constraints
 * @param {Object} wordMeta - Word metadata with chars and letterCounts
 * @param {Object} constraints - Raw constraints from UI
 * @returns {boolean} True if word matches all constraints
 */
function matchesConstraints(wordMeta, constraints) {
    const normalizedConstraints = normalizeConstraints(constraints);
    const result = checkConstraints(wordMeta, normalizedConstraints);
    return result.valid;
}

/**
 * Generator that yields words matching constraints
 */
export function* filterWordsGenerator(wordMetadata, constraints) {
    for (const wordMeta of wordMetadata) {
        if (matchesConstraints(wordMeta, constraints)) {
            yield wordMeta.word;
        }
    }
}

/**
 * Filters words based on constraints (returns array)
 */
export function filterWords(wordMetadata, constraints) {
    return Array.from(filterWordsGenerator(wordMetadata, constraints));
}

/**
 * Gets best suggestions based on letter frequency scoring
 */
export function getSuggestions(wordMetadata, constraints, limit = 10) {
    // Calculate letter frequencies
    const letterFreq = {};
    for (const meta of wordMetadata) {
        for (const letter of meta.chars) {
            letterFreq[letter] = (letterFreq[letter] || 0) + 1;
        }
    }
    
    // Score function - prefer words with common letters
    const scoreWord = (wordMeta) => {
        const uniqueLetters = new Set(wordMeta.chars);
        return [...uniqueLetters].reduce((sum, letter) => 
            sum + (letterFreq[letter] || 0), 0
        );
    };
    
    // Get matching words with scores
    const matches = [];
    for (const wordMeta of wordMetadata) {
        if (matchesConstraints(wordMeta, constraints)) {
            matches.push({
                word: wordMeta.word,
                score: scoreWord(wordMeta)
            });
            
            // Early exit if we have plenty of matches
            if (matches.length >= limit * 3) break;
        }
    }
    
    // Sort by score and return top suggestions
    return matches
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.word);
}