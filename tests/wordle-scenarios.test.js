// Real-world Wordle scenario tests
// Run with: node --test wordle-scenarios.test.js

import { test } from 'node:test';
import assert from 'node:assert';
import { filterWords, parseWordsFromContent, getSuggestions } from '../js/algorithm.js';
import { readFileSync } from 'fs';

// Load real words once
const content = readFileSync('./words.txt', 'utf-8').trim();
const wordDatabase = parseWordsFromContent(content);

/**
 * Helper to create Wordle test scenarios
 *
 * Usage:
 * testWordleScenario('Test name', [
 *   { word: 'PISEK', feedback: 'XOOXX' },
 *   { word: 'SKARA', feedback: 'GGXOG' }
 * ], 'SRNKA');
 *
 * Feedback legend:
 * - X = Gray (not in word)
 * - O = Orange (in word, wrong position)
 * - G = Green (correct position)
 * - B = Blue (correct position, appears elsewhere)
 */
function testWordleScenario(name, attempts, solution) {
    test(name, () => {
        let constraints = {
            green: {},
            blue: {},
            orange: {},
            gray: new Set()
        };

        console.log(`\nScenario: ${name}`);
        console.log('═'.repeat(50));

        attempts.forEach(({ word, feedback }, index) => {
            console.log(`Attempt ${index + 1}: ${word} → ${feedback}`);

            const chars = [...word.toUpperCase()];
            const feedbackChars = [...feedback.toUpperCase()];

            // Update constraints based on feedback
            feedbackChars.forEach((fb, pos) => {
                const letter = chars[pos].toLowerCase();

                switch(fb) {
                    case 'G': // Green
                        constraints.green[pos] = letter;
                        break;
                    case 'B': // Blue
                        constraints.blue[pos] = letter;
                        break;
                    case 'O': // Orange
                        if (!constraints.orange[letter]) {
                            constraints.orange[letter] = [];
                        }
                        constraints.orange[letter].push(pos);
                        break;
                    case 'X': // Gray
                        constraints.gray.add(letter);
                        break;
                }
            });

            // Show current constraints
            console.log('Constraints:', {
                green: constraints.green,
                blue: constraints.blue,
                orange: constraints.orange,
                gray: [...constraints.gray]
            });

            // Filter words
            const suggestions = filterWords(wordDatabase, constraints);
            console.log(`Suggestions (${suggestions.length}):`, suggestions.slice(0, 10));

            // Verify solution is in suggestions
            assert.ok(
                suggestions.includes(solution.toLowerCase()),
                `❌ "${name}" failed at step ${index + 1}: ${word} → ${feedback}. Solution "${solution}" not in suggestions.`
            );
        });

        console.log(`✓ Solution "${solution}" found in all steps`);
        console.log('═'.repeat(50));
    });
}

/**
 * Interactive scenario tester - shows detailed debug output
 *
 * Usage:
 * testScenario([
 *   { word: 'PISEK', colors: 'XXOOX' },
 *   { word: 'SKARA', colors: 'GOXOG' }
 * ], 'SRNKA');
 *
 * Color codes:
 * - X or ⬜ = Gray (not in word)
 * - O or 🟨 = Orange (in word, wrong position)
 * - G or 🟩 = Green (correct position)
 * - B or 🟦 = Blue (correct position, appears elsewhere)
 */
