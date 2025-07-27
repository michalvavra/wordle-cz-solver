// Wordle algorithm tests using Node.js built-in test runner
// Run with: node --test algorithm.test.js

import { test } from 'node:test';
import assert from 'node:assert';
import { filterWords, normalizeCzechText } from '../js/algorithm.js';

// Mock word list for testing (normalized as the algorithm now stores them)
const testWords = [
    'krava', 'plast', 'rycht', 'divka',
    'slovo', 'opera', 'parek', 'mesto',
    'blond', 'cerny', 'zeleny', 'modry'
];


// Test suite for word filtering algorithm
test('should filter words with green letters (exact position)', () => {
    const constraints = {
        green: { 0: 'k' }, // k in position 0
        blue: {},
        orange: {},
        gray: new Set()
    };
    
    const result = filterWords(testWords, constraints);
    const expected = ['krava'];
    
    assert.deepStrictEqual(result, expected, 'Should only return words starting with k');
});

test('should filter words with gray letters (not in word)', () => {
    const constraints = {
        green: {},
        blue: {},
        orange: {},
        gray: new Set(['x', 'z'])
    };
    
    const result = filterWords(testWords, constraints);
    
    // Should exclude words containing x or z
    result.forEach(word => {
        assert.ok(!word.includes('x') && !word.includes('z'), 
                  `Word ${word} should not contain gray letters`);
    });
});

test('should filter words with orange letters (wrong position)', () => {
    const constraints = {
        green: {},
        blue: {},
        orange: { 'a': [0] }, // a is in word but not at position 0
        gray: new Set()
    };
    
    const result = filterWords(testWords, constraints);
    
    result.forEach(word => {
        assert.ok(word.includes('a'), `Word ${word} should contain letter a`);
        assert.ok(word[0] !== 'a', `Word ${word} should not have a at position 0`);
    });
});

test('should filter words with blue letters (correct position, appears elsewhere)', () => {
    const constraints = {
        green: {},
        blue: { 0: 's' }, // s in position 0 and appears elsewhere
        orange: {},
        gray: new Set()
    };
    
    const result = filterWords(testWords, constraints);
    
    result.forEach(word => {
        assert.ok(word[0] === 's', `Word ${word} should have s at position 0`);
        assert.ok((word.match(/s/g) || []).length > 1, 
                  `Word ${word} should have s appear more than once`);
    });
});

test('should handle complex constraints combination', () => {
    const constraints = {
        green: { 1: 'l' }, // l in position 1
        blue: {},
        orange: { 'o': [0, 2] }, // o in word but not at positions 0 or 2
        gray: new Set(['x', 'z'])
    };
    
    const result = filterWords(testWords, constraints);
    
    result.forEach(word => {
        assert.ok(word[1] === 'l', `Word ${word} should have l at position 1`);
        assert.ok(word.includes('o'), `Word ${word} should contain o`);
        assert.ok(word[0] !== 'o' && word[2] !== 'o', 
                  `Word ${word} should not have o at positions 0 or 2`);
        assert.ok(!word.includes('x') && !word.includes('z'),
                  `Word ${word} should not contain gray letters`);
    });
});

test('should return empty array when no words match', () => {
    const constraints = {
        green: { 0: 'q' }, // q doesn't exist in our test words
        blue: {},
        orange: {},
        gray: new Set()
    };
    
    const result = filterWords(testWords, constraints);
    assert.deepStrictEqual(result, [], 'Should return empty array when no matches');
});

test('should handle empty constraints (return all words)', () => {
    const constraints = {
        green: {},
        blue: {},
        orange: {},
        gray: new Set()
    };
    
    const result = filterWords(testWords, constraints);
    assert.deepStrictEqual(result, testWords, 'Should return all words with no constraints');
});

test('should handle multiple green letters', () => {
    const constraints = {
        green: { 0: 's', 4: 'o' }, // s at position 0, o at position 4
        blue: {},
        orange: {},
        gray: new Set()
    };
    
    const result = filterWords(testWords, constraints);
    
    result.forEach(word => {
        assert.ok(word[0] === 's', `Word ${word} should have s at position 0`);
        assert.ok(word[4] === 'o', `Word ${word} should have o at position 4`);
    });
});

// Tests for Czech diacritic normalization
test('should normalize Czech diacritics correctly', () => {
    assert.strictEqual(normalizeCzechText('KRÁVA'), 'krava');
    assert.strictEqual(normalizeCzechText('čerstvý'), 'cerstvy');
    assert.strictEqual(normalizeCzechText('MĚSTO'), 'mesto');
    assert.strictEqual(normalizeCzechText('žluťoučký'), 'zlutoucky');
    assert.strictEqual(normalizeCzechText('příliš'), 'prilis');
});

