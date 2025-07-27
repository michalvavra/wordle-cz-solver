// Integration test for the optimized algorithm
// Run with: node integration.test.js

import { test } from 'node:test';
import assert from 'node:assert';
import { WordleSolver } from './js/solver.js';

test('Integration: solver should work with optimized algorithm', async () => {
    const solver = new WordleSolver();
    await solver.wordsPromise;
    
    // Test basic filtering
    const constraints = {
        green: { 0: 's', 4: 'a' },
        blue: {},
        orange: { 'k': [1], 'r': [3] },
        gray: new Set(['p', 'i', 'e', 'a'])
    };
    
    const suggestions = await solver.getSuggestions(constraints, 10);
    
    console.log('Suggestions found:', suggestions);
    assert.ok(suggestions.includes('srnka'), 'Should find SRNKA');
    assert.ok(suggestions.length > 0, 'Should have suggestions');
    assert.ok(suggestions.length <= 10, 'Should respect limit');
});

test('Integration: word existence check should work', async () => {
    const solver = new WordleSolver();
    
    assert.ok(await solver.wordExists('SRNKA'), 'SRNKA should exist');
    assert.ok(await solver.wordExists('pisek'), 'pisek should exist');
    assert.ok(!(await solver.wordExists('xxxxx')), 'xxxxx should not exist');
});

test('Integration: should handle empty constraints efficiently', async () => {
    const solver = new WordleSolver();
    const constraints = {
        green: {},
        blue: {},
        orange: {},
        gray: new Set()
    };
    
    const start = process.hrtime.bigint();
    const suggestions = await solver.getSuggestions(constraints, 10);
    const time = process.hrtime.bigint() - start;
    
    assert.strictEqual(suggestions.length, 10, 'Should return exactly 10 suggestions');
    console.log(`Time for 10 suggestions from 2862 words: ${time / 1000000n}ms`);
});

test('Integration: performance should be acceptable', async () => {
    const solver = new WordleSolver();
    await solver.wordsPromise;
    
    const constraints = {
        green: { 0: 's' },
        blue: {},
        orange: {},
        gray: new Set(['x', 'y', 'z'])
    };
    
    // Measure performance
    const start = process.hrtime.bigint();
    const result = await solver.filterWords(constraints);
    const time = process.hrtime.bigint() - start;
    
    assert.ok(result.length > 0, 'Should find matching words');
    console.log(`Filter time for ${result.length} results: ${time / 1000000n}ms`);
    assert.ok(time < 10_000_000n, 'Should complete in under 10ms');
});