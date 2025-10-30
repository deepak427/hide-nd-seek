// Hide & Seek Game Theme - Design System
export const Theme = {
    // Hide & Seek Color Palette
    primaryDark: '#222831',    // Main backgrounds, headers
    secondaryDark: '#393E46',  // Secondary backgrounds, panels
    accentCyan: '#00ADB5',     // Interactive elements, highlights
    lightGray: '#EEEEEE',      // Text, borders, icons

    // Semantic color mappings
    bgPrimary: '#222831',
    bgSecondary: '#393E46',
    bgPanel: '#393E46',
    bgModal: '#222831',

    // Text colors
    textPrimary: '#EEEEEE',
    textSecondary: 'rgba(238, 238, 238, 0.8)',
    textMuted: 'rgba(238, 238, 238, 0.6)',

    // Interactive colors
    accentPrimary: '#00ADB5',
    accentHover: '#00969e',
    accentActive: '#007a80',

    // Status colors
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#00ADB5',

    // UI elements
    border: 'rgba(238, 238, 238, 0.2)',
    borderLight: 'rgba(238, 238, 238, 0.1)',
    shadow: 'rgba(34, 40, 49, 0.5)',
    shadowHeavy: 'rgba(34, 40, 49, 0.8)',

    // Gradients
    gradientPrimary: 'linear-gradient(135deg, #222831 0%, #393E46 100%)',
    gradientAccent: 'linear-gradient(135deg, #00ADB5 0%, #00969e 100%)',
    gradientDark: 'linear-gradient(135deg, #222831 0%, #393E46 100%)',

    // Animation durations (ms)
    animationFast: 150,
    animationMedium: 300,
    animationSlow: 500,

    // Border radius (px)
    radiusSmall: 4,
    radiusMedium: 8,
    radiusLarge: 12,
    radiusXLarge: 16,

    // Spacing (px)
    spacingXS: 4,
    spacingS: 8,
    spacingM: 16,
    spacingL: 24,
    spacingXL: 32,
    spacingXXL: 48,

    // Typography
    fontSizeXS: '12px',
    fontSizeSmall: '14px',
    fontSizeMedium: '16px',
    fontSizeLarge: '18px',
    fontSizeXLarge: '20px',
    fontSizeXXLarge: '24px',
    fontSizeHuge: '32px',

    // Z-index layers
    zIndexBackground: 0,
    zIndexContent: 1,
    zIndexUI: 10,
    zIndexModal: 100,
    zIndexTooltip: 1000,
} as const;

export type ThemeType = typeof Theme;