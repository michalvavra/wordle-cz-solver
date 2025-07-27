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
