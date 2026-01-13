import type { Config } from "tailwindcss";

export default {
	darkMode: "media",
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
		fontFamily: {
			'inter': ['Inter', 'sans-serif'],
			'sans': ['Inter', 'system-ui', 'sans-serif'],
			'playfair': ['Playfair Display', 'Georgia', 'serif'],
			'outfit': ['Outfit', 'Inter', 'sans-serif'],
		},
			colors: {
				border: 'hsl(var(--border))',
				// Luxury Header System Colors
				luxury: {
					'near-black': 'hsl(var(--luxury-near-black))',
					ink: 'hsl(var(--luxury-ink))',
					gray: 'hsl(var(--luxury-gray))',
					hairline: 'hsl(var(--luxury-hairline))',
					stage: 'hsl(var(--luxury-stage))',
					action: 'hsl(var(--luxury-action))',
				},
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				gray: {
					25: 'hsl(var(--gray-25))',
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				portable: {
					DEFAULT: 'hsl(var(--portable))',
					foreground: 'hsl(var(--portable-foreground))'
				},
				'mid-range': {
					DEFAULT: 'hsl(var(--mid-range))',
					foreground: 'hsl(var(--mid-range-foreground))'
				},
				'high-performance': {
					DEFAULT: 'hsl(var(--high-performance))',
					foreground: 'hsl(var(--high-performance-foreground))'
				},
				'v8-racing': {
					DEFAULT: 'hsl(var(--v8-racing))',
					foreground: 'hsl(var(--v8-racing-foreground))'
				},
				'in-stock': {
					DEFAULT: 'hsl(var(--in-stock))',
					foreground: 'hsl(var(--in-stock-foreground))'
				},
				'on-order': {
					DEFAULT: 'hsl(var(--on-order))',
					foreground: 'hsl(var(--on-order-foreground))'
				},
				'special-order': {
					DEFAULT: 'hsl(var(--special-order))',
					foreground: 'hsl(var(--special-order-foreground))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				// Fade Animations
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-out': {
					'0%': { opacity: '1', transform: 'translateY(0)' },
					'100%': { opacity: '0', transform: 'translateY(10px)' }
				},
				// Scale Animations
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'scale-out': {
					from: { transform: 'scale(1)', opacity: '1' },
					to: { transform: 'scale(0.95)', opacity: '0' }
				},
				// Slide Animations
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'slide-out-right': {
					'0%': { transform: 'translateX(0)' },
					'100%': { transform: 'translateX(100%)' }
				},
			// Shimmer effect for skeletons
				'shimmer': {
					'0%': { backgroundPosition: '-1000px 0' },
					'100%': { backgroundPosition: '1000px 0' }
				},
				// Floating animation for icons
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-6px)' }
				},
				// Shimmer sweep for banners
				'shimmer-sweep': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-out': 'fade-out 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'scale-out': 'scale-out 0.2s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'slide-out-right': 'slide-out-right 0.3s ease-out',
				'shimmer': 'shimmer 2s infinite linear',
				'float': 'float 3s ease-in-out infinite',
				'shimmer-sweep': 'shimmer-sweep 3s ease-in-out infinite',
				// Combined Animations
				'enter': 'fade-in 0.3s ease-out, scale-in 0.2s ease-out',
				'exit': 'fade-out 0.3s ease-out, scale-out 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
