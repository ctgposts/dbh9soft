/**
 * MASTER STYLING UTILITIES
 * Apply consistent design across all pages
 */

// ============================================================================
// PAGE LAYOUT UTILITIES
// ============================================================================

export const pageStyles = {
  // Main page container
  pageContainer: 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50',
  
  // Content wrapper with max-width
  contentWrapper: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10',
  
  // Page spacing
  pageSpacing: 'space-y-6 sm:space-y-8 md:space-y-10',
};

// ============================================================================
// HEADER STYLES
// ============================================================================

export const headerStyles = {
  // Main page header
  pageHeader: 'mb-8 pb-6 border-b border-gray-200',
  
  // Header title container
  titleContainer: 'flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4',
  
  // Title style
  title: 'text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 flex items-center gap-3',
  
  // Icon style
  icon: 'text-4xl sm:text-5xl',
  
  // Subtitle
  subtitle: 'mt-2 text-base sm:text-lg text-gray-600',
};

// ============================================================================
// SECTION STYLES
// ============================================================================

export const sectionStyles = {
  // Standard white section card
  card: 'bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8 hover:shadow-xl transition-all duration-300',
  
  // Glass morphism section
  glass: 'bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-lg p-4 sm:p-6 md:p-8',
  
  // Gradient section
  gradient: 'bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8',
  
  // Dark section
  dark: 'bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg border border-slate-700 p-4 sm:p-6 md:p-8 text-white',
  
  // Section header
  sectionHeader: 'mb-6 pb-4 border-b border-gray-200',
  
  // Section title
  sectionTitle: 'text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2',
  
  // Section subtitle
  sectionSubtitle: 'mt-2 text-sm sm:text-base text-gray-600',
};

// ============================================================================
// FORM STYLES
// ============================================================================

export const formStyles = {
  // Input base style
  input: 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-500 text-sm',
  
  // Select style
  select: 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm',
  
  // Textarea style
  textarea: 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-500 text-sm resize-vertical',
  
  // Label style
  label: 'block text-sm font-semibold text-gray-700 mb-2',
  
  // Helper text
  helper: 'mt-1 text-xs sm:text-sm text-gray-600',
  
  // Error message
  error: 'mt-1 text-xs sm:text-sm text-red-600 font-medium',
  
  // Form field container
  field: 'space-y-2',
  
  // Form group
  group: 'space-y-4 sm:space-y-6',
  
  // Checkbox/Radio group
  checkGroup: 'flex items-center gap-2',
};

// ============================================================================
// BUTTON STYLES
// ============================================================================

export const buttonStyles = {
  // Primary button
  primary: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl',
  
  // Secondary button
  secondary: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-semibold transition-all duration-300 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Success button
  success: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-all duration-300 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Danger button
  danger: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-all duration-300 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Ghost button
  ghost: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-semibold transition-all duration-300 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Outline button
  outline: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition-all duration-300 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Icon button
  icon: 'inline-flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Small button
  small: 'px-3 py-1.5 text-xs sm:text-sm',
  
  // Large button
  large: 'px-6 py-3 text-base sm:text-lg',
};

// ============================================================================
// TABLE STYLES
// ============================================================================

export const tableStyles = {
  // Table container
  container: 'w-full overflow-x-auto rounded-lg border border-gray-200',
  
  // Table element
  table: 'w-full',
  
  // Table header
  thead: 'bg-gray-50 border-b-2 border-gray-200',
  
  // Table header cell
  th: 'px-4 py-3 text-left text-xs sm:text-sm font-bold text-gray-900',
  
  // Table body
  tbody: 'divide-y divide-gray-200',
  
  // Table row
  tr: 'hover:bg-gray-50 transition-colors duration-150 cursor-pointer',
  
  // Table cell
  td: 'px-4 py-3 text-sm text-gray-700',
  
  // Empty state
  empty: 'text-center py-12 text-gray-600',
};

// ============================================================================
// CARD STYLES
// ============================================================================

export const cardStyles = {
  // Stat card
  stat: 'rounded-xl border-2 p-4 sm:p-6 hover:shadow-lg transition-all duration-300',
  
  // List item card
  item: 'bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-white hover:shadow-md transition-all duration-300',
  
  // Highlight card
  highlight: 'bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4 sm:p-6',
};

// ============================================================================
// BADGE/TAG STYLES
// ============================================================================

export const badgeStyles = {
  // Primary badge
  primary: 'inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold',
  
  // Success badge
  success: 'inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold',
  
  // Warning badge
  warning: 'inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold',
  
  // Error badge
  error: 'inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold',
  
  // Gray badge
  gray: 'inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold',
};

// ============================================================================
// MODAL/DIALOG STYLES
// ============================================================================

export const modalStyles = {
  // Overlay
  overlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
  
  // Modal container
  container: 'bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto shadow-2xl',
  
  // Modal header
  header: 'px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between',
  
  // Modal title
  title: 'text-lg sm:text-xl font-semibold text-gray-900',
  
  // Modal body
  body: 'px-4 sm:px-6 py-4 sm:py-6',
  
  // Modal footer
  footer: 'px-4 sm:px-6 py-4 border-t border-gray-200 flex justify-end gap-2',
};

// ============================================================================
// ALERT/NOTIFICATION STYLES
// ============================================================================

export const alertStyles = {
  // Success alert
  success: 'rounded-lg border-2 border-green-200 bg-green-50 p-4 text-green-800',
  
  // Error alert
  error: 'rounded-lg border-2 border-red-200 bg-red-50 p-4 text-red-800',
  
  // Warning alert
  warning: 'rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4 text-yellow-800',
  
  // Info alert
  info: 'rounded-lg border-2 border-blue-200 bg-blue-50 p-4 text-blue-800',
};

// ============================================================================
// GRID LAYOUTS
// ============================================================================

export const gridStyles = {
  // 2-column grid
  col2: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6',
  
  // 3-column grid
  col3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
  
  // 4-column grid
  col4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6',
  
  // Responsive grid
  responsive: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6',
};

// ============================================================================
// SPACING UTILITIES
// ============================================================================

export const spacing = {
  // Section spacing
  section: 'space-y-6 sm:space-y-8',
  
  // Content spacing
  content: 'space-y-4 sm:space-y-6',
  
  // Compact spacing
  compact: 'space-y-2 sm:space-y-3',
};

// ============================================================================
// ANIMATION UTILITIES
// ============================================================================

export const animations = {
  // Smooth transition
  transition: 'transition-all duration-300 ease-in-out',
  
  // Hover scale
  hoverScale: 'hover:scale-105 transition-transform duration-300',
  
  // Hover shadow
  hoverShadow: 'hover:shadow-lg transition-shadow duration-300',
  
  // Slide in
  slideIn: 'animate-in slide-in-from-top-2 duration-300',
  
  // Fade in
  fadeIn: 'animate-in fade-in duration-300',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Combine multiple class strings
 */
export const cn = (...classes: (string | undefined | false | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Get button class by variant
 */
export const getButtonClass = (variant: keyof typeof buttonStyles): string => {
  return buttonStyles[variant];
};

/**
 * Get badge class by type
 */
export const getBadgeClass = (type: keyof typeof badgeStyles): string => {
  return badgeStyles[type];
};

/**
 * Get alert class by type
 */
export const getAlertClass = (type: keyof typeof alertStyles): string => {
  return alertStyles[type];
};

/**
 * Get grid class by columns
 */
export const getGridClass = (cols: '2' | '3' | '4' | 'responsive'): string => {
  return gridStyles[`col${cols}` as keyof typeof gridStyles] || gridStyles.responsive;
};
