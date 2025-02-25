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
                    primary: '#FF8200', // orange
                    'base-100': '#0a0a0a', // bg
                    'base-200': '#441F07', // default button
                    'base-300': '#333', // default tabs
                    neutral: '#171717',
                    secondary: '#202020',
                    accent: '#00ff93',
                    info: '#6dc8ff',
                    success: '#cddc39',
                    warning: '#f59e0b',
                    error: '#dc2626',
                },
            },
        ],
    },
    theme: {
        fontFamily: {
            sans: 'Roboto, "PT Sans", "Segoe UI", Oxygen, Ubuntu, Cantarell, "Open Sans"',
            mono: [
                'ui-monospace',
                'SFMono-Regular',
                'Menlo',
                'Monaco',
                'Consolas',
                'Liberation Mono',
                'Courier New',
                'monospace',
            ],
        },
    },
};