test('should handle case insensitivity in constraints - uppercase input', () => {
    const constraints = {
        green: { 0: 'K' }, // Uppercase K
        blue: {},
        orange: {},
        gray: new Set()
    };
    
    const result = filterWords(testWords, constraints);
    const expected = ['krava'];
    
    assert.deepStrictEqual(result, expected, 'Should match regardless of input case');
});

test('should handle case insensitivity in constraints - mixed case', () => {
    const constraints = {
        green: { 0: 'k', 2: 'A' }, // Mixed case
        blue: {},
        orange: {},
        gray: new Set()
    };
    
    const result = filterWords(testWords, constraints);
    const expected = ['krava'];
    
    assert.deepStrictEqual(result, expected, 'Should handle mixed case input');
});

test('should handle diacritics in green constraints', () => {
    // Test with Czech words that have diacritics
    const wordsWithDiacritics = ['kráva', 'černé', 'město'];
    const normalizedWords = wordsWithDiacritics.map(w => normalizeCzechText(w));
    
    const constraints = {
        green: { 0: 'č' }, // Input with diacritic
        blue: {},
        orange: {},
        gray: new Set()
    };
    
    const result = filterWords(normalizedWords, constraints);
    const expected = ['cerne']; // normalized result
    
    assert.deepStrictEqual(result, expected, 'Should handle diacritics in green constraints');
});

test('should handle diacritics in orange constraints', () => {
    const wordsWithDiacritics = ['kráva', 'černé', 'město', 'světe'];
    const normalizedWords = wordsWithDiacritics.map(w => normalizeCzechText(w));
    
    const constraints = {
        green: {},
        blue: {},
        orange: { 'ě': [2] }, // ě in word but not at position 2
        gray: new Set()
    };
    
    const result = filterWords(normalizedWords, constraints);
    const expected = ['cerne', 'mesto']; // both have 'e' (normalized ě) but not at position 2
    
    assert.deepStrictEqual(result, expected, 'Should handle diacritics in orange constraints');
});

test('should handle diacritics in gray constraints', () => {
    const wordsWithDiacritics = ['kráva', 'černé', 'město'];
    const normalizedWords = wordsWithDiacritics.map(w => normalizeCzechText(w));
    
    const constraints = {
        green: {},
        blue: {},
        orange: {},
        gray: new Set(['č']) // Words containing č should be filtered out
    };
    
    const result = filterWords(normalizedWords, constraints);
    const expected = ['krava', 'mesto']; // černé filtered out because it contains č
    
    assert.deepStrictEqual(result, expected, 'Should handle diacritics in gray constraints');
});

test('should handle complex diacritic combinations', () => {
    const wordsWithDiacritics = ['žrout'];
    const normalizedWords = wordsWithDiacritics.map(w => normalizeCzechText(w));
    
    const constraints = {
        green: { 0: 'ž' }, // Input with diacritic 
        blue: {},
        orange: { 'r': [1] }, // r in word but not at position 1
        gray: new Set(['x'])
    };
    
    const result = filterWords(normalizedWords, constraints);
    const expected = []; // žrout has r at position 1, so should be filtered out
    
    assert.deepStrictEqual(result, expected, 'Should handle complex diacritic combinations');
});

test('should normalize all Czech diacritics', () => {
    const testCases = [
        ['á', 'a'], ['Á', 'a'],
        ['č', 'c'], ['Č', 'c'],
        ['ď', 'd'], ['Ď', 'd'],
        ['é', 'e'], ['É', 'e'],
        ['ě', 'e'], ['Ě', 'e'],
        ['í', 'i'], ['Í', 'i'],
        ['ň', 'n'], ['Ň', 'n'],
        ['ó', 'o'], ['Ó', 'o'],
        ['ř', 'r'], ['Ř', 'r'],
        ['š', 's'], ['Š', 's'],
        ['ť', 't'], ['Ť', 't'],
        ['ú', 'u'], ['Ú', 'u'],
        ['ů', 'u'], ['Ů', 'u'],
        ['ý', 'y'], ['Ý', 'y'],
        ['ž', 'z'], ['Ž', 'z']
    ];
    
    testCases.forEach(([input, expected]) => {
        assert.strictEqual(normalizeCzechText(input), expected, 
                          `Should normalize ${input} to ${expected}`);
    });
});