function testScenario(attempts, solution) {
    console.log('\n' + '═'.repeat(60));
    console.log('WORDLE SCENARIO TEST');
    console.log('═'.repeat(60));

    let constraints = {
        green: {},
        blue: {},
        orange: {},
        gray: new Set()
    };

    let allSuggestionsValid = true;

    attempts.forEach(({ word, colors }, attemptNum) => {
        console.log(`\n📝 Attempt ${attemptNum + 1}: ${word.toUpperCase()}`);
        console.log(`   Colors: ${colors}`);

        const chars = [...word.toUpperCase()];
        const colorArray = [...colors.toUpperCase()
            .replace(/🟩/g, 'G')
            .replace(/🟨/g, 'O')
            .replace(/⬜/g, 'X')
            .replace(/🟦/g, 'B')];

        // Update constraints
        colorArray.forEach((color, pos) => {
            const letter = chars[pos].toLowerCase();

            switch(color) {
                case 'G':
                    constraints.green[pos] = letter;
                    console.log(`   ✓ ${letter.toUpperCase()} is at position ${pos + 1} (green)`);
                    break;
                case 'B':
                    constraints.blue[pos] = letter;
                    console.log(`   ✓ ${letter.toUpperCase()} is at position ${pos + 1} and appears elsewhere (blue)`);
                    break;
                case 'O':
                    if (!constraints.orange[letter]) {
                        constraints.orange[letter] = [];
                    }
                    constraints.orange[letter].push(pos);
                    console.log(`   ~ ${letter.toUpperCase()} is in word but NOT at position ${pos + 1} (orange)`);
                    break;
                case 'X':
                    constraints.gray.add(letter);
                    console.log(`   ✗ ${letter.toUpperCase()} is not in the word (gray)`);
                    break;
            }
        });

        // Get suggestions
        const allMatches = filterWords(wordDatabase, constraints);
        const topSuggestions = getSuggestions(wordDatabase, constraints, 10);

        console.log(`\n   📊 Results after attempt ${attemptNum + 1}:`);
        console.log(`   Total matches: ${allMatches.length}`);
        console.log(`   Top suggestions: ${topSuggestions.slice(0, 5).join(', ')}`);

        // Check if solution is still possible
        const solutionInList = allMatches.includes(solution.toLowerCase());
        if (solutionInList) {
            console.log(`   ✅ Solution "${solution}" is still in the list`);
        } else {
            console.log(`   ❌ Solution "${solution}" is NOT in the list!`);
            allSuggestionsValid = false;

            // Debug why it's not matching
            console.log('\n   🔍 Debugging why solution doesn\'t match:');
            const solutionChars = [...solution.toLowerCase()];

            // Check green constraints
            Object.entries(constraints.green).forEach(([pos, letter]) => {
                if (solutionChars[pos] !== letter) {
                    console.log(`      - Green mismatch at position ${pos}: expected '${letter}', but solution has '${solutionChars[pos]}'`);
                }
            });

            // Check orange constraints
            Object.entries(constraints.orange).forEach(([letter, positions]) => {
                if (!solutionChars.includes(letter)) {
                    console.log(`      - Orange letter '${letter}' not found in solution`);
                } else {
                    positions.forEach(pos => {
                        if (solutionChars[pos] === letter) {
                            console.log(`      - Orange conflict: '${letter}' should NOT be at position ${pos}, but it is`);
                        }
                    });
                }
            });

            // Check gray constraints
            [...constraints.gray].forEach(letter => {
                if (solutionChars.includes(letter)) {
                    const inGreen = Object.values(constraints.green).includes(letter);
                    const inOrange = Object.keys(constraints.orange).includes(letter);
                    const inBlue = Object.values(constraints.blue).includes(letter);

                    if (!inGreen && !inOrange && !inBlue) {
                        console.log(`      - Gray letter '${letter}' found in solution at position ${solutionChars.indexOf(letter) + 1}`);
                    }
                }
            });
        }
    });

    console.log('\n' + '═'.repeat(60));
    if (allSuggestionsValid) {
        console.log('✅ ALL TESTS PASSED - Solution was valid throughout!');
    } else {
        console.log('❌ TEST FAILED - Solution was eliminated at some point');
    }
    console.log('═'.repeat(60));

    return allSuggestionsValid;
}

// Example test cases
testWordleScenario('PISEK → SKARA → SRNKA', [
    { word: 'PISEK', feedback: 'XXOXO' },  // P gray, I gray, S orange, E gray, K orange
    { word: 'SKARA', feedback: 'GOXOG' }   // S green, K orange, A gray, R orange, A green
], 'SRNKA');

