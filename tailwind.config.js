module.exports = {
  content: ["./pages/*.{html,js}", "./index.html", "./js/*.js"],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        primary: {
          50: "#F0F4EF", // Very light forest green
          100: "#D4E2D1", // Light forest green
          200: "#A9C5A3", // Medium light forest green
          300: "#7EA875", // Medium forest green
          400: "#538B47", // Medium dark forest green
          500: "#2D5A27", // Deep forest green - base
          600: "#244819", // Darker forest green
          700: "#1B360B", // Very dark forest green
          800: "#122400", // Almost black forest green
          900: "#091200", // Black forest green
          DEFAULT: "#2D5A27", // Deep forest green
        },
        // Secondary Colors
        secondary: {
          50: "#F2F6F3", // Very light secondary green
          100: "#D8E6DC", // Light secondary green
          200: "#B1CDB9", // Medium light secondary green
          300: "#8AB496", // Medium secondary green
          400: "#639B73", // Medium dark secondary green
          500: "#4A7C59", // Growing confidence green - base
          600: "#3C6347", // Darker secondary green
          700: "#2E4A35", // Very dark secondary green
          800: "#203123", // Almost black secondary green
          900: "#121811", // Black secondary green
          DEFAULT: "#4A7C59", // Growing confidence green
        },
        // Accent Colors
        accent: {
          50: "#FFF4F0", // Very light orange
          100: "#FFE0D1", // Light orange
          200: "#FFC1A3", // Medium light orange
          300: "#FFA275", // Medium orange
          400: "#FF8347", // Medium dark orange
          500: "#FF6B35", // Harvest excitement orange - base
          600: "#E5522A", // Darker orange
          700: "#CC391F", // Very dark orange
          800: "#B22014", // Almost black orange
          900: "#990709", // Black orange
          DEFAULT: "#FF6B35", // Harvest excitement orange
        },
        // Background Colors
        background: "#FEFEFE", // Clean canvas white
        surface: "#F8F9F7", // Subtle depth off-white
        // Text Colors
        text: {
          primary: "#1A1A1A", // High contrast black
          secondary: "#666666", // Medium gray
        },
        // Status Colors
        success: {
          50: "#E8F5E8", // Very light success green
          100: "#C8E6C9", // Light success green
          200: "#A5D6A7", // Medium light success green
          300: "#81C784", // Medium success green
          400: "#66BB6A", // Medium dark success green
          500: "#4CAF50", // Growth celebration green - base
          600: "#43A047", // Darker success green
          700: "#388E3C", // Very dark success green
          800: "#2E7D32", // Almost black success green
          900: "#1B5E20", // Black success green
          DEFAULT: "#4CAF50", // Growth celebration green
        },
        warning: {
          50: "#FFF8E1", // Very light warning orange
          100: "#FFECB3", // Light warning orange
          200: "#FFE082", // Medium light warning orange
          300: "#FFD54F", // Medium warning orange
          400: "#FFCC02", // Medium dark warning orange
          500: "#FFA726", // Gentle attention orange - base
          600: "#FB8C00", // Darker warning orange
          700: "#F57C00", // Very dark warning orange
          800: "#EF6C00", // Almost black warning orange
          900: "#E65100", // Black warning orange
          DEFAULT: "#FFA726", // Gentle attention orange
        },
        error: {
          50: "#FFEBEE", // Very light error red
          100: "#FFCDD2", // Light error red
          200: "#EF9A9A", // Medium light error red
          300: "#E57373", // Helpful guidance red - base
          400: "#EF5350", // Medium dark error red
          500: "#F44336", // Medium error red
          600: "#E53935", // Darker error red
          700: "#D32F2F", // Very dark error red
          800: "#C62828", // Almost black error red
          900: "#B71C1C", // Black error red
          DEFAULT: "#E57373", // Helpful guidance red
        },
        // Border Colors
        border: {
          light: "#E8E8E8", // Light gray border
          accent: "#FF6B35", // Accent orange border
          DEFAULT: "#E8E8E8", // Light gray border
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      boxShadow: {
        'sm': '0 4px 12px rgba(45, 90, 39, 0.08)',
        'md': '0 8px 24px rgba(45, 90, 39, 0.12)',
        'lg': '0 8px 24px rgba(45, 90, 39, 0.12)',
        'xl': '0 12px 32px rgba(45, 90, 39, 0.15)',
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
}