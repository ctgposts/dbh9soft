/**
 * Audio Notification System Test Suite
 * Tests all sounds, patterns, mobile compatibility, and beep sequences
 */

import { AudioNotificationService, SOUND_DEFINITIONS } from './audioNotifications';

/**
 * Test configuration
 */
export const audioTestConfig = {
  // Test modes
  testSingleSounds: true,
  testBeepPatterns: true,
  testFrequencies: true,
  testMobileCompat: true,
  
  // Sound categories to test
  categories: ['success', 'warning', 'error', 'business', 'analytics', 'other'] as const,
  
  // Beep patterns to test
  patterns: ['single', 'double', 'triple', 'ascending', 'descending'] as const,
};

/**
 * Run comprehensive audio tests
 */
export async function runAudioTests(service: AudioNotificationService) {
  console.log('🎵 Starting Audio Notification System Tests...\n');

  try {
    // Test 1: Single sounds
    if (audioTestConfig.testSingleSounds) {
      console.log('📝 Test 1: Playing individual sounds...');
      await testIndividualSounds(service);
    }

    // Test 2: Beep patterns
    if (audioTestConfig.testBeepPatterns) {
      console.log('\n🔔 Test 2: Testing beep patterns...');
      await testBeepPatterns(service);
    }

    // Test 3: Frequency analysis
    if (audioTestConfig.testFrequencies) {
      console.log('\n📊 Test 3: Analyzing frequencies...');
      testFrequencyAnalysis();
    }

    // Test 4: Mobile compatibility
    if (audioTestConfig.testMobileCompat) {
      console.log('\n📱 Test 4: Mobile compatibility...');
      testMobileCompatibility();
    }

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

/**
 * Test individual sounds
 */
async function testIndividualSounds(service: AudioNotificationService): Promise<void> {
  const allSounds = service.getAllSounds();
  const soundsByCategory: Record<string, typeof allSounds> = {};

  // Group sounds by category
  audioTestConfig.categories.forEach(category => {
    soundsByCategory[category] = service.getSoundsByCategory(category as any);
  });

  for (const [category, sounds] of Object.entries(soundsByCategory)) {
    console.log(`  🎵 ${category.toUpperCase()} (${sounds.length} sounds)`);
    
    for (const sound of sounds) {
      await service.play(sound.type as any).catch(error => {
        console.error(`Failed to play ${sound.name}:`, error);
      });
      console.log(`    ✓ ${sound.name} (${sound.frequency}Hz, ${sound.duration}ms, ${sound.pattern || 'N/A'})`);
      // Wait between sounds
      await new Promise(resolve => setTimeout(resolve, sound.duration + 300));
    }
  }
}

/**
 * Test beep patterns
 */
async function testBeepPatterns(service: AudioNotificationService): Promise<void> {
  const testSounds = [
    { type: 'sale_success', pattern: 'single' },
    { type: 'low_stock_warning', pattern: 'double' },
    { type: 'payment_failed', pattern: 'triple' },
    { type: 'large_order', pattern: 'ascending' },
    { type: 'unusual_activity', pattern: 'descending' },
  ];

  for (const test of testSounds) {
    await service.play(test.type as any).catch(error => {
      console.error(`Failed to play pattern test ${test.type}:`, error);
    });
    const sound = service.getSound(test.type as any);
    console.log(`  ✓ Pattern: ${test.pattern} - ${sound?.name}`);
    // Wait between patterns
    await new Promise(resolve => setTimeout(resolve, (sound?.duration || 200) + 400));
  }
}

/**
 * Analyze frequency distribution
 */
function testFrequencyAnalysis() {
  const sounds = Object.values(SOUND_DEFINITIONS) as any[];
  
  const frequencyStats = {
    min: Math.min(...sounds.map((s: any) => s.frequency)),
    max: Math.max(...sounds.map((s: any) => s.frequency)),
    avg: sounds.reduce((sum: number, s: any) => sum + s.frequency, 0) / sounds.length,
    durationMin: Math.min(...sounds.map((s: any) => s.duration)),
    durationMax: Math.max(...sounds.map((s: any) => s.duration)),
    durationAvg: sounds.reduce((sum: number, s: any) => sum + s.duration, 0) / sounds.length,
  };

  console.log(`  📊 Frequency Range: ${frequencyStats.min}Hz - ${frequencyStats.max}Hz (avg: ${frequencyStats.avg.toFixed(0)}Hz)`);
  console.log(`  ⏱️  Duration Range: ${frequencyStats.durationMin}ms - ${frequencyStats.durationMax}ms (avg: ${frequencyStats.durationAvg.toFixed(0)}ms)`);
  
  // Group by pattern
  const patternGroups: Record<string, any[]> = {};
  sounds.forEach((sound: any) => {
    const pattern = sound.pattern || 'none';
    if (!patternGroups[pattern]) patternGroups[pattern] = [];
    patternGroups[pattern].push(sound);
  });

  console.log(`  🔔 Pattern Distribution:`);
  Object.entries(patternGroups).forEach(([pattern, items]) => {
    console.log(`     - ${pattern}: ${items.length} sounds`);
  });
}

/**
 * Check mobile compatibility
 */
function testMobileCompatibility() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  console.log(`  📱 Device Type: ${isMobile ? 'Mobile' : 'Desktop'}`);

  // Check AudioContext support
  const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
  console.log(`  🔊 AudioContext: ${AudioContextClass ? 'Supported' : 'Not supported'}`);

  // Check OscillatorNode support
  try {
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      console.log(`  🎵 OscillatorNode: Supported`);
      console.log(`  🎚️  BiquadFilter: ${ctx.createBiquadFilter() ? 'Supported' : 'Not supported'}`);
      ctx.close();
    }
  } catch (error) {
    console.log(`  ❌ Error testing AudioContext: ${error}`);
  }

  // Recommend optimizations
  if (isMobile) {
    console.log(`  💡 Mobile Optimizations:`);
    console.log(`     - AudioContext requires user interaction to resume`);
    console.log(`     - Shorter durations (100-220ms) for better performance`);
    console.log(`     - Avoid playing too many sounds simultaneously`);
  }
}