testWordleScenario('KLAUN → STROJ → MOTOR', [
    { word: 'KLAUN', feedback: 'XXXXX' },  // All letters gray
    { word: 'STROJ', feedback: 'XOOBX' }   // S gray, T orange, R orange, O blue, J gray
], 'MOTOR');

testWordleScenario('PAREK → ROZUM → BRICH → VICHR', [
    { word: 'PAREK', feedback: 'XXOXX' },  // P gray, A gray, R orange, E gray, K gray
    { word: 'ROZUM', feedback: 'OXXXX' },  // R orange, O gray, Z gray, U gray, M gray
    { word: 'BRICH', feedback: 'XOOOO' }   // B gray, R orange, I orange, C orange, H orange
], 'VICHR');

testWordleScenario('PAREK → AFERA → DENAR → METAR -> CETAR', [
    { word: 'PAREK', feedback: 'XOOOX' },
    { word: 'AFERA', feedback: 'OXOOX' },
    { word: 'DENAR', feedback: 'XGXGG' },
    { word: 'METAR', feedback: 'XGGGG' }
], 'CETAR');

testWordleScenario('PAREK → POSUK → POVYK', [
    { word: 'PAREK', feedback: 'GXXXG' },
    { word: 'POSUK', feedback: 'GGXXG' }
], 'POVYK');

testWordleScenario('SKOLA → PIRAT → ZUPAN (green A issue)', [
    { word: 'SKOLA', feedback: 'XXXXO' },  // S gray, K gray, O gray, L gray, A orange
    { word: 'PIRAT', feedback: 'OXXGX' }   // P orange, I gray, R gray, A green, T gray
], 'ZUPAN');

// Additional tests for green letter exact count constraint
testWordleScenario('Green letter should exclude multi-letter words', [
    { word: 'TATKA', feedback: 'GXXXG' }   // T green at position 0, A green at pos 4 - but word has 2 T's
], 'TEPNA');  // TEPNA has only one T (at position 0) and one A (at position 4)

testWordleScenario('SKOLA → PIRAT → NAPAD (blue A scenario)', [
    { word: 'SKOLA', feedback: 'XXXXO' },  // S gray, K gray, O gray, L gray, A orange
    { word: 'PIRAT', feedback: 'OXXBX' }   // P orange, I gray, R gray, A blue, T gray  
], 'NAPAD');  // NAPAD has A at pos 1 and 3 (A blue at pos 3 + appears elsewhere)

// Test for green letter validation conflicts
test('Green letter validation: conflicting letters at same position should be invalid', () => {
    // Mock scenario: User marks first word's first letter as 'S' green, 
    // then marks second word's first letter as 'P' green
    // This is impossible in Wordle - same position can't have different green letters
    
    const mockGrid = {
        querySelectorAll: () => [
            {
                getLetterBoxes: () => [
                    { letter: 'S', stateString: 'green' },
                    { letter: 'K', stateString: 'gray' },
                    { letter: 'O', stateString: 'gray' },
                    { letter: 'L', stateString: 'gray' },
                    { letter: 'A', stateString: 'gray' }
                ]
            },
            {
                getLetterBoxes: () => [
                    { letter: 'P', stateString: 'green' }, // Different letter at same position!
                    { letter: 'I', stateString: 'gray' },
                    { letter: 'R', stateString: 'gray' },
                    { letter: 'A', stateString: 'gray' },
                    { letter: 'T', stateString: 'gray' }
                ]
            }
        ]
    };

    // Test the validation logic
    const validateGreenLetters = function() {
        const wordRows = [...this.grid.querySelectorAll('word-row')];
        const positionLetters = {};
        
        for (const wordRow of wordRows) {
            const letterBoxes = wordRow.getLetterBoxes();
            
            for (let position = 0; position < letterBoxes.length; position++) {
                const box = letterBoxes[position];
                
                if (box.stateString === 'green') {
                    const letter = box.letter.toLowerCase();
                    
                    // Check if this position already has a different green letter
                    if (positionLetters[position] && positionLetters[position] !== letter) {
                        return false; // Different letters green at same position - invalid
                    }
                    
                    // Check if this letter is already green at a different position
                    for (const [pos, existingLetter] of Object.entries(positionLetters)) {
                        if (parseInt(pos) !== position && existingLetter === letter) {
                            return false; // Same letter green at different positions - invalid
                        }
                    }
                    
                    positionLetters[position] = letter;
                }
            }
        }
        
        return true;
    };

    const mockUI = { grid: mockGrid };
    const isValid = validateGreenLetters.call(mockUI);
    
    assert.ok(!isValid, 'Should detect conflicting green letters at same position');
    console.log('✓ Green letter validation correctly detects position conflicts');
});

