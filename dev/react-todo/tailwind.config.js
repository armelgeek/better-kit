/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			animation: {
				"bounce-in": "bounceIn 0.6s ease-out",
				"slide-in": "slideIn 0.3s ease-out",
				"fade-in": "fadeIn 0.2s ease-out",
			},
			keyframes: {
				bounceIn: {
					"0%": { transform: "scale(0.3)", opacity: "0" },
					"50%": { transform: "scale(1.05)", opacity: "0.8" },
					"70%": { transform: "scale(0.9)", opacity: "1" },
					"100%": { transform: "scale(1)", opacity: "1" },
				},
				slideIn: {
					"0%": { transform: "translateX(-20px)", opacity: "0" },
					"100%": { transform: "translateX(0)", opacity: "1" },
				},
				fadeIn: {
					"0%": { opacity: "0" },
					"100%": { opacity: "1" },
				},
			},
		},
	},
	plugins: [],
};
