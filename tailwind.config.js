const daisyui = require('daisyui');
const typography = require('@tailwindcss/typography');
// const tailwind_theme = require('tailwindcss/defaultTheme');

module.exports = {
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    darkMode: 'class', // or 'media' or 'class'
    theme: {
        extend: {}
    },
    variants: {
        extend: {}
    },
    plugins: [typography, daisyui],
    corePlugins: {
        preflight: false
    },
    daisyui: {
        darkTheme: 'dark', // name of one of the included themes for dark mode
        base: true, // applies background color and foreground color for root element by default
        styled: true, // include daisyUI colors and design decisions for all components
        utils: true, // adds responsive and modifier utility classes
        prefix: '', // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
        logs: true, // Shows info about daisyUI version and used config in the console when building your CSS
        themeRoot: ':root',
        themes: [
            {
                lopaka: {
                    primary: '#d97706',
                    secondary: '#7dd3fc',
                    accent: '#047857',
                    neutral: '#1f2937',
                    'base-100': '#111827',
                    info: '#00c9ff',
                    success: '#a0d100',
                    warning: '#f59e0b',
                    error: '#dc2626'
                }
            }
        ]
    }
};
