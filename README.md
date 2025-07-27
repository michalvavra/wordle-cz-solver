# wordle-cz-solver

Web-based solver for the Czech version of [Wordle.cz](https://www.wordle.cz). Helps you find possible words based on your guesses.

## Features

- **Interactive Grid**: Click letters to set colors based on Wordle feedback
- **Smart Filtering**: Uses 2,863 Czech words with diacritic normalization
- **Automatic Solving**: Shows suggestions as you add words
- **URL Sharing**: Game state automatically saved in URL for easy sharing
- **Mobile-Friendly**: Built with [KelpUI](https://kelpui.com) for responsive design
- **No Build Tools**: Pure HTML/CSS/JavaScript

## Word Database

The Czech word list (`words.txt`) contains 2,863 five-letter words extracted from the `allWords` constant in [Wordle.cz's JavaScript file](https://www.wordle.cz/wordle.js). Words are stored concatenated without separators and normalized (diacritics removed) for consistent matching.

## How to Use

1. Open `index.html` in a web browser
2. Enter a 5-letter word and click "Přidat slovo"
3. Click letters to set colors:
   - **Gray**: Letter not in word
   - **Orange**: Letter in word, wrong position
   - **Blue**: Letter in correct position, appears elsewhere
   - **Green**: Letter in correct position, appears only here
4. View suggestions in "Možná slova" section

## Development

### Local Development

For development, serve the files using a local HTTP server (required for ES modules):

```bash
# Install serve globally
npm install -g serve

# Run development server
serve

# Open http://localhost:3000 in your browser
```

Alternatively, you can use any other static file server like Python's `http.server` or Live Server in VS Code.

### Technologies

- **HTML5**: Semantic markup with Web Components
- **CSS3**: Modern styling with custom properties
- **JavaScript**: ES6+ modules and features
- **[KelpUI](https://kelpui.com)**: Lightweight CSS framework

### Testing

```bash
node tests/algorithm.test.js
node tests/integration.test.js
node tests/wordle-scenarios.test.js
```
