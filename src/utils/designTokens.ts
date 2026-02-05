/**
 * Modern Design Token System
 * Unified color, spacing, and typography for all pages
 */

export const colors = {
  // Primary Colors
  primary: {
    50: '#f3e8ff',
    100: '#e9d5ff',
    500: '#a855f7',
    600: '#9333ea',
    900: '#581c87',
  },
  // Neutral Colors
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    500: '#64748b',
    600: '#475569',
    900: '#0f172a',
  },
  // Semantic Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    900: '#15803d',
  },
  warning: {
    50: '#fefce8',
    100: '#fef3c7',
    500: '#eab308',
    600: '#ca8a04',
    900: '#713f12',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    900: '#7f1d1d',
  },
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9',
    600: '#0284c7',
    900: '#0c2d6b',
  },
};

export const spacing = {
  xs: '0.5rem',  // 8px
  sm: '1rem',    // 16px
  md: '1.5rem',  // 24px
  lg: '2rem',    // 32px
  xl: '3rem',    // 48px
  '2xl': '4rem', // 64px
};

export const typography = {
  // Headings
  h1: 'text-4xl sm:text-5xl font-bold tracking-tight',
  h2: 'text-3xl sm:text-4xl font-bold tracking-tight',
  h3: 'text-2xl sm:text-3xl font-bold',
  h4: 'text-xl sm:text-2xl font-bold',
  h5: 'text-lg sm:text-xl font-semibold',
  h6: 'text-base sm:text-lg font-semibold',
  
  // Body
  body: 'text-sm sm:text-base leading-relaxed',
  bodySmall: 'text-xs sm:text-sm leading-relaxed',
  
  // Special
  label: 'text-xs font-semibold uppercase tracking-wider',
  caption: 'text-xs font-medium',
};

export const components = {
  // Card Styles
  card: 'bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all',
  cardPadding: 'p-5 sm:p-6',
  
  // Button Styles
  buttonPrimary: 'px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors',
  buttonSecondary: 'px-4 py-2 bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200 font-semibold transition-colors',
  
  // Input Styles
  input: 'w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
  
  // Badge Styles
  badgePrimary: 'inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold',
  badgeSuccess: 'inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold',
  badgeWarning: 'inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold',
  badgeError: 'inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold',
};

export const layout = {
  container: 'mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl',
  pageWrapper: 'min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50',
  contentPadding: 'py-8 md:py-12',
  sectionGap: 'space-y-8',
  gridGap: 'gap-4 sm:gap-6',
};

export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
};

export const transitions = {
  fast: 'transition-all duration-200',
  normal: 'transition-all duration-300',
  slow: 'transition-all duration-500',
};