test('should handle real Wordle scenario: PISEK -> SKARA -> SRNKA', () => {
    // Test words including the solution
    const testWords = ['srnka', 'pisek', 'skara', 'slova', 'sport'];
    
    // After first word PISEK with S and K orange, P/I/E gray
    const constraintsAfterPisek = {
        green: {},
        blue: {},
        orange: { 's': [1], 'k': [4] }, // S not at pos 1, K not at pos 4
        gray: new Set(['p', 'i', 'e'])
    };
    
    const resultAfterPisek = filterWords(testWords, constraintsAfterPisek);
    assert.ok(resultAfterPisek.includes('srnka'), 'SRNKA should be suggested after PISEK');
    
    // After second word SKARA with S green (pos 0), A green (pos 4), K/R orange, middle A gray
    const constraintsAfterSkara = {
        green: { 0: 's', 4: 'a' }, // S at pos 0, A at pos 4
        blue: {},
        orange: { 'k': [1, 4], 'r': [3] }, // K not at pos 1 or 4, R not at pos 3
        gray: new Set(['p', 'i', 'e', 'a']) // P/I/E from first word, A from middle position
    };
    
    const resultAfterSkara = filterWords(testWords, constraintsAfterSkara);
    assert.ok(resultAfterSkara.includes('srnka'), 'SRNKA should be suggested after SKARA');
    
    // Verify SRNKA matches all constraints
    const srnka = 'srnka';
    
    // Check green constraints
    assert.strictEqual(srnka[0], 's', 'SRNKA should have S at position 0');
    assert.strictEqual(srnka[4], 'a', 'SRNKA should have A at position 4');
    
    // Check orange constraints - letters should be in word but not at specified positions
    assert.ok(srnka.includes('k'), 'SRNKA should contain K');
    assert.ok(srnka[1] !== 'k' && srnka[4] !== 'k', 'SRNKA should not have K at positions 1 or 4');
    assert.ok(srnka.includes('r'), 'SRNKA should contain R');
    assert.ok(srnka[3] !== 'r', 'SRNKA should not have R at position 3');
    
    // Check gray constraints - letters should not be in word
    assert.ok(!srnka.includes('p'), 'SRNKA should not contain P');
    assert.ok(!srnka.includes('i'), 'SRNKA should not contain I');
    assert.ok(!srnka.includes('e'), 'SRNKA should not contain E');
    
    // Special case: A is both green (pos 4) and gray (other positions)
    // This means A appears exactly once at position 4
    const aCount = (srnka.match(/a/g) || []).length;
    assert.strictEqual(aCount, 1, 'SRNKA should have exactly one A (at position 4)');
});

test('should handle letter appearing as both gray and green/orange in same word', () => {
    // Test the specific UI scenario where SKARA has:
    // - A at position 2 marked gray
    // - A at position 4 marked green
    // This means A appears exactly once at position 4
    const testWords = ['srnka', 'skara', 'slova', 'sport', 'stara'];
    
    const constraints = {
        green: { 0: 's', 4: 'a' }, // S at pos 0, A at pos 4
        blue: {},
        orange: { 'k': [1], 'r': [3] }, // K not at pos 1, R not at pos 3
        gray: new Set(['p', 'i', 'e', 'a']) // Including A in gray!
    };
    
    const result = filterWords(testWords, constraints);
    
    // SRNKA should be included because:
    // - Has S at position 0 (green)
    // - Has A at position 4 (green)
    // - Has K (orange, not at position 1)
    // - Has R (orange, not at position 3)
    // - Has only one A (at position 4)
    assert.ok(result.includes('srnka'), 'SRNKA should be suggested even with A in gray set');
    
    // STARA should be excluded because it has two A's
    assert.ok(!result.includes('stara'), 'STARA should be excluded (has two As)');
});

test('should verify SRNKA is in loaded word list', async () => {
    // Test that SRNKA is actually in the words.txt file when loaded
    const { parseWordsFromContent } = await import('../js/algorithm.js');
    const { readFileSync } = await import('fs');
    
    const content = readFileSync('./words.txt', 'utf-8').trim();
    const wordData = parseWordsFromContent(content);
    
    // Extract words from metadata objects
    const words = wordData.map(item => typeof item === 'string' ? item : item.word);
    
    assert.ok(words.includes('srnka'), 'SRNKA should be in the loaded word list');
    
    // Also verify other test words
    assert.ok(words.includes('pisek'), 'PISEK should be in the loaded word list');
    assert.ok(words.includes('skara'), 'SKARA should be in the loaded word list');
});