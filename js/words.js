// Czech 5-letter words database
export const czechWords = [
    'ahoj', 'auto', 'bota', 'cesta', 'doba', 'doma', 'dvůr', 'echo', 'foto', 'guma',
    'hlad', 'hora', 'hrad', 'chata', 'jaro', 'kafe', 'káva', 'klid', 'kmen', 'kolo',
    'krab', 'kraj', 'krev', 'kruh', 'kuře', 'láska', 'léto', 'list', 'lože', 'mapa',
    'máma', 'mars', 'maso', 'míra', 'moře', 'most', 'mrak', 'nebe', 'noc', 'nota',
    'obec', 'oko', 'okno', 'orel', 'oves', 'paní', 'park', 'past', 'páta', 'pero',
    'pivo', 'plán', 'plot', 'pole', 'práce', 'prst', 'před', 'rada', 'rána', 'ruka',
    'růže', 'ryba', 'řeka', 'seno', 'síla', 'skok', 'slza', 'sníh', 'soud', 'stan',
    'stín', 'stůl', 'svět', 'táta', 'teta', 'tma', 'tráva', 'trh', 'třída', 'účet',
    'úder', 'úhel', 'úkol', 'úraz', 'ústa', 'útok', 'včela', 'věda', 'věta', 'věž',
    'víla', 'víno', 'víra', 'voda', 'vůle', 'vůně', 'výlet', 'výška', 'zába', 'záda',
    'země', 'zima', 'zlato', 'znak', 'zpěv', 'zvon', 'život', 'želva', 'žena', 'židle'
];

// Async function to load words from external source
export async function loadWords(url) {
    try {
        const response = await fetch(url);
        const words = await response.json();
        return new Set(words);
    } catch (error) {
        console.error('Failed to load words:', error);
        return new Set(czechWords);
    }
}

// Generator for word variations with diacritics
export function* generateWordVariations(base) {
    yield base;
    
    const variations = {
        'a': 'á',
        'e': 'é ě',
        'i': 'í',
        'o': 'ó',
        'u': 'ú ů',
        'y': 'ý',
        'c': 'č',
        'd': 'ď',
        'n': 'ň',
        'r': 'ř',
        's': 'š',
        't': 'ť',
        'z': 'ž'
    };
    
    // Generate variations (simplified example)
    for (const [plain, accented] of Object.entries(variations)) {
        const accentedChars = accented.split(' ');
        for (const char of accentedChars) {
            const variation = base.replace(new RegExp(plain, 'g'), char);
            if (variation !== base) {
                yield variation;
            }
        }
    }
}