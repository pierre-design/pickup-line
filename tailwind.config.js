/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sidekick Design System Colors
        'darkest-green': '#01150A',
        'dark-green': '#04411F',
        'medium-green': '#00953B',
        'light-green': '#8DCB89',
        'yellow': '#FFDD00',
        'pink': '#F87171',
        
        // Semantic aliases
        primary: '#00953B',
        secondary: '#FFDD00',
        success: '#00953B',
        warning: '#FFDD00',
        error: '#F87171',
      },
    },
  },
}
