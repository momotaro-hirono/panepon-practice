/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      ringOpacity: {
        '50': '0.5',
      },
    },
  },
  plugins: [
    (await import('@tailwindcss/forms')).default,
    (await import('@tailwindcss/typography')).default,
    (await import('@tailwindcss/aspect-ratio')).default,
  ],
} 