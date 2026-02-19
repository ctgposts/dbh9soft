/* iOS Design System - Tailwind CSS Guidelines */

/*
  This file documents the iOS design system used throughout the application.
  All new components should follow these guidelines for consistency.
*/

/* ============================================================================
   COLOR PALETTE
   ============================================================================ */

/*
  Primary Colors (from brand):
  - Purple: #7c3aed (primary action), #5b21b6 (dark accent)
  - Gradients: from-purple-600 to-blue-600
  
  Secondary Colors (iOS style):
  - Background: white/80 with backdrop-blur-sm
  - Surfaces: bg-gradient-to-br from-[color]-50 to-[color]-50
  - Borders: border-[color]-100/50 to border-[color]-200/80
*/

/* ============================================================================
   TYPOGRAPHY RULES
   ============================================================================ */

/*
  Font Weights (iOS):
  - Headers: font-700 (bold headings)
  - Subheaders: font-600 (section titles)
  - Labels: font-600 with uppercase tracking-wide
  - Body: font-500 for emphasis, default for normal
  - Small text: font-500 for secondary info

  Letter Spacing:
  - Headers: tracking-tight
  - Labels: tracking-wide uppercase
  - Normal: no tracking
*/

/* ============================================================================
   CARD COMPONENTS
   ============================================================================ */

/*
  Base Card Style:
  bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 
  shadow-sm border border-white/60
  hover:shadow-md transition-all duration-300

  Metric Card (smaller):
  bg-white/80 backdrop-blur-sm rounded-3xl p-5 sm:p-6 
  shadow-sm hover:shadow-md transition-all duration-300 
  border border-white/60 hover:border-[color]-200/50

  List Item Card:
  bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl p-4 
  hover:from-slate-100 hover:to-slate-100 transition-all duration-300 
  border border-slate-200/50 hover:border-slate-300/80
*/

/* ============================================================================
   BUTTON & INTERACTIVE ELEMENTS
   ============================================================================ */

/*
  Hover States:
  - group-hover:scale-110 (icon scaling)
  - group-hover:shadow-md (shadow elevation)
  - group-hover:border-[color]-200/80 (border color change)
  - transition-all duration-300 (smooth animation)

  Icon Containers:
  w-12 h-12 rounded-2xl bg-gradient-to-br from-[color]-100 to-[color]-50
  flex items-center justify-center text-xl 
  group-hover:scale-110 transition-transform duration-300
*/

/* ============================================================================
   SPACING & LAYOUT
   ============================================================================ */

/*
  Padding:
  - Large cards: p-6 sm:p-8 (desktop/mobile responsive)
  - Metric cards: p-5 sm:p-6
  - List items: p-4
  
  Gaps:
  - Card grids: gap-4 sm:gap-6 or gap-4 sm:gap-6
  - Internal elements: space-y-3, space-y-4, space-y-6
  - Flex items: gap-2, gap-3
*/

/* ============================================================================
   BORDER RADIUS
   ============================================================================ */

/*
  iOS Standard Radius:
  - Large cards: rounded-3xl
  - Medium components: rounded-2xl
  - Small elements: rounded-lg
  - Full circles: rounded-full
*/

/* ============================================================================
   SHADOWS & BACKDROP
   ============================================================================ */

/*
  Shadow Styles:
  - Light: shadow-sm (default)
  - Elevation: shadow-md (on hover)
  
  Backdrop:
  - Cards: backdrop-blur-sm (frosted glass effect)
  - No backdrop needed for solid colors
*/

/* ============================================================================
   GRADIENT USAGE
   ============================================================================ */

/*
  Color-Specific Gradients:
  - Green: from-green-50 to-emerald-50 (light positive state)
  - Blue: from-blue-50 to-cyan-50 (light info state)
  - Purple: from-purple-50 to-violet-50 (light primary state)
  - Slate: from-slate-50 to-slate-100/50 (neutral list items)
  
  Icon Container Gradients:
  - from-[color]-100 to-[color]-50 (soft color gradient)
  
  Main Background:
  - bg-gradient-to-br from-slate-50 via-white to-slate-50 (subtle page gradient)
*/

/* ============================================================================
   RESPONSIVE DESIGN
   ============================================================================ */

