/**
 * UNIFIED DESIGN SYSTEM
 * Consistent styling across all pages
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================
export const colors = {
  // Primary Colors - Purple Theme
  primary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    900: '#4c1d95',
  },

  // Secondary - Slate Gray
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    900: '#0f172a',
  },

  // Neutral - Gray Scale
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    400: '#a1a1a3',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    900: '#18181b',
  },

  // Semantic Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Backgrounds
  bg: {
    light: '#ffffff',
    lightSecondary: '#f8fafc',
    lightTertiary: '#f1f5f9',
    dark: '#0f172a',
  },

  // Text
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    light: '#d1d5db',
    inverse: '#ffffff',
  },

  // Border
  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
    dark: '#9ca3af',
  },
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================
export const typography = {
  // Heading Styles
  heading: {
    h1: 'text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight',
    h2: 'text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight',
    h3: 'text-xl sm:text-2xl md:text-3xl font-bold tracking-tight',
    h4: 'text-lg sm:text-xl md:text-2xl font-semibold',
    h5: 'text-base sm:text-lg md:text-xl font-semibold',
    h6: 'text-sm sm:text-base md:text-lg font-semibold',
  },

  // Body Styles
  body: {
    base: 'text-base leading-relaxed',
    sm: 'text-sm leading-normal',
    xs: 'text-xs leading-tight',
  },

  // Label & Helper Text
  label: 'text-sm font-semibold text-gray-700',
  helper: 'text-xs text-gray-600',
  caption: 'text-xs text-gray-500',

  // Weights
  weights: {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
};

// ============================================================================
// SPACING
// ============================================================================
export const spacing = {
  // Consistent spacing scale (in rem/px)
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',   // 48px

  // Tailwind spacing classes
  section: 'space-y-6 sm:space-y-8',
  cardGap: 'gap-4 sm:gap-6',
  contentPadding: 'p-4 sm:p-6 md:p-8',
  sectionPadding: 'px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10',
};

// ============================================================================
// BORDER & RADIUS
// ============================================================================
export const borders = {
  radius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  },

  width: {
    thin: 'border',
    medium: 'border-2',
    thick: 'border-4',
  },
};

// ============================================================================
// SHADOWS
// ============================================================================
export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  none: 'shadow-none',

  // Specific shadow classes
  card: 'shadow-lg hover:shadow-xl transition-shadow duration-300',
  subtle: 'shadow-sm border border-gray-200',
  elevated: 'shadow-xl border border-white/20',
};

// ============================================================================
// COMPONENTS BASE STYLES
// ============================================================================
export const components = {
  // Card Styles
  card: {
    base: 'bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300',
    glass: 'bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300',
    elevated: 'bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300',
    dark: 'bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg border border-slate-700 hover:shadow-xl transition-all duration-300',
  },

  // Button Styles
  button: {
    primary: 'px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
    secondary: 'px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-semibold transition-all duration-300',
    success: 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-all duration-300',
    danger: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-all duration-300',
    ghost: 'px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-semibold transition-all duration-300',
  },

  // Input Styles
  input: 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 placeholder-gray-500',
  select: 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300',
  textarea: 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 resize-vertical',

  // Badge Styles
  badge: {
    primary: 'inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold',
    success: 'inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold',
    warning: 'inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold',
    error: 'inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold',
  },

  // Table Styles
  table: {
    header: 'px-4 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50 border-b border-gray-200',
    cell: 'px-4 py-3 text-sm text-gray-700 border-b border-gray-200',
  },
};

// ============================================================================
// LAYOUT CLASSES
// ============================================================================
export const layouts = {
  // Page Container
  pageContainer: 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50',
  
  // Content Container
  contentContainer: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  
  // Section Wrapper
  section: 'bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8',
  
  // Header
  header: 'sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-md',
  
  // Grid Layouts
  grid: {
    cols1: 'grid grid-cols-1',
    cols2: 'grid grid-cols-1 sm:grid-cols-2',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    colsAuto: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max',
  },
};

// ============================================================================
// GRADIENT STYLES
// ============================================================================
export const gradients = {
  bg: {
    primary: 'bg-gradient-to-br from-purple-600 to-purple-900',
    secondary: 'bg-gradient-to-br from-slate-800 to-slate-900',
    light: 'bg-gradient-to-br from-slate-50 via-white to-slate-50',
    card: 'bg-gradient-to-br from-white to-gray-50',
  },

  text: {
    primary: 'bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent',
  },

  border: {
    primary: 'from-purple-600 to-purple-800',
  },
};

// ============================================================================
// ANIMATION CLASSES
// ============================================================================
export const animations = {
  transition: 'transition-all duration-300 ease-in-out',
  hoverScale: 'hover:scale-105 transition-transform duration-300',
  hoverShadow: 'hover:shadow-lg transition-shadow duration-300',
  slideDown: 'animate-in slide-in-from-top-2 duration-300',
  fadeIn: 'animate-in fade-in duration-300',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Merge multiple class strings intelligently
 */
export const mergeClasses = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Create a styled component class string
 */
export const createComponentClass = (variant: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' = 'primary'): string => {
  return components.button[variant as keyof typeof components.button];
};

/**
 * Get responsive spacing classes
 */
export const getResponsiveSpacing = (base: string, sm?: string, md?: string): string => {
  return mergeClasses(base, sm && `sm:${sm}`, md && `md:${md}`);
};
