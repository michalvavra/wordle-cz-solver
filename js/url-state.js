// URL state management utilities for sharing game state

/**
 * Serializes game state to URL parameters
 * @param {Array} words - Array of words in the grid
 * @param {Array} wordRows - Array of word-row elements  
 * @returns {Array} Array of slovo parameters for URL
 */
export function serializeGameState(words, wordRows) {
    if (words.length === 0 || words.length !== wordRows.length) {
        return [];
    }
    
    const slovoParams = [];
    
    wordRows.forEach((row, index) => {
        const word = words[index];
        const letterBoxes = row.getLetterBoxes();
        
        if (letterBoxes.length !== 5) {
            console.warn(`Invalid letter boxes count for word ${word}`);
            return;
        }
        
        const states = letterBoxes
            .map(box => box.state.toString())
            .join('');
            
        slovoParams.push(`${word}${states}`);
    });
    
    return slovoParams;
}

/**
 * Generates a shareable URL with current game state
 * @param {Array} words - Array of words in the grid
 * @param {Array} wordRows - Array of word-row elements
 * @returns {string} Complete shareable URL
 */
export function generateShareableUrl(words, wordRows) {
    const slovoParams = serializeGameState(words, wordRows);
    const url = new URL(window.location.origin + window.location.pathname);
    
    // Add slovo parameters
    slovoParams.forEach(slovo => {
        url.searchParams.append('slovo', slovo);
    });
    
    return url.toString();
}

/**
 * Parses URL parameters to extract game state
 * @param {string} urlString - URL string to parse (optional, uses current URL)
 * @returns {Array} Array of parsed word state objects
 */
export function parseGameStateFromUrl(urlString = window.location.search) {
    const params = new URLSearchParams(urlString);
    const slovoParams = params.getAll('slovo');
    
    return slovoParams
        .map(slovo => parseWordState(slovo))
        .filter(parsed => parsed !== null);
}

/**
 * Parses a single slovo parameter into word and states
 * @param {string} slovo - Slovo parameter (e.g., "HOUSE01230")
 * @returns {Object|null} Parsed word state or null if invalid
 */
function parseWordState(slovo) {
    if (slovo.length < 10) { // 5 chars + 5 states minimum
        console.warn(`Invalid slovo format: ${slovo}`);
        return null;
    }
    
    const word = slovo.slice(0, 5);
    const states = slovo.slice(5);
    
    if (states.length !== 5) {
        console.warn(`Invalid states length for word: ${word}`);
        return null;
    }
    
    // Validate states are numeric and in valid range
    const stateArray = states.split('').map(s => parseInt(s));
    if (stateArray.some(state => isNaN(state) || state < 0 || state > 3)) {
        console.warn(`Invalid states for word: ${word}`);
        return null;
    }
    
    return {
        word: word.toUpperCase(),
        states: stateArray
    };
}

/**
 * Restores game state from URL parameters to grid
 * @param {Object} grid - Wordle.cz grid element
 * @param {Function} onError - Error callback (optional)
 * @returns {boolean} True if successfully restored, false otherwise
 */
export function restoreGameStateFromUrl(grid, onError = null) {
    try {
        const parsedStates = parseGameStateFromUrl();
        
        if (parsedStates.length === 0) {
            return false; // No state to restore
        }
        
        // Clear current grid
        grid.clear();
        
        // Restore each word
        let successCount = 0;
        for (const { word, states } of parsedStates) {
            try {
                const wordRow = grid.addWord(word);
                const letterBoxes = wordRow.getLetterBoxes();
                
                // Apply states
                letterBoxes.forEach((box, index) => {
                    if (index < states.length) {
                        box.setAttribute('state', states[index].toString());
                    }
                });
                
                successCount++;
            } catch (error) {
                console.warn(`Failed to restore word: ${word}`, error);
                if (onError) onError(error, word);
            }
        }
        
        return successCount > 0;
        
    } catch (error) {
        console.error('Failed to restore game state from URL:', error);
        if (onError) onError(error);
        return false;
    }
}

/**
 * Checks if current URL contains game state
 * @returns {boolean} True if URL has slovo parameters
 */
export function hasGameStateInUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.has('slovo');
}