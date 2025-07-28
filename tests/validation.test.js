// Tests for validation utilities
import { validateWordInput, validateGreenLetterConstraints, validateWordAddition, normalizeAndValidateWord } from '../js/validation.js';
import assert from 'assert';

// Mock solver for testing
const mockSolver = {
    async wordExists(word) {
        // Simulate a simple dictionary with a few words
        const validWords = ['HOUSE', 'ABOUT', 'SVĚTR', 'ŠKOLA'];
        return validWords.includes(word.toUpperCase());
    }
};

// Test word input validation
console.log('Testing word input validation...');

// Test valid word
try {
    const result = await validateWordInput('HOUSE', mockSolver);
    assert.strictEqual(result.isValid, true, 'Valid word should pass validation');
    console.log('✓ Valid word passes validation');
} catch (error) {
    console.error('✗ Valid word validation failed:', error);
}

// Test invalid length
try {
    const result = await validateWordInput('ABC', mockSolver);
    assert.strictEqual(result.isValid, false, 'Short word should fail validation');
    assert.strictEqual(result.message, 'Slovo musí mít přesně 5 písmen!');
    console.log('✓ Short word fails validation with correct message');
} catch (error) {
    console.error('✗ Short word validation failed:', error);
}

// Test invalid characters
try {
    const result = await validateWordInput('H0USE', mockSolver);
    assert.strictEqual(result.isValid, false, 'Word with numbers should fail validation');
    assert.strictEqual(result.message, 'Slovo může obsahovat pouze česká písmena!');
    console.log('✓ Word with invalid characters fails validation');
} catch (error) {
    console.error('✗ Invalid character validation failed:', error);
}

// Test word not in dictionary
try {
    const result = await validateWordInput('ZZZZZ', mockSolver);
    assert.strictEqual(result.isValid, false, 'Unknown word should fail validation');
    assert.strictEqual(result.message, 'Toto slovo není ve slovníku Wordle.cz');
    console.log('✓ Unknown word fails validation');
} catch (error) {
    console.error('✗ Dictionary validation failed:', error);
}

// Test Czech diacritics
try {
    const result = await validateWordInput('SVĚTR', mockSolver);
    assert.strictEqual(result.isValid, true, 'Czech word with diacritics should pass');
    console.log('✓ Czech word with diacritics passes validation');
} catch (error) {
    console.error('✗ Czech diacritics validation failed:', error);
}

// Test validateWordAddition
console.log('\nTesting word addition validation...');

try {
    const result1 = validateWordAddition(3, 6);
    assert.strictEqual(result1.isValid, true, 'Should allow adding word when under limit');
    
    const result2 = validateWordAddition(6, 6);
    assert.strictEqual(result2.isValid, false, 'Should reject adding word when at limit');
    assert.strictEqual(result2.message, 'Maximální počet slov je 6!');
    
    console.log('✓ Word addition validation works correctly');
} catch (error) {
    console.error('✗ Word addition validation failed:', error);
}

// Test normalizeAndValidateWord
console.log('\nTesting word normalization...');

try {
    const result1 = normalizeAndValidateWord('  škola  ');
    assert.strictEqual(result1.isValid, true);
    assert.strictEqual(result1.original, 'ŠKOLA');
    assert.strictEqual(result1.normalized, 'SKOLA');
    
    const result2 = normalizeAndValidateWord('');
    assert.strictEqual(result2.isValid, false);
    
    const result3 = normalizeAndValidateWord(null);
    assert.strictEqual(result3.isValid, false);
    
    console.log('✓ Word normalization works correctly');
} catch (error) {
    console.error('✗ Word normalization failed:', error);
}

// Test validateGreenLetterConstraints
console.log('\nTesting green letter constraint validation...');

// Mock word rows for testing
const createMockWordRow = (letters, states) => ({
    getLetterBoxes: () => letters.map((letter, i) => ({
        letter,
        stateString: states[i]
    }))
});

try {
    // Test valid green letters
    const validRows = [
        createMockWordRow(['H', 'O', 'U', 'S', 'E'], ['green', 'gray', 'gray', 'gray', 'gray']),
        createMockWordRow(['H', 'A', 'P', 'P', 'Y'], ['green', 'gray', 'gray', 'gray', 'gray'])
    ];
    
    const result1 = validateGreenLetterConstraints(validRows);
    assert.strictEqual(result1.isValid, true, 'Same green letter at same position should be valid');
    
    // Test conflicting green letters at same position
    const conflictingRows = [
        createMockWordRow(['H', 'O', 'U', 'S', 'E'], ['green', 'gray', 'gray', 'gray', 'gray']),
        createMockWordRow(['P', 'A', 'P', 'P', 'Y'], ['green', 'gray', 'gray', 'gray', 'gray'])
    ];
    
    const result2 = validateGreenLetterConstraints(conflictingRows);
    assert.strictEqual(result2.isValid, false, 'Different green letters at same position should be invalid');
    assert.strictEqual(result2.conflictType, 'position');
    
    // Test same letter green at different positions
    const sameLetterRows = [
        createMockWordRow(['H', 'O', 'U', 'S', 'E'], ['green', 'gray', 'gray', 'gray', 'gray']),
        createMockWordRow(['A', 'H', 'P', 'P', 'Y'], ['gray', 'green', 'gray', 'gray', 'gray'])
    ];
    
    const result3 = validateGreenLetterConstraints(sameLetterRows);
    assert.strictEqual(result3.isValid, false, 'Same letter green at different positions should be invalid');
    assert.strictEqual(result3.conflictType, 'letter');
    
    console.log('✓ Green letter constraint validation works correctly');
} catch (error) {
    console.error('✗ Green letter constraint validation failed:', error);
}

console.log('\nAll validation utility tests completed!');