/*
  Mobile First Breakpoints:
  - Default: Mobile (320px+)
  - sm: 640px (tablets)
  - lg: 1024px (desktop)
  
  Text Scaling:
  text-2xl sm:text-3xl (header)
  text-lg sm:text-xl (section title)
  text-xs sm:text-sm (label)
*/

/* ============================================================================
   ANIMATION & TRANSITIONS
   ============================================================================ */

/*
  Standard Transitions:
  transition-all duration-300 (default smooth animation)
  transition-transform duration-300 (transform only)
  transition-colors duration-300 (color changes)
  
  Special Effects:
  animate-pulse (for alerts)
  hover:scale-110 (for icons)
*/

/* ============================================================================
   PRACTICAL EXAMPLES
   ============================================================================ */

/*
  1. Metric Card with Icon:
  
  <div class="group bg-white/80 backdrop-blur-sm rounded-3xl p-5 sm:p-6 
              shadow-sm hover:shadow-md transition-all duration-300 
              border border-white/60 hover:border-purple-200/50">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <p class="text-xs sm:text-sm font-600 text-gray-500 tracking-wide uppercase mb-2">
          Label
        </p>
        <p class="text-2xl sm:text-3xl font-700 text-gray-900">123</p>
        <p class="text-xs text-gray-400 mt-2 font-500">Description</p>
      </div>
      <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 
                  flex items-center justify-center text-xl 
                  group-hover:scale-110 transition-transform duration-300">
        📦
      </div>
    </div>
  </div>

  2. Section Card:
  
  <div class="bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 
              shadow-sm border border-white/60">
    <div class="flex items-center gap-2 mb-6">
      <span class="text-2xl">💰</span>
      <h3 class="text-lg sm:text-xl font-700 text-gray-900">Title</h3>
    </div>
    <!-- Content goes here -->
  </div>

  3. List Item:
  
  <div class="group bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl p-4 
              hover:from-slate-100 hover:to-slate-100 transition-all duration-300 
              border border-slate-200/50 hover:border-slate-300/80">
    <div class="flex items-center justify-between">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-600 text-gray-900">Title</p>
        <p class="text-xs text-gray-500 font-500 mt-1">Subtitle</p>
      </div>
      <div class="text-right ml-4">
        <p class="text-sm font-700 text-gray-900">Value</p>
      </div>
    </div>
  </div>
*/

/* ============================================================================
   DO's AND DON'Ts
   ============================================================================ */

/*
  DO:
  ✓ Use backdrop-blur-sm for frosted glass effect
  ✓ Use rounded-3xl for large containers
  ✓ Use gradient backgrounds for data sections
  ✓ Use group-hover for interactive elements
  ✓ Keep padding consistent (p-5, p-6, p-4)
  ✓ Use font-700 for headers, font-600 for subheaders
  ✓ Use tracking-wide uppercase for labels
  ✓ Add smooth transitions (duration-300)
  ✓ Use white/80 with backdrop for card backgrounds
  ✓ Keep gaps consistent (gap-4 sm:gap-6)
  
  DON'T:
  ✗ Use hard edges (rounded-lg is minimum for modern look)
  ✗ Mix shadow levels (use shadow-sm, shadow-md only)
  ✗ Use harsh colors (prefer pale colors for backgrounds)
  ✗ Skip transitions (all interactive elements need smooth animations)
  ✗ Use old-style flat design (embrace glassmorphism)
  ✗ Mix typography weights (stick to 500, 600, 700)
  ✗ Create rigid layouts (use responsive breakpoints)
  ✗ Forget accessibility (maintain color contrast ratios)
*/

/* ============================================================================
   COLOR REFERENCE FOR STATES
   ============================================================================ */

/*
  Card Border Colors (hover):
  - Blue: hover:border-blue-200/50
  - Green: hover:border-green-200/50
  - Purple: hover:border-purple-200/50
  - Yellow: hover:border-yellow-200/50
  - Indigo: hover:border-indigo-200/50
  - Pink: hover:border-pink-200/50
  - Orange: hover:border-orange-200/50
  - Red: hover:border-red-200/50
  - Slate: hover:border-slate-300/80
  
  Gradient Card Backgrounds:
  - Positive: from-green-50 to-emerald-50
  - Info: from-blue-50 to-cyan-50
  - Primary: from-purple-50 to-violet-50
  - Neutral: from-slate-50 to-slate-100/50
  - Alert: from-red-50 to-pink-50
*/
