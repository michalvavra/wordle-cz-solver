// Real-world Wordle scenario tests
// Run with: node --test wordle-scenarios.test.js

import { test } from 'node:test';
import assert from 'node:assert';
import { filterWords, parseWordsFromContent } from './js/algorithm.js';
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
                `Solution "${solution}" should be in suggestions after attempt ${index + 1}`
            );
        });
        
        console.log(`✓ Solution "${solution}" found in all steps`);
        console.log('═'.repeat(50));
    });
}

// Example test cases
testWordleScenario('PISEK → SKARA → SRNKA', [
    { word: 'PISEK', feedback: 'XXOOX' },  // P gray, I gray, S orange, E gray, K orange
    { word: 'SKARA', feedback: 'GOXOG' }   // S green, K orange, A gray, R orange, A green
], 'SRNKA');

testWordleScenario('Simple green match', [
    { word: 'KRAVA', feedback: 'GXXXX' }   // K green, rest gray
], 'KLUCI');

// Add more test scenarios here...
// testWordleScenario('Your test name', [
//     { word: 'WORD1', feedback: 'XXXXX' },
//     { word: 'WORD2', feedback: 'GOXXX' }
// ], 'SOLUTION');