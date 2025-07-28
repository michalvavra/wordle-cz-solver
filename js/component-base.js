// Base class for Web Components with common functionality

/**
 * Base class for Wordle.cz components with common shadow DOM patterns
 */
export class WordleComponentBase extends HTMLElement {
    constructor() {
        super();
        this.shadowRoot = this.attachShadow({ mode: 'open' });
    }

    /**
     * Create CSS for component with responsive design
     * @param {string} baseStyles - Component-specific styles
     * @returns {string} Complete CSS with responsive utilities
     */
    createStyles(baseStyles) {
        return `
            <style>
                /* Base responsive utilities */
                :host {
                    --size-xs: 32px;
                    --size-sm: 44px;
                    --size-md: 50px;
                    --size-lg: 62px;
                    --font-xs: 1.3rem;
                    --font-sm: 1.5rem;
                    --font-md: 1.8rem;
                    --font-lg: 2rem;
                }
                
                /* Mobile-first responsive breakpoints */
                @media (max-width: 400px) {
                    :host {
                        --current-size: var(--size-sm);
                        --current-font: var(--font-xs);
                    }
                }
                
                @media (min-width: 401px) and (max-width: 600px) {
                    :host {
                        --current-size: var(--size-md);
                        --current-font: var(--font-sm);
                    }
                }
                
                @media (min-width: 601px) {
                    :host {
                        --current-size: var(--size-lg);
                        --current-font: var(--font-lg);
                    }
                }
                
                /* Component styles */
                ${baseStyles}
            </style>
        `;
    }

    /**
     * Render component with styles and content
     * @param {string} styles - Component styles
     * @param {string} content - Component HTML content
     */
    render(styles, content) {
        this.shadowRoot.innerHTML = `
            ${this.createStyles(styles)}
            ${content}
        `;
    }

    /**
     * Dispatch a custom event with consistent naming
     * @param {string} eventName - Event name
     * @param {*} detail - Event detail data
     * @param {Object} options - Event options
     */
    dispatchCustomEvent(eventName, detail, options = {}) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            ...options
        });
        this.dispatchEvent(event);
    }

    /**
     * Safe attribute parsing with defaults
     * @param {string} name - Attribute name
     * @param {*} defaultValue - Default value if attribute missing
     * @param {string} type - Type conversion ('string', 'number', 'boolean')
     * @returns {*} Parsed attribute value
     */
    parseAttribute(name, defaultValue, type = 'string') {
        const value = this.getAttribute(name);
        
        if (value === null) return defaultValue;
        
        switch (type) {
            case 'number':
                const num = parseInt(value);
                return isNaN(num) ? defaultValue : num;
            case 'boolean':
                return value === 'true' || value === '';
            case 'string':
            default:
                return value;
        }
    }

    /**
     * Debounced event listener helper
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     * @param {number} delay - Debounce delay in ms
     */
    addDebouncedListener(eventName, handler, delay = 300) {
        let timeoutId;
        
        this.addEventListener(eventName, (event) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => handler(event), delay);
        });
    }
}

/**
 * Mixin for components that manage state
 * @param {Class} BaseClass - Base class to extend
 * @returns {Class} Enhanced class with state management
 */
export function withStateManagement(BaseClass) {
    return class extends BaseClass {
        constructor() {
            super();
            this._state = {};
            this._stateListeners = new Map();
        }

        /**
         * Update component state
         * @param {Object} newState - State updates
         * @param {boolean} silent - Skip notifications if true
         */
        setState(newState, silent = false) {
            const oldState = { ...this._state };
            this._state = { ...this._state, ...newState };
            
            if (!silent) {
                this._notifyStateChange(oldState, this._state);
            }
        }

        /**
         * Get current state
         * @returns {Object} Current state
         */
        getState() {
            return { ...this._state };
        }

        /**
         * Listen to state changes
         * @param {string} key - State key to watch
         * @param {Function} callback - Change callback
         */
        onStateChange(key, callback) {
            if (!this._stateListeners.has(key)) {
                this._stateListeners.set(key, []);
            }
            this._stateListeners.get(key).push(callback);
        }

        /**
         * Notify listeners of state changes
         * @private
         */
        _notifyStateChange(oldState, newState) {
            for (const [key, listeners] of this._stateListeners) {
                if (oldState[key] !== newState[key]) {
                    listeners.forEach(callback => {
                        callback(newState[key], oldState[key]);
                    });
                }
            }
        }
    };
}