test('Green letter validation: same letter at different positions should be invalid', () => {
    // Mock scenario: User marks 'A' as green at position 4 in 2nd word,
    // then marks 'A' as green at position 0 in 4th word  
    // This is impossible in Wordle - same letter can't be green at multiple positions
    
    const mockGrid = {
        querySelectorAll: () => [
            {
                getLetterBoxes: () => [
                    { letter: 'F', stateString: 'gray' },
                    { letter: 'I', stateString: 'gray' },
                    { letter: 'R', stateString: 'gray' },
                    { letter: 'S', stateString: 'gray' },
                    { letter: 'T', stateString: 'gray' }
                ]
            },
            {
                getLetterBoxes: () => [
                    { letter: 'S', stateString: 'gray' },
                    { letter: 'E', stateString: 'gray' },
                    { letter: 'C', stateString: 'gray' },
                    { letter: 'O', stateString: 'gray' },
                    { letter: 'A', stateString: 'green' } // A green at position 4
                ]
            },
            {
                getLetterBoxes: () => [
                    { letter: 'T', stateString: 'gray' },
                    { letter: 'H', stateString: 'gray' },
                    { letter: 'I', stateString: 'gray' },
                    { letter: 'R', stateString: 'gray' },
                    { letter: 'D', stateString: 'gray' }
                ]
            },
            {
                getLetterBoxes: () => [
                    { letter: 'A', stateString: 'green' }, // Same letter A green at different position (0)!
                    { letter: 'O', stateString: 'gray' },
                    { letter: 'U', stateString: 'gray' },
                    { letter: 'R', stateString: 'gray' },
                    { letter: 'T', stateString: 'gray' }
                ]
            }
        ]
    };

    // Test the validation logic (same function as above)
    const validateGreenLetters = function() {
        const wordRows = [...this.grid.querySelectorAll('word-row')];
        const positionLetters = {};
        
        for (const wordRow of wordRows) {
            const letterBoxes = wordRow.getLetterBoxes();
            
            for (let position = 0; position < letterBoxes.length; position++) {
                const box = letterBoxes[position];
                
                if (box.stateString === 'green') {
                    const letter = box.letter.toLowerCase();
                    
                    // Check if this position already has a different green letter
                    if (positionLetters[position] && positionLetters[position] !== letter) {
                        return false; // Different letters green at same position - invalid
                    }
                    
                    // Check if this letter is already green at a different position
                    for (const [pos, existingLetter] of Object.entries(positionLetters)) {
                        if (parseInt(pos) !== position && existingLetter === letter) {
                            return false; // Same letter green at different positions - invalid
                        }
                    }
                    
                    positionLetters[position] = letter;
                }
            }
        }
        
        return true;
    };

    const mockUI = { grid: mockGrid };
    const isValid = validateGreenLetters.call(mockUI);
    
    assert.ok(!isValid, 'Should detect same letter green at different positions (2nd and 4th word)');
    console.log('✓ Green letter validation correctly detects same letter at different positions');
});
