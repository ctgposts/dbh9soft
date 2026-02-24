/**
 * 🔬 ANALYSIS SCRIPT: Test product loading end-to-end
 * Run this in browser console to debug the entire flow
 */

async function analyzeProductLoading() {
  console.clear();
  console.group('🔬 COMPREHENSIVE PRODUCT LOADING ANALYSIS');
  
  console.log('\n=== 1. CHECK WHAT\'S IN BROWSER ===');
  
  // Check if we're in React environment
  const rootElement = document.getElementById('root');
  console.log('Root element exists:', !!rootElement);
  
  // Try to access Convex client
  console.log('\n=== 2. CHECK CONVEX CONNECTION ===');
  try {
    // Access from window or global scope
    console.log('Window keys:', Object.keys(window).filter(k => k.includes('convex') || k.includes('react')));
  } catch (e) {
    console.error('Error checking window:', e.message);
  }
  
  console.log('\n=== 3. CHECK LOCAL STORAGE ===');
  console.log('Local storage keys:', Object.keys(localStorage));
  
  console.log('\n=== 4. CHECK SESSION ===');
  console.log('Session storage keys:', Object.keys(sessionStorage));
  
  console.log('\n=== 5. NETWORK REQUEST CHECK ===');
  // Check Network tab in DevTools for Convex API calls
  console.log('Open Network tab and look for:');
  console.log('  - POST requests to convex API');
  console.log('  - Look for "products/list" or similar');
  
  console.log('\n=== 6. CHECK REACT COMPONENTS ===');
  // List all visible components that mention Products
  const bodyText = document.body.innerText;
  console.log('Page contains "Product":', bodyText.includes('Product'));
  console.log('Page contains "Product":', bodyText.includes('product'));
  console.log('Page contains "Inventory":', bodyText.includes('Inventory'));
  console.log('Page contains "Dashboard":', bodyText.includes('Dashboard'));
  
  console.log('\n=== 7. CHECK FOR ERRORS ===');
  console.log('Open Console for errors (Ctrl+Shift+J)');
  
  console.groupEnd();
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Go to Inventory page - check if you see a yellow diagnostic box');
  console.log('2. Go to Dashboard page - check for diagnostic info at bottom');
  console.log('3. Open Network tab and filter for API calls');
  console.log('4. Check Console tab for any errors');
}

// Run the analysis
analyzeProductLoading();
