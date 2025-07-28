# Claude Instructions for Wordle.cz Solver

## Project Overview
Czech Wordle solver using vanilla HTML/CSS/JavaScript with KelpUI components.

## Key Files
- `js/algorithm.js`: Core solver with Czech text normalization
- `js/components.js`: Web Components (LetterBox, WordRow)
- `js/ui.js`: UI management and event handling
- `words.txt`: 2,863 Czech words (5 chars each, concatenated)

## Development Rules

### Styling - IMPORTANT
**ALWAYS check [KelpUI docs](https://kelpui.com/docs/) before writing custom CSS**
- Use KelpUI components: `stack`, `cluster`, `grid`, `box`, etc.
- Only write custom CSS if KelpUI doesn't provide the solution
- Modern CSS: custom properties, logical properties, grid

### Code Style
- **HTML/CSS**: kebab-case
- **JavaScript**: camelCase, ES modules, async/await
- **Commits**: [Conventional Commits](https://conventionalcommits.org/)

### Algorithm Details
- **Text normalization**: `normalizeCzechText()` removes diacritics
- **Green letters**: Exact count constraint (e.g., green A = exactly 1 A)
- **Blue letters**: Appears at position + elsewhere (minimum count)
- **Orange letters**: In word, wrong position
- **Mixed constraints**: Green takes precedence over orange

### Testing
```bash
node tests/algorithm.test.js         # Core algorithm
node tests/wordle-scenarios.test.js  # Real scenarios
```

## Quick Tasks
- **Add features**: Update component → add tests → use KelpUI for styling
- **Debug words**: Check `INVALID_WORDS` in algorithm.js
- **Algorithm issues**: Test with `normalizeCzechText()`