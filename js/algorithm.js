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
 * Checks if word matches all constraints
 */
function matchesConstraints(wordMeta, constraints) {
    const { chars, letterCounts } = wordMeta;
    const { green = {}, blue = {}, orange = {}, gray = new Set() } = constraints;
    
    // Normalize constraints
    const normalizedGreen = {};
    const normalizedBlue = {};
    const normalizedOrange = {};
    const normalizedGray = new Set();
    
    // Normalize all constraint letters
    Object.entries(green).forEach(([pos, letter]) => {
        normalizedGreen[pos] = normalizeCzechText(letter);
    });
    Object.entries(blue).forEach(([pos, letter]) => {
        normalizedBlue[pos] = normalizeCzechText(letter);
    });
    Object.entries(orange).forEach(([letter, positions]) => {
        normalizedOrange[normalizeCzechText(letter)] = positions;
    });
    [...gray].forEach(letter => {
        normalizedGray.add(normalizeCzechText(letter));
    });
    
    // Check green letters (exact position)
    for (const [pos, letter] of Object.entries(normalizedGreen)) {
        if (chars[pos] !== letter) return false;
    }
    
    // Check blue letters (correct position AND appears elsewhere)
    for (const [pos, letter] of Object.entries(normalizedBlue)) {
        if (chars[pos] !== letter) return false;
        if (letterCounts[letter] <= 1) return false;
    }
    
    // Check orange letters (in word but not at specified positions)
    for (const [letter, wrongPositions] of Object.entries(normalizedOrange)) {
        if (!letterCounts[letter]) return false;
        for (const pos of wrongPositions) {
            if (chars[pos] === letter) return false;
        }
    }
    
    // Check gray letters with special handling for mixed constraints
    const greenLetters = new Set(Object.values(normalizedGreen));
    const blueLetters = new Set(Object.values(normalizedBlue));
    const orangeLetters = new Set(Object.keys(normalizedOrange));
    
    for (const letter of normalizedGray) {
        const isSpecial = greenLetters.has(letter) || 
                         orangeLetters.has(letter) || 
                         blueLetters.has(letter);
        
        if (!isSpecial && letterCounts[letter]) {
            // Letter is only gray - shouldn't appear at all
            return false;
        } else if (isSpecial) {
            // Letter appears in other constraints - check exact count
            let requiredCount = 0;
            
            // Count appearances in green/blue positions
            Object.values(normalizedGreen).forEach(l => {
                if (l === letter) requiredCount++;
            });
            Object.values(normalizedBlue).forEach(l => {
                if (l === letter) requiredCount++;
            });
            
            // Orange means at least one occurrence
            if (orangeLetters.has(letter)) {
                requiredCount = Math.max(requiredCount, 1);
            }
            
            if ((letterCounts[letter] || 0) !== requiredCount) {
                return false;
            }
        }
    }
    
    return true;
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