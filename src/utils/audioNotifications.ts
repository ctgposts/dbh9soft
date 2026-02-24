/**
 * Audio Notification System
 * 30+ sounds for various business events
 */

export type NotificationSoundType = 
  // ✅ Success Events (1-6)
  | 'sale_success'
  | 'sale_complete'
  | 'refund_approved'
  | 'payment_received'
  | 'order_confirmed'
  | 'task_completed'
  
  // ⚠️ Warning Events (7-12)
  | 'low_stock_warning'
  | 'high_discount_alert'
  | 'price_mismatch'
  | 'inventory_alert'
  | 'expiry_approaching'
  | 'customer_limit_warning'
  
  // 🔴 Critical/Error Events (13-19)
  | 'payment_failed'
  | 'system_error'
  | 'critical_error'
  | 'critical_inventory'
  | 'transaction_error'
  | 'customer_credit_exceeded'
  | 'invalid_transaction'
  | 'refund_rejected'
  
  // 💼 Business Events (20-25)
  | 'new_customer'
  | 'large_order'
  | 'bulk_order'
  | 'bulk_sale'
  | 'vip_customer_purchase'
  | 'return_received'
  | 'supplier_delivery'
  
  // 📊 Analytics & Monitoring (26-31)
  | 'daily_target_reached'
  | 'monthly_milestone'
  | 'performance_boost'
  | 'unusual_activity'
  | 'system_check'
  | 'backup_complete'
  
  // 🎯 Additional (31+)
  | 'countdown_timer'
  | 'shift_change'
  | 'employee_checkin'
  | 'customer_alert'
  | 'loyalty_earned';

interface NotificationSound {
  type: NotificationSoundType;
  name: string;
  description: string;
  frequency: number; // Hz
  duration: number; // ms
  volume: number; // 0-1
  pattern: 'single' | 'double' | 'triple' | 'ascending' | 'descending'; // Beep pattern
}

// Sound definitions with Web Audio API parameters
export const SOUND_DEFINITIONS: Record<NotificationSoundType, NotificationSound> = {
  // ✅ Success Sounds
  sale_success: {
    type: 'sale_success',
    name: 'বিক্রয় সফল',
    description: 'নতুন বিক্রয় সম্পন্ন হয়েছে',
    frequency: 800,
    duration: 150,
    volume: 0.8,
    pattern: 'double',
  },
  sale_complete: {
    type: 'sale_complete',
    name: 'বিক্রয় সম্পূর্ণ',
    description: 'বিক্রয় প্রক্রিয়া সম্পূর্ণ',
    frequency: 1000,
    duration: 120,
    volume: 0.85,
    pattern: 'ascending',
  },
  refund_approved: {
    type: 'refund_approved',
    name: 'রিফান্ড অনুমোদিত',
    description: 'রিফান্ড অনুমোদিত হয়েছে',
    frequency: 900,
    duration: 140,
    volume: 0.8,
    pattern: 'double',
  },
  refund_rejected: {
    type: 'refund_rejected',
    name: 'রিফান্ড প্রত্যাখ্যাত',
    description: 'রিফান্ড প্রত্যাখ্যাত করা হয়েছে',
    frequency: 400,
    duration: 180,
    volume: 0.95,
    pattern: 'triple',
  },
  payment_received: {
    type: 'payment_received',
    name: 'অর্থ প্রাপ্ত',
    description: 'পেমেন্ট সফলভাবে গৃহীত হয়েছে',
    frequency: 1200,
    duration: 160,
    volume: 0.9,
    pattern: 'double',
  },
  order_confirmed: {
    type: 'order_confirmed',
    name: 'অর্ডার নিশ্চিত',
    description: 'অর্ডার নিশ্চিত করা হয়েছে',
    frequency: 1100,
    duration: 130,
    volume: 0.8,
    pattern: 'single',
  },
  task_completed: {
    type: 'task_completed',
    name: 'কাজ সম্পূর্ণ',
    description: 'কাজ সম্পন্ন হয়েছে',
    frequency: 1300,
    duration: 120,
    volume: 0.7,
    pattern: 'single',
  },

  // ⚠️ Warning Sounds
  low_stock_warning: {
    type: 'low_stock_warning',
    name: 'স্টক কম সতর্কতা',
    description: 'পণ্য স্টক কম হয়ে গেছে',
    frequency: 600,
    duration: 140,
    volume: 0.8,
    pattern: 'double',
  },
  high_discount_alert: {
    type: 'high_discount_alert',
    name: 'উচ্চ ছাড় সতর্কতা',
    description: 'অত্যধিক ছাড় প্রদান করা হয়েছে',
    frequency: 650,
    duration: 130,
    volume: 0.75,
    pattern: 'double',
  },
  price_mismatch: {
    type: 'price_mismatch',
    name: 'মূল্য অমিল',
    description: 'মূল্যে অমিল সনাক্ত করা হয়েছে',
    frequency: 700,
    duration: 140,
    volume: 0.8,
    pattern: 'double',
  },
  inventory_alert: {
    type: 'inventory_alert',
    name: 'ইনভেন্টরি এলার্ট',
    description: 'ইনভেন্টরি সংক্রান্ত সমস্যা',
    frequency: 550,
    duration: 150,
    volume: 0.85,
    pattern: 'triple',
  },
  expiry_approaching: {
    type: 'expiry_approaching',
    name: 'মেয়াদ শেষ হওয়ার কাছাকাছি',
    description: 'পণ্যের মেয়াদ শেষ হতে যাচ্ছে',
    frequency: 680,
    duration: 135,
    volume: 0.8,
    pattern: 'double',
  },
  customer_limit_warning: {
    type: 'customer_limit_warning',
    name: 'গ্রাহক সীমা সতর্কতা',
    description: 'গ্রাহক ক্রেডিট সীমা অতিক্রম করতে যাচ্ছে',
    frequency: 720,
    duration: 140,
    volume: 0.8,
    pattern: 'double',
  },

  // 🔴 Critical Sounds
  payment_failed: {
    type: 'payment_failed',
    name: 'পেমেন্ট ব্যর্থ',
    description: 'পেমেন্ট প্রক্রিয়া ব্যর্থ হয়েছে',
    frequency: 400,
    duration: 180,
    volume: 0.95,
    pattern: 'triple',
  },
  system_error: {
    type: 'system_error',
    name: 'সিস্টেম ত্রুটি',
    description: 'সিস্টেমে গুরুতর ত্রুটি ঘটেছে',
    frequency: 350,
    duration: 200,
    volume: 1.0,
    pattern: 'triple',
  },
  critical_error: {
    type: 'critical_error',
    name: 'গুরুতর ত্রুটি',
    description: 'অত্যন্ত গুরুতর ত্রুটি ঘটেছে',
    frequency: 320,
    duration: 220,
    volume: 1.0,
    pattern: 'triple',
  },
  critical_inventory: {
    type: 'critical_inventory',
    name: 'সংকটপূর্ণ ইনভেন্টরি',
    description: 'ইনভেন্টরি গুরুতরভাবে কম',
    frequency: 300,
    duration: 220,
    volume: 1.0,
    pattern: 'triple',
  },
  transaction_error: {
    type: 'transaction_error',
    name: 'লেনদেন ত্রুটি',
    description: 'লেনদেনে ত্রুটি দেখা দিয়েছে',
    frequency: 380,
    duration: 190,
    volume: 0.95,
    pattern: 'triple',
  },
  customer_credit_exceeded: {
    type: 'customer_credit_exceeded',
    name: 'গ্রাহক ক্রেডিট অতিক্রম',
    description: 'গ্রাহক ক্রেডিট সীমা অতিক্রম করেছে',
    frequency: 420,
    duration: 180,
    volume: 0.95,
    pattern: 'triple',
  },
  invalid_transaction: {
    type: 'invalid_transaction',
    name: 'অবৈধ লেনদেন',
    description: 'অবৈধ লেনদেন সনাক্ত করা হয়েছে',
    frequency: 360,
    duration: 170,
    volume: 0.9,
    pattern: 'double',
  },

  // 💼 Business Events
  new_customer: {
    type: 'new_customer',
    name: 'নতুন গ্রাহক',
    description: 'নতুন গ্রাহক যুক্ত হয়েছেন',
    frequency: 550,
    duration: 150,
    volume: 0.85,
    pattern: 'double',
  },
  large_order: {
    type: 'large_order',
    name: 'বড় অর্ডার',
    description: 'বড় পরিমাণের অর্ডার পাওয়া গেছে',
    frequency: 580,
    duration: 160,
    volume: 0.9,
    pattern: 'ascending',
  },  bulk_order: {
    type: 'bulk_order',
    name: 'বাল্ক অর্ডার',
    description: 'বড় পরিমাণে অর্ডার পাওয়া গেছে',
    frequency: 880,
    duration: 140,
    volume: 0.85,
    pattern: 'double',
  },
  bulk_sale: {
    type: 'bulk_sale',
    name: 'বাল্ক বিক্রয়',
    description: 'বাল্ক পরিমাণে বিক্রয় হয়েছে',
    frequency: 600,
    duration: 150,
    volume: 0.9,
    pattern: 'double',
  },
  vip_customer_purchase: {
    type: 'vip_customer_purchase',
    name: 'ভিআইপি গ্রাহক ক্রয়',
    description: 'ভিআইপি গ্রাহক ক্রয় করেছেন',
    frequency: 620,
    duration: 160,
    volume: 0.95,
    pattern: 'ascending',
  },
  return_received: {
    type: 'return_received',
    name: 'পণ্য ফেরত আসা',
    description: 'পণ্য ফেরত আসা হয়েছে',
    frequency: 490,
    duration: 140,
    volume: 0.8,
    pattern: 'double',
  },
  supplier_delivery: {
    type: 'supplier_delivery',
    name: 'সরবরাহকারী ডেলিভারি',
    description: 'সরবরাহকারী থেকে পণ্য এসেছে',
    frequency: 640,
    duration: 150,
    volume: 0.85,
    pattern: 'ascending',
  },

  // 📊 Analytics & Monitoring
  daily_target_reached: {
    type: 'daily_target_reached',
    name: 'দৈনিক লক্ষ্য অর্জন',
    description: 'দৈনিক বিক্রয় লক্ষ্য অর্জিত হয়েছে',
    frequency: 700,
    duration: 150,
    volume: 0.9,
    pattern: 'ascending',
  },
  monthly_milestone: {
    type: 'monthly_milestone',
    name: 'মাসিক মাইলফলক',
    description: 'মাসিক মাইলফলক অর্জিত হয়েছে',
    frequency: 750,
    duration: 160,
    volume: 0.95,
    pattern: 'ascending',
  },
  performance_boost: {
    type: 'performance_boost',
    name: 'পারফরম্যান্স বৃদ্ধি',
    description: 'ব্যবসায়িক পারফরম্যান্স উন্নত হয়েছে',
    frequency: 680,
    duration: 140,
    volume: 0.88,
    pattern: 'ascending',
  },
  unusual_activity: {
    type: 'unusual_activity',
    name: 'অস্বাভাবিক কার্যকলাপ',
    description: 'অস্বাভাবিক কার্যকলাপ সনাক্ত করা হয়েছে',
    frequency: 420,
    duration: 170,
    volume: 0.85,
    pattern: 'triple',
  },
  system_check: {
    type: 'system_check',
    name: 'সিস্টেম পরীক্ষা',
    description: 'সিস্টেম পরীক্ষা সম্পন্ন',
    frequency: 660,
    duration: 120,
    volume: 0.75,
    pattern: 'single',
  },
  backup_complete: {
    type: 'backup_complete',
    name: 'ব্যাকআপ সম্পূর্ণ',
    description: 'ডেটা ব্যাকআপ সম্পূর্ণ হয়েছে',
    frequency: 720,
    duration: 130,
    volume: 0.82,
    pattern: 'double',
  },

  // 🎯 Additional
  countdown_timer: {
    type: 'countdown_timer',
    name: 'কাউন্টডাউন টাইমার',
    description: 'সময় শেষ হয়ে যাচ্ছে',
    frequency: 600,
    duration: 100,
    volume: 0.7,
    pattern: 'single',
  },
  shift_change: {
    type: 'shift_change',
    name: 'শিফট পরিবর্তন',
    description: 'শিফট পরিবর্তনের সময় এসেছে',
    frequency: 630,
    duration: 120,
    volume: 0.85,
    pattern: 'double',
  },
  employee_checkin: {
    type: 'employee_checkin',
    name: 'কর্মচারী চেক-ইন',
    description: 'কর্মচারী চেক-ইন হয়েছেন',
    frequency: 660,
    duration: 110,
    volume: 0.8,
    pattern: 'single',
  },
  customer_alert: {
    type: 'customer_alert',
    name: 'গ্রাহক সতর্কতা',
    description: 'গ্রাহক সম্পর্কিত সতর্কতা',
    frequency: 550,
    duration: 130,
    volume: 0.8,
    pattern: 'double',
  },
  loyalty_earned: {
    type: 'loyalty_earned',
    name: 'লয়্যালটি অর্জন',
    description: 'গ্রাহক লয়্যালটি পয়েন্ট অর্জন করেছেন',
    frequency: 700,
    duration: 140,
    volume: 0.85,
    pattern: 'ascending',
  },
};

