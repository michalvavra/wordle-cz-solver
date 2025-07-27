# Claude Instructions for Wordle.cz Solver

## Project Overview
Web-based solver for Czech Wordle using pure HTML/CSS/JavaScript with KelpUI components.

## Key Files
- `index.html`: Main HTML with KelpUI structure
- `css/styles.css`: Custom styles (minimal, leverage KelpUI)
- `js/app.js`: Main application orchestrator
- `js/ui.js`: UI management class
- `js/solver.js`: Word filtering and solving logic
- `js/algorithm.js`: Core algorithm with Czech text normalization
- `js/components.js`: Web Components (LetterBox, WordRow, etc.)
- `words.txt`: 2,863 Czech 5-letter words (concatenated, no separators)

## Development Guidelines

### Code Style
- **Naming**: kebab-case for HTML/CSS, camelCase for JavaScript
- **Modern JavaScript**: ES modules, async/await, optional chaining
- **Modern CSS**: Custom properties, grid, logical properties
- **KelpUI First**: Use layout components (stack, cluster, grid-m) over custom CSS

### Commits
Use [Conventional Commits](https://conventionalcommits.org/):
- `feat:` new features
- `fix:` bug fixes  
- `docs:` documentation changes
- `style:` formatting, no code changes
- `refactor:` code restructuring
- `test:` adding/updating tests

### Word Processing
- **Normalization**: `normalizeCzechText()` removes diacritics, converts to lowercase
- **Invalid Words**: Filter known bad entries (see `INVALID_WORDS` in algorithm.js)
- **Validation**: Check against word database, show Czech error messages

### Architecture
- **Web Components**: Custom elements with Shadow DOM
- **ES Modules**: No build tools, direct browser imports
- **Async Loading**: Words loaded from `words.txt` at runtime
- **Event-Driven**: Custom events for component communication

### Testing
```bash
# Run all tests
node tests/algorithm.test.js && node tests/integration.test.js && node tests/wordle-scenarios.test.js

# Run specific test files
node tests/algorithm.test.js         # Core algorithm tests
node tests/integration.test.js       # Integration tests
node tests/wordle-scenarios.test.js  # Scenario tests (edit this file to add real scenarios)
```

## Common Tasks

### Adding Features
1. Update relevant component/module
2. Add tests to `tests/` directory if algorithm changes
3. Update help section if user-facing
4. Use KelpUI classes for styling

### Debugging Word Issues
- Check `INVALID_WORDS` set in algorithm.js
- Verify `words.txt` parsing (every 5 chars = 1 word)
- Test with `normalizeCzechText()` for diacritic issues