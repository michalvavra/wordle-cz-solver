// Wordle.cz word filtering algorithm

/**
 * Normalizes Czech text by removing diacritics and converting to lowercase
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeCzechText(text) {
    const diacriticMap = {
        'á': 'a', 'Á': 'a',
        'č': 'c', 'Č': 'c',
        'ď': 'd', 'Ď': 'd',
        'é': 'e', 'É': 'e',
        'ě': 'e', 'Ě': 'e',
        'í': 'i', 'Í': 'i',
        'ň': 'n', 'Ň': 'n',
        'ó': 'o', 'Ó': 'o',
        'ř': 'r', 'Ř': 'r',
        'š': 's', 'Š': 's',
        'ť': 't', 'Ť': 't',
        'ú': 'u', 'Ú': 'u',
        'ů': 'u', 'Ů': 'u',
        'ý': 'y', 'Ý': 'y',
        'ž': 'z', 'Ž': 'z'
    };
    
    return text
        .toLowerCase()
        .split('')
        .map(char => diacriticMap[char] || char)
        .join('');
}

/**
 * Loads and parses words from words.txt file (Browser version only)
 * @returns {Promise<Array<string>>} Array of 5-letter Czech words
 */
export async function loadWordsFromFile() {
    try {
        const response = await fetch('./words.txt');
        const content = await response.text();
        return parseWordsFromContent(content.trim());
    } catch (error) {
        console.error('Failed to load words from file:', error);
        return [];
    }
}


// Known invalid words in the source words.txt file that should be filtered out
const INVALID_WORDS = new Set([
    'wnd22' // Invalid word containing numbers, appears in source file
]);

/**
 * Parses concatenated words content into array of 5-letter words
 * @param {string} content - Concatenated words string
 * @returns {Array<string>} Array of 5-letter words
 */
export function parseWordsFromContent(content) {
    const words = [];
    let invalidCount = 0;
    
    for (let i = 0; i < content.length; i += 5) {
        const word = content.substring(i, i + 5);
        if (word.length === 5) {
            const normalizedWord = normalizeCzechText(word);
            
            // Filter out known invalid words from the source file
            if (INVALID_WORDS.has(normalizedWord)) {
                console.warn(`Skipping known invalid word: "${word}"`);
                invalidCount++;
                continue;
            }
            
            if (normalizedWord.length === 5) {
                words.push(normalizedWord);
            } else {
                console.warn(`Normalized word has wrong length: "${word}" -> "${normalizedWord}" (${normalizedWord.length} chars)`);
                invalidCount++;
            }
        } else {
            console.warn(`Skipping invalid word length: "${word}" (${word.length} chars) at position ${i}`);
            invalidCount++;
        }
    }
    
    if (invalidCount > 0) {
        console.warn(`Skipped ${invalidCount} invalid words during parsing`);
    }
    
    console.log(`Loaded ${words.length} valid 5-letter words`);
    return words;
}

/**
 * Filters words based on Wordle constraints
 * @param {Array<string>} words - Array of words to filter
 * @param {Object} constraints - Constraint object with green, blue, orange, gray
 * @returns {Array<string>} Filtered words that match all constraints
 */
export function filterWords(words, constraints) {
    const { green = {}, blue = {}, orange = {}, gray = new Set() } = constraints;
    
    // Normalize all constraint letters
    const normalizedConstraints = {
        green: {},
        blue: {},
        orange: {},
        gray: new Set()
    };
    
    // Normalize green constraints
    for (const [pos, letter] of Object.entries(green)) {
        normalizedConstraints.green[pos] = normalizeCzechText(letter);
    }
    
    // Normalize blue constraints
    for (const [pos, letter] of Object.entries(blue)) {
        normalizedConstraints.blue[pos] = normalizeCzechText(letter);
    }
    
    // Normalize orange constraints
    for (const [letter, positions] of Object.entries(orange)) {
        const normalizedLetter = normalizeCzechText(letter);
        normalizedConstraints.orange[normalizedLetter] = positions;
    }
    
    // Normalize gray constraints
    for (const letter of gray) {
        normalizedConstraints.gray.add(normalizeCzechText(letter));
    }
    
    return words.filter(word => {
        // Normalize word for consistent comparison
        const normalizedWord = normalizeCzechText(word);
        const chars = [...normalizedWord];
        
        // Check green letters (exact position match)
        for (const [pos, letter] of Object.entries(normalizedConstraints.green)) {
            const position = parseInt(pos);
            if (chars[position] !== letter) {
                return false;
            }
        }
        
        // Check gray letters
        for (const letter of normalizedConstraints.gray) {
            const isInGreen = Object.values(normalizedConstraints.green).includes(letter);
            const isInOrange = Object.keys(normalizedConstraints.orange).includes(letter);
            const isInBlue = Object.values(normalizedConstraints.blue).includes(letter);
            
            if (!isInGreen && !isInOrange && !isInBlue) {
                // Letter is only gray - it shouldn't appear in the word at all
                if (chars.includes(letter)) {
                    return false;
                }
            } else {
                // Letter is gray AND also green/orange/blue
                // This means the letter appears ONLY in the green/orange/blue positions
                // Count how many times the letter appears in green/blue positions
                let requiredCount = 0;
                for (const [pos, greenLetter] of Object.entries(normalizedConstraints.green)) {
                    if (greenLetter === letter) requiredCount++;
                }
                for (const [pos, blueLetter] of Object.entries(normalizedConstraints.blue)) {
                    if (blueLetter === letter) requiredCount++;
                }
                // For orange, we know it appears at least once
                if (isInOrange) requiredCount = Math.max(requiredCount, 1);
                
                // Count actual occurrences in the word
                const actualCount = chars.filter(c => c === letter).length;
                
                // The word should have exactly the required count
                if (actualCount !== requiredCount) {
                    return false;
                }
            }
        }
        
        // Check orange letters (in word but not at specified positions)
        for (const [letter, wrongPositions] of Object.entries(normalizedConstraints.orange)) {
            // Letter must be in the word
            if (!chars.includes(letter)) {
                return false;
            }
            // Letter must not be at any of the wrong positions
            for (const pos of wrongPositions) {
                if (chars[pos] === letter) {
                    return false;
                }
            }
        }
        
        // Check blue letters (correct position AND appears elsewhere)
        for (const [pos, letter] of Object.entries(normalizedConstraints.blue)) {
            const position = parseInt(pos);
            // Must be at the correct position
            if (chars[position] !== letter) {
                return false;
            }
            // Must appear more than once in the word
            const count = chars.filter(c => c === letter).length;
            if (count <= 1) {
                return false;
            }
        }
        
        return true;
    });
}