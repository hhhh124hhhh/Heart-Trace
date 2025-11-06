/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '24px',
			screens: {
				'sm': '640px',
				'md': '768px',
				'lg': '1024px',
			},
		},
		extend: {
			colors: {
				primary: {
					50: '#E8F5E9',
					100: '#A5D6A7',
					500: '#4A9B5F',
					700: '#2E7D42',
					900: '#1B5E2F',
					DEFAULT: '#4A9B5F',
				},
				secondary: {
					100: '#E0F7FA',
					300: '#B2EBF2',
					500: '#87CEEB',
					700: '#0097A7',
					DEFAULT: '#87CEEB',
				},
				accent: {
					sunrise: '#FF8C42',
					sunset: '#9D5C9F',
					peach: '#FFCBA4',
					DEFAULT: '#FF8C42',
				},
				neutral: {
					white: '#FFFFFF',
					cloud: '#F8F9FA',
					mist: '#E8EAED',
					stone: '#5D6D7E',  // 增强对比度
					earth: '#34495E',  // 增强对比度
					dark: '#1A252F',  // 增强对比度，更深
				},
				semantic: {
					success: '#66BB6A',
					warning: '#FFB74D',
					error: '#EF5350',
					info: '#42A5F5',
				},
			},
			fontFamily: {
				sans: ['PingFang SC', 'Noto Sans SC', 'sans-serif'],
				english: ['Quicksand', 'Comfortaa', '-apple-system', 'sans-serif'],
				number: ['DIN Alternate', 'Roboto', 'sans-serif'],
			},
			fontSize: {
				display: ['40px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
				h1: ['32px', { lineHeight: '1.3' }],
				h2: ['24px', { lineHeight: '1.4' }],
				h3: ['20px', { lineHeight: '1.4' }],
				'body-large': ['18px', { lineHeight: '1.7' }],
				body: ['16px', { lineHeight: '1.6' }],
				'body-small': ['14px', { lineHeight: '1.5' }],
				caption: ['12px', { lineHeight: '1.4', letterSpacing: '0.02em' }],
			},
			spacing: {
				'4': '4px',
				'8': '8px',
				'12': '12px',
				'16': '16px',
				'24': '24px',
				'32': '32px',
				'40': '40px',
				'48': '48px',
				'64': '64px',
				'80': '80px',
			},
			borderRadius: {
				sm: '12px',
				md: '16px',
				lg: '20px',
				xl: '24px',
				'2xl': '32px',
				full: '9999px',
			},
			boxShadow: {
				sm: '0 2px 8px rgba(0, 0, 0, 0.06)',
				md: '0 4px 16px rgba(0, 0, 0, 0.08)',
				lg: '0 8px 24px rgba(0, 0, 0, 0.10)',
				xl: '0 12px 32px rgba(0, 0, 0, 0.12)',
				hover: '0 16px 40px rgba(74, 155, 95, 0.20)',
				inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
			},
			animation: {
				'fade-in': 'fadeIn 0.3s ease-out',
				'slide-up': 'slideUp 0.5s ease-out',
				'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
				'pulse-soft': 'pulseSoft 4s ease-in-out infinite',
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				slideUp: {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				scaleIn: {
					'0%': { transform: 'scale(0.9)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' },
				},
				pulseSoft: {
					'0%, 100%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.02)' },
				},
			},
			transitionTimingFunction: {
				'ease-out-custom': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
				'ease-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
				'ease-spring': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
			},
			transitionDuration: {
				'fast': '200ms',
				'normal': '300ms',
				'slow': '500ms',
				'slower': '800ms',
			},
			backgroundImage: {
				'gradient-morning': 'linear-gradient(135deg, #E3F2FD 0%, #FFF3E0 100%)',
				'gradient-calm': 'linear-gradient(180deg, #F5F5F5 0%, #E8F5E9 100%)',
				'gradient-warm': 'linear-gradient(135deg, #FFCCBC 0%, #FF8A65 100%)',
				'gradient-primary': 'linear-gradient(135deg, #4A9B5F, #87CEEB)',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}
