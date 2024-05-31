const daisyui = require('daisyui');
const typography = require('@tailwindcss/typography');
// const tailwind_theme = require('tailwindcss/defaultTheme');

module.exports = {
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    plugins: [typography, daisyui],
    daisyui: {
        themes: [
            {
                lopaka: {
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