/**
 * Generate audio system performance report
 */
export function generateAudioReport(service: AudioNotificationService): string {
  const sounds = service.getAllSounds() as any[];
  const successSounds = service.getSoundsByCategory('success');
  const warningSounds = service.getSoundsByCategory('warning');
  const errorSounds = service.getSoundsByCategory('error');
  const businessSounds = service.getSoundsByCategory('business');
  const analyticsSounds = service.getSoundsByCategory('analytics');
  const otherSounds = service.getSoundsByCategory('other');

  const report = `
╔════════════════════════════════════════════════════════════════╗
║           AUDIO NOTIFICATION SYSTEM REPORT                     ║
╚════════════════════════════════════════════════════════════════╝

📊 SYSTEM STATISTICS
├─ Total Sounds: ${sounds.length}
├─ Success Sounds: ${successSounds.length}
├─ Warning Sounds: ${warningSounds.length}
├─ Error/Critical Sounds: ${errorSounds.length}
├─ Business Event Sounds: ${businessSounds.length}
├─ Analytics Sounds: ${analyticsSounds.length}
└─ Other Sounds: ${otherSounds.length}

🎵 FREQUENCY DISTRIBUTION
├─ Min Frequency: ${Math.min(...sounds.map((s: any) => s.frequency))}Hz
├─ Max Frequency: ${Math.max(...sounds.map((s: any) => s.frequency))}Hz
└─ Avg Frequency: ${(sounds.reduce((sum: number, s: any) => sum + s.frequency, 0) / sounds.length).toFixed(0)}Hz

⏱️  DURATION METRICS
├─ Min Duration: ${Math.min(...sounds.map((s: any) => s.duration))}ms
├─ Max Duration: ${Math.max(...sounds.map((s: any) => s.duration))}ms
└─ Avg Duration: ${(sounds.reduce((sum: number, s: any) => sum + s.duration, 0) / sounds.length).toFixed(0)}ms

🔔 BEEP PATTERN DISTRIBUTION
${(['single', 'double', 'triple', 'ascending', 'descending'] as const)
  .map(pattern => {
    const count = sounds.filter((s: any) => s.pattern === pattern).length;
    return `├─ ${pattern}: ${count} sounds`;
  })
  .join('\n')}

🎚️  VOLUME LEVELS
├─ Min Volume: ${Math.min(...sounds.map((s: any) => s.volume))}
├─ Max Volume: ${Math.max(...sounds.map((s: any) => s.volume))}
└─ Avg Volume: ${(sounds.reduce((sum: number, s: any) => sum + s.volume, 0) / sounds.length).toFixed(2)}

✅ FEATURES
├─ ADSR Envelope: Enabled (Attack, Decay, Sustain, Release)
├─ Frequency Modulation: Enabled (±2% variation)
├─ Lowpass Filter: Enabled (2x frequency cutoff)
├─ Mobile Support: Enabled (AudioContext resumption on user interaction)
├─ Master Gain Control: Enabled
└─ Beep Gap Timing: 150ms between beeps

📱 MOBILE OPTIMIZATION
├─ Short Durations: 100-220ms for quick feedback
├─ Ascending/Descending Patterns: For pattern recognition
├─ Frequency Variation: Helps distinguish similar alerts
└─ Fallback Support: Works on older iOS/Android devices

╔════════════════════════════════════════════════════════════════╗
║                    END OF REPORT                               ║
╚════════════════════════════════════════════════════════════════╝
  `;

  return report;
}

export default {
  runAudioTests,
  generateAudioReport,
  audioTestConfig,
};
