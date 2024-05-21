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
                    ...require('daisyui/src/theming/themes').dark,
                    primary: '#FF8200',
                    neutral: '#441F07',
                    'base-100': '#120800', // bg
                    'base-200': '#441F07', // default button
                    'base-300': '#FF8200', // default tabs
                    'base-content': '#f3f4f6',
                    secondary: '#7dd3fc',
                    accent: '#047857',
                    info: '#00c9ff',
                    success: '#a0d100',
                    warning: '#f59e0b',
                    error: '#dc2626'
                }
            }
        ]
    }
};
