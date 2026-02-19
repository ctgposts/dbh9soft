// Mobile Responsive Utilities
// Helper functions and constants for mobile-first responsive design

export const responsiveClasses = {
  // Padding
  containerPadding: "px-2.5 sm:px-4 md:px-6 lg:px-8",
  sectionPadding: "p-3 sm:p-4 md:p-5 lg:p-6",
  cardPadding: "p-3 sm:p-4 md:p-5 lg:p-6",
  modalPadding: "p-4 sm:p-5 md:p-6",

  // Spacing
  gapSmall: "gap-2 sm:gap-3 md:gap-4",
  gapMedium: "gap-3 sm:gap-4 md:gap-6",
  gapLarge: "gap-4 sm:gap-6 md:gap-8",

  // Text sizes
  textHeading1: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold",
  textHeading2: "text-xl sm:text-2xl md:text-3xl font-bold",
  textHeading3: "text-lg sm:text-xl md:text-2xl font-bold",
  textHeading4: "text-base sm:text-lg md:text-xl font-bold",
  textBody: "text-xs sm:text-sm md:text-base",
  textSmall: "text-xs sm:text-xs md:text-sm",
  textTiny: "text-xs",

  // Card styles
  card: "bg-white rounded-lg sm:rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-3 sm:p-4 md:p-5 lg:p-6",
  cardCompact: "bg-white rounded-lg border border-slate-200 p-2.5 sm:p-3 md:p-4",

  // Button sizes
  buttonLarge: "px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base min-h-12 sm:min-h-14",
  buttonMedium: "px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm min-h-10 sm:min-h-12",
  buttonSmall: "px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs min-h-9 sm:min-h-10",

  // Grid layouts
  gridAuto2: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  gridAuto3: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  gridAuto4: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4",
  gridAuto5: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",

  // Form inputs
  input: "w-full text-xs sm:text-sm min-h-10 sm:min-h-11 px-2.5 sm:px-3 py-1.5 sm:py-2",
  label: "text-xs sm:text-sm font-semibold",

  // Icons
  iconSmall: "w-4 h-4 sm:w-5 sm:h-5",
  iconMedium: "w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8",
  iconLarge: "w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10",

  // Flex gap
  flexGapSmall: "flex gap-1.5 sm:gap-2",
  flexGapMedium: "flex gap-2 sm:gap-3 md:gap-4",
  flexGapLarge: "flex gap-3 sm:gap-4 md:gap-6",

  // Table responsive
  tableResponsive: "w-full text-xs sm:text-sm overflow-x-auto",
  tableHeader: "text-xs font-semibold bg-slate-50",
  tableCell: "px-2 sm:px-3 py-2 sm:py-3",
};

// Breakpoints
export const breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

// Mobile detection utilities
export const isMobileSize = (width: number): boolean => width < breakpoints.md;
export const isTabletSize = (width: number): boolean =>
  width >= breakpoints.md && width < breakpoints.lg;
export const isDesktopSize = (width: number): boolean => width >= breakpoints.lg;

// Format numbers for mobile display
export const formatNumberMobile = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

// Format currency for mobile
export const formatCurrencyMobile = (amount: number, locale = "en-BD"): string => {
  if (amount >= 1000000) {
    return "৳" + (amount / 1000000).toFixed(1) + "M";
  }
  if (amount >= 1000) {
    return "৳" + (amount / 1000).toFixed(0) + "K";
  }
  return "৳" + amount.toLocaleString(locale);
};

// Truncate text for mobile
export const truncateText = (text: string, length: number): string => {
  return text.length > length ? text.substring(0, length) + "..." : text;
};

// Get responsive classes dynamically
export const getResponsiveClass = (
  base: string,
  sm: string,
  md: string,
  lg: string = md
): string => {
  return `${base} sm:${sm} md:${md} lg:${lg}`;
};