/**
 * Audio notification service using Web Audio API with advanced features
 * Supports ADSR envelopes, beep patterns, frequency modulation, and mobile optimization
 * Also supports custom audio files for notifications
 */
export class AudioNotificationService {
  private audioContext: AudioContext | null = null;
  private isEnabled = true;
  private isMobileContext = false;
  private masterGainNode: GainNode | null = null;
  private beepGapMs = 150; // Gap between beeps in milliseconds
  private customSounds: Map<NotificationSoundType, string> = new Map(); // Custom audio URLs/data
  private audioBuffers: Map<NotificationSoundType, AudioBuffer> = new Map(); // Cached audio buffers
  private masterVolume = 0.8;

  constructor() {
    this.initAudioContext();
  }

  /**
   * Initialize audio context with mobile support
   */
  private initAudioContext() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioContext = new AudioContextClass();
          
          // Create master gain node for volume control
          if (this.audioContext) {
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = 0.9;
            this.masterGainNode.connect(this.audioContext.destination);

            // Detect if mobile
            this.isMobileContext = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            // Resume audio context on user interaction (mobile and desktop)
            if (this.audioContext.state === 'suspended') {
              const resumeAudio = () => {
                this.audioContext?.resume().then(() => {
                  document.removeEventListener('click', resumeAudio);
                  document.removeEventListener('touchstart', resumeAudio);
                });
              };
              document.addEventListener('click', resumeAudio);
              document.addEventListener('touchstart', resumeAudio);
            }
          }
        }
      } catch (error) {
        console.warn('AudioContext initialization failed:', error);
      }
    }
  }

  /**
   * Play a notification sound with beep patterns or custom audio
   * ⚠️ IMPORTANT: repeat parameter should ALWAYS be false for regular notifications
   * Only use repeat=true for specific critical scenarios with manual stop capability
   */
  async play(soundType: NotificationSoundType, repeat: boolean = false) {
    if (!this.isEnabled || !this.audioContext || !this.masterGainNode) {
      return;
    }

    try {
      // Resume audio context if suspended (mobile)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Check if custom sound exists for this type
      const customSoundUrl = this.customSounds.get(soundType);
      if (customSoundUrl) {
        await this.playCustomSound(soundType, customSoundUrl);
        // ⚠️ IMPORTANT: Never auto-repeat custom sounds to prevent accidental infinite loops
        return;
      }

      // Fall back to beep pattern
      const sound = SOUND_DEFINITIONS[soundType];
      if (!sound) {
        console.warn(`Sound type not found: ${soundType}`);
        return;
      }

      // ⚠️ SAFETY: Disable repeat by default to prevent infinite beeping
      // Only repeat if explicitly requested AND sound duration is short (< 500ms)
      const shouldRepeat = repeat && (sound.duration < 500);
      const totalPatternDuration = this.calculatePatternDuration(sound);

      // Play beep pattern
      const pattern = sound.pattern || 'single';
      const beepDuration = sound.duration / 1000; // Convert to seconds
      
      const playPattern = () => {
        switch (pattern) {
          case 'single':
            this.playBeep(sound.frequency, beepDuration, sound.volume);
            break;
          case 'double':
            this.playBeep(sound.frequency, beepDuration, sound.volume);
            setTimeout(() => this.playBeep(sound.frequency, beepDuration, sound.volume), this.beepGapMs);
            break;
          case 'triple':
            this.playBeep(sound.frequency, beepDuration, sound.volume);
            setTimeout(() => this.playBeep(sound.frequency, beepDuration, sound.volume), this.beepGapMs);
            setTimeout(() => this.playBeep(sound.frequency, beepDuration, sound.volume), this.beepGapMs * 2);
            break;
          case 'ascending':
            this.playBeep(sound.frequency, beepDuration, sound.volume);
            setTimeout(() => this.playBeep(sound.frequency * 1.25, beepDuration, sound.volume), this.beepGapMs);
            setTimeout(() => this.playBeep(sound.frequency * 1.5, beepDuration, sound.volume), this.beepGapMs * 2);
            break;
          case 'descending':
            this.playBeep(sound.frequency * 1.5, beepDuration, sound.volume);
            setTimeout(() => this.playBeep(sound.frequency * 1.25, beepDuration, sound.volume), this.beepGapMs);
            setTimeout(() => this.playBeep(sound.frequency, beepDuration, sound.volume), this.beepGapMs * 2);
            break;
        }
      };

      // Play the pattern
      playPattern();

      // ⚠️ SAFETY: DISABLE INFINITE REPETITION to prevent continuous beeping issues
      // If repeat was intended, user must manually manage the repetition with a timeout/cancel mechanism
      // This prevents the infinite beeping bug that was reported
      if (shouldRepeat) {
        console.warn('⚠️ Repeat functionality disabled for safety. Configure manual stop mechanism if repetition needed.');
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  /**
   * Calculate total pattern duration in milliseconds
   */
  private calculatePatternDuration(sound: any): number {
    const pattern = sound.pattern || 'single';
    const baseDuration = sound.duration || 100;
    
    switch (pattern) {
      case 'single':
        return baseDuration;
      case 'double':
        return baseDuration * 2 + this.beepGapMs;
      case 'triple':
        return baseDuration * 3 + this.beepGapMs * 2;
      case 'ascending':
      case 'descending':
        return baseDuration * 3 + this.beepGapMs * 2;
      default:
        return baseDuration;
    }
  }

  /**
   * Play custom audio file - truncate to max 2 seconds for preview
   */
  private async playCustomSound(soundType: NotificationSoundType, audioUrl: string) {
    if (!this.audioContext || !this.masterGainNode) return;

    try {
      let audioBuffer = this.audioBuffers.get(soundType);

      // Load audio if not cached
      if (!audioBuffer) {
        audioBuffer = await this.loadAudioFile(audioUrl);
        if (audioBuffer) {
          this.audioBuffers.set(soundType, audioBuffer);
        } else {
          console.warn(`Failed to load audio file for ${soundType}`);
          return;
        }
      }

      // Create source and play
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.masterGainNode);
      
      // For preview/testing, limit to 2 seconds max
      const maxDuration = Math.min(2, audioBuffer.duration);
      const now = this.audioContext.currentTime;
      
      source.start(0, 0, maxDuration);
    } catch (error) {
      console.error('Error playing custom sound:', error);
    }
  }

  /**
   * Load audio file from URL or base64
   */
  private async loadAudioFile(audioUrl: string): Promise<AudioBuffer | null> {
    if (!this.audioContext) return null;

    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Error loading audio file:', error);
      return null;
    }
  }

  /**
   * Register a custom sound for a notification type
   */
  setCustomSound(soundType: NotificationSoundType, audioUrl: string) {
    this.customSounds.set(soundType, audioUrl);
    // Clear cached buffer so new version will be loaded
    this.audioBuffers.delete(soundType);
    console.log(`✅ Custom sound registered for ${soundType}`);
  }

  /**
   * Remove custom sound (fall back to beep)
   */
  removeCustomSound(soundType: NotificationSoundType) {
    this.customSounds.delete(soundType);
    this.audioBuffers.delete(soundType);
    console.log(`✅ Custom sound removed for ${soundType}`);
  }

  /**
   * Get all registered custom sounds
   */
  getCustomSounds(): Record<string, string> {
    const result: Record<string, string> = {};
    this.customSounds.forEach((url, type) => {
      result[type] = url;
    });
    return result;
  }

  /**
   * Clear all custom sounds
   */
  clearCustomSounds() {
    this.customSounds.clear();
    this.audioBuffers.clear();
    console.log("✅ All custom sounds cleared");
  }

  /**
   * Play a single beep with ADSR envelope
   * @param frequency - Frequency in Hz
   * @param duration - Duration in seconds
   * @param volume - Volume (0-1)
   */
  private playBeep(frequency: number, duration: number, volume: number) {
    if (!this.audioContext || !this.masterGainNode) return;

    try {
      const now = this.audioContext.currentTime;
      
      // Create nodes
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      // Setup oscillator
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      
      // Add slight frequency modulation for richness
      oscillator.frequency.setValueAtTime(frequency * 0.98, now);
      oscillator.frequency.linearRampToValueAtTime(frequency * 1.02, now + duration * 0.25);
      oscillator.frequency.linearRampToValueAtTime(frequency, now + duration * 0.5);

      // Setup filter (lowpass for warmth)
      filter.type = 'lowpass';
      filter.frequency.value = frequency * 2;
      filter.Q.value = 1;

      // ADSR Envelope
      const attack = duration * 0.05; // 5% attack
      const decay = duration * 0.15; // 15% decay
      const sustain = duration * 0.75; // 75% sustain
      const release = duration * 0.05; // 5% release

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + attack);
      gainNode.gain.linearRampToValueAtTime(volume * 0.8, now + attack + decay);
      gainNode.gain.setValueAtTime(volume * 0.8, now + attack + decay + sustain);
      gainNode.gain.linearRampToValueAtTime(0, now + duration);

      // Connect nodes: oscillator -> filter -> gain -> master
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGainNode);

      // Play
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (error) {
      console.error('Error playing beep:', error);
    }
  }

  /**
   * Test all sounds
   */
  async testAllSounds() {
    const sounds = Object.values(SOUND_DEFINITIONS);
    let delay = 0;

    for (const sound of sounds) {
      await new Promise(resolve => {
        setTimeout(() => {
          this.play(sound.type as NotificationSoundType).then(resolve).catch(resolve);
        }, delay);
      });
      delay += (sound.duration || 500) + 200; // Add gap between sounds
    }
  }

  /**
   * Toggle sound on/off
   */
  toggleSound(enabled: boolean) {
    this.isEnabled = enabled;
    if (this.masterGainNode) {
      // Use stored masterVolume when enabled, or 0 when disabled
      this.masterGainNode.gain.value = enabled ? this.masterVolume : 0;
    }
  }

  /**
   * Set master volume
   */
  setVolume(level: number) {
    this.masterVolume = Math.max(0, Math.min(1, level));
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.masterVolume;
    }
  }

  /**
   * Get current master volume
   */
  getVolume(): number {
    return this.masterVolume;
  }

  /**
   * Get all available sounds
   */
  getAllSounds() {
    return Object.values(SOUND_DEFINITIONS);
  }

  /**
   * Get sound by type
   */
  getSound(type: NotificationSoundType) {
    return SOUND_DEFINITIONS[type];
  }

  /**
   * Get sounds by category
   */
  getSoundsByCategory(category: 'success' | 'warning' | 'error' | 'business' | 'analytics' | 'other') {
    const categoryMap: Record<string, NotificationSoundType[]> = {
      success: ['sale_success', 'sale_complete', 'refund_approved', 'payment_received', 'order_confirmed', 'task_completed'],
      warning: ['low_stock_warning', 'high_discount_alert', 'price_mismatch', 'inventory_alert', 'expiry_approaching', 'customer_limit_warning'],
      error: ['payment_failed', 'system_error', 'critical_inventory', 'transaction_error', 'customer_credit_exceeded', 'invalid_transaction'],
      business: ['new_customer', 'large_order', 'bulk_sale', 'vip_customer_purchase', 'return_received', 'supplier_delivery'],
      analytics: ['daily_target_reached', 'monthly_milestone', 'performance_boost', 'unusual_activity', 'system_check', 'backup_complete'],
      other: ['countdown_timer', 'shift_change', 'employee_checkin', 'customer_alert', 'loyalty_earned'],
    };

    return (categoryMap[category] || []).map(type => SOUND_DEFINITIONS[type]);
  }
}

/**
 * Global singleton instance
 */
export const audioNotificationService = new AudioNotificationService();
