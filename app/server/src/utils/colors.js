/**
 * Comprehensive color system with multiple format support
 */

/**
 * Color definitions with multiple formats
 * @typedef {Object} ColorDefinition
 * @property {string} ansi - ANSI escape code
 * @property {string} hex - Hexadecimal color code
 * @property {string} rgb - RGB color values
 * @property {string} hsl - HSL color values
 * @property {string} name - CSS color name
 */

/** @type {Object.<string, ColorDefinition>} */
const colorDefinitions = {
    // Base colors
    black: {
        ansi: '\x1b[30m',
        hex: '#000000',
        rgb: 'rgb(0, 0, 0)',
        hsl: 'hsl(0, 0%, 0%)',
        name: 'black'
    },
    red: {
        ansi: '\x1b[31m',
        hex: '#FF0000',
        rgb: 'rgb(255, 0, 0)',
        hsl: 'hsl(0, 100%, 50%)',
        name: 'red'
    },
    green: {
        ansi: '\x1b[32m',
        hex: '#00FF00',
        rgb: 'rgb(0, 255, 0)',
        hsl: 'hsl(120, 100%, 50%)',
        name: 'green'
    },
    yellow: {
        ansi: '\x1b[33m',
        hex: '#FFFF00',
        rgb: 'rgb(255, 255, 0)',
        hsl: 'hsl(60, 100%, 50%)',
        name: 'yellow'
    },
    blue: {
        ansi: '\x1b[34m',
        hex: '#0000FF',
        rgb: 'rgb(0, 0, 255)',
        hsl: 'hsl(240, 100%, 50%)',
        name: 'blue'
    },
    magenta: {
        ansi: '\x1b[35m',
        hex: '#FF00FF',
        rgb: 'rgb(255, 0, 255)',
        hsl: 'hsl(300, 100%, 50%)',
        name: 'magenta'
    },
    cyan: {
        ansi: '\x1b[36m',
        hex: '#00FFFF',
        rgb: 'rgb(0, 255, 255)',
        hsl: 'hsl(180, 100%, 50%)',
        name: 'cyan'
    },
    white: {
        ansi: '\x1b[37m',
        hex: '#FFFFFF',
        rgb: 'rgb(255, 255, 255)',
        hsl: 'hsl(0, 0%, 100%)',
        name: 'white'
    },
    gray: {
        ansi: '\x1b[90m',
        hex: '#808080',
        rgb: 'rgb(128, 128, 128)',
        hsl: 'hsl(0, 0%, 50%)',
        name: 'gray'
    },

    // Bright colors
    brightRed: {
        ansi: '\x1b[91m',
        hex: '#FF5555',
        rgb: 'rgb(255, 85, 85)',
        hsl: 'hsl(0, 100%, 67%)',
        name: 'lightcoral'
    },
    brightGreen: {
        ansi: '\x1b[92m',
        hex: '#55FF55',
        rgb: 'rgb(85, 255, 85)',
        hsl: 'hsl(120, 100%, 67%)',
        name: 'lightgreen'
    },
    brightYellow: {
        ansi: '\x1b[93m',
        hex: '#FFFF55',
        rgb: 'rgb(255, 255, 85)',
        hsl: 'hsl(60, 100%, 67%)',
        name: 'lightyellow'
    },
    brightBlue: {
        ansi: '\x1b[94m',
        hex: '#5555FF',
        rgb: 'rgb(85, 85, 255)',
        hsl: 'hsl(240, 100%, 67%)',
        name: 'lightblue'
    },
    brightMagenta: {
        ansi: '\x1b[95m',
        hex: '#FF55FF',
        rgb: 'rgb(255, 85, 255)',
        hsl: 'hsl(300, 100%, 67%)',
        name: 'lightmagenta'
    },
    brightCyan: {
        ansi: '\x1b[96m',
        hex: '#55FFFF',
        rgb: 'rgb(85, 255, 255)',
        hsl: 'hsl(180, 100%, 67%)',
        name: 'lightcyan'
    },
    brightWhite: {
        ansi: '\x1b[97m',
        hex: '#FFFFFF',
        rgb: 'rgb(255, 255, 255)',
        hsl: 'hsl(0, 0%, 100%)',
        name: 'white'
    }
};

// Style definitions
const styles = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    italic: '\x1b[3m',
    underline: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
    strikethrough: '\x1b[9m'
};

// Background colors
const backgroundColors = Object.entries(colorDefinitions).reduce((acc, [key, value]) => {
    const bgKey = `bg${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    acc[bgKey] = {
        ansi: value.ansi.replace('[3', '[4'),
        hex: value.hex,
        rgb: value.rgb.replace('rgb', 'rgba').replace(')', ', 0.2)'),
        hsl: value.hsl.replace('hsl', 'hsla').replace(')', ', 0.2)'),
        name: `bg-${value.name}`
    };
    return acc;
}, {});

/**
 * Get color value in specified format
 * @param {string} colorName - Name of the color
 * @param {string} format - Format to return ('ansi', 'hex', 'rgb', 'hsl', 'name')
 * @returns {string} Color value in specified format
 */
const getColorValue = (colorName, format = 'ansi') => {
    const color = colorDefinitions[colorName] || backgroundColors[colorName];
    return color ? color[format] : '';
};

/**
 * Colorize text with multiple format support
 * @param {string} text - Text to colorize
 * @param {string|Array<string>} styles - Style or array of styles to apply
 * @param {string} format - Color format to use
 * @returns {string} Colorized text
 */
const colorize = (text, styles, format = 'ansi') => {
    if (!text) return '';
    
    const styleArray = Array.isArray(styles) ? styles : [styles];
    if (format === 'ansi') {
        const prefix = styleArray.map(style => {
            if (style in colorDefinitions) return colorDefinitions[style].ansi;
            if (style in backgroundColors) return backgroundColors[style].ansi;
            return styles[style] || '';
        }).join('');
        return `${prefix}${text}${styles.reset}`;
    }
    
    // For other formats, return the first color value (non-ANSI formats don't support multiple styles)
    const style = styleArray[0];
    if (style in colorDefinitions) return colorDefinitions[style][format];
    if (style in backgroundColors) return backgroundColors[style][format];
    return text;
};

// Debug level color mappings with semantic meaning
const debugColors = {
    error: ['brightRed', 'bold'],
    warn: ['yellow', 'bold'],
    info: ['cyan'],
    debug: ['gray'],
    trace: ['dim'],
    success: ['brightGreen'],
    highlight: ['brightYellow', 'bold'],
    muted: ['dim'],
    important: ['brightWhite', 'bold'],
    system: ['brightMagenta'],
    request: ['brightBlue'],
    response: ['green']
};

module.exports = {
    colorDefinitions,
    backgroundColors,
    styles,
    colorize,
    getColorValue,
    debugColors
};
