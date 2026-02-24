# 🎵 Sound Notification System - Troubleshooting Guide

## Quick Checklist

Before reporting an issue, check these:

- [ ] Notifications are **not muted** (check toggle in settings)
- [ ] **Volume is above 0%** (check volume slider)
- [ ] Browser **allows audio** (check permissions)
- [ ] **Custom sound file is valid** (MP3/WAV, under 2MB)
- [ ] **Browser speaker/headphones work** (test with other audio)

---

## Common Issues & Solutions

### 🔇 Issue: No Sound at All

**Cause 1: Notifications are muted**
```typescript
// Check if muted
$(".toggle-notification-sound").hasClass("muted") ? "Yes, muted" : "Not muted"
```
**Solution**: Click the toggle to enable sound

---

**Cause 2: Volume is set to 0**
```typescript
// In NotificationSoundSettings, check volume slider
const currentVolume = audioNotificationService.getVolume();
console.log("Current volume:", currentVolume); // Should be > 0
```
**Solution**: Increase volume slider in settings

---

**Cause 3: Browser audio context suspended**
- This happens on some browsers until user interacts
- Try clicking anywhere on the page, then test sound

**Solution**: 
```typescript
// Audio context auto-resumes on user click. Try:
1. Click any element on page
2. Then click "পরীক্ষা সাউন্ড" button
```

---

### 🎵 Issue: Custom Sound Not Playing

**Cause 1: File format not supported**
- Supported: MP3, WAV, OGG, FLAC
- Not supported: M4A (iPhone), AAC

**Solution**: 
1. Convert file to MP3 using online converter
2. Upload again

---

**Cause 2: File too large**
- Maximum size: 2 MB
- Typical size: 100-500 KB

**Solution**: 
1. Compress audio file
2. Reduce bitrate
3. Try online audio compressor

---

**Cause 3: Upload didn't complete**
```typescript
// In browser console, check:
audioNotificationService.getCustomSounds();
// Should show your registered sounds
```

**Solution**:
1. Verify file uploaded successfully (check browser console)
2. Try uploading again
3. Check file size is under 2MB

---

### 📊 Issue: Volume Not Saving/Resetting

**Symptom**: Set volume to 50%, mute, unmute, but volume becomes different

**Cause**: Toggle button was hardcoded to 0.9 (this is now fixed)

**Solution**: The issue has been fixed. Try again:
```typescript
1. Set volume to 50%
2. Mute sound (toggle OFF)
3. Unmute sound (toggle ON)
4. Volume should still be 50% ✅
```

---

### 🔊 Issue: Sound Very Quiet or Very Loud

**Solution**:
1. Open "সেটিংস" (Settings)
2. Under "নোটিফিকেশন সাউন্ড সেটিংস"
3. Adjust volume slider (0% = mute, 100% = max)

---

### 🎯 Issue: Beep Patterns Not Working

**Symptom**: All sounds play as single beep, not double/triple/ascending

**Cause**: Could be audio context issue or outdated browser

**Solution**:
```typescript
// In console, test patterns:
const audioService = window.audioNotificationService;

// Single beep
audioService.play('sale_success');

// Double beep
audioService.play('low_stock_warning');

// Triple beep
audioService.play('payment_failed');

// Ascending
audioService.play('large_order');

// Descending
audioService.play('unusual_activity');
```

If only single beep heard, your browser may not support Web Audio API patterns.

---

## 🧪 Testing Sounds

### Test in Browser Console

```typescript
import { audioNotificationService } from '@/utils/audioNotifications';

// Play single sound
audioNotificationService.play('sale_success').catch(e => console.error(e));

// Get current volume
console.log("Volume:", audioNotificationService.getVolume());

// Test all sounds
audioNotificationService.testAllSounds().catch(e => console.error(e));

// Check custom sounds
console.log("Custom sounds:", audioNotificationService.getCustomSounds());

// Toggle mute
audioNotificationService.toggleSound(false); // Mute
audioNotificationService.toggleSound(true);  // Unmute

// Set volume
audioNotificationService.setVolume(0.5); // 50%
```

---

## 📱 Mobile-Specific Issues

### iPhones/iPads

**Issue**: "Muted" toggle on side (silent mode)
- **Solution**: First enable sound on device (toggle physical mute switch)
- Then try notification sound

**Issue**: Sound quality issues
- Note: iPhone limits audio to 2 second duration max
- Our system automatically truncates to 2 seconds

---

### Android

**Issue**: "Do Not Disturb" mode blocking sounds
- **Solution**: Check Android settings > Sound > Do Not Disturb
- Add app to allowed list

---

## 🔍 Debug Steps

If issues persist, follow these steps:

### Step 1: Check Browser Console
```javascript
// Open: F12 → Console tab
// Look for errors like:
// "Error playing sound:"
// "Failed to load audio file:"
```

### Step 2: Verify Audio Context
```typescript
const audioService = window.audioNotificationService;
console.log("Audio enabled?", audioService.isEnabled);
console.log("Current volume:", audioService.getVolume());
console.log("Audio context state:", audioService.audioContext?.state);
```

### Step 3: Test Basic Sound
```typescript
// If basic sound works, your system is OK
audioService.play('sale_success')
  .then(() => console.log("✅ Sound played"))
  .catch(e => console.error("❌ Error:", e));
```

### Step 4: Test Custom Sound (if applicable)
```typescript
// Check if custom sound is registered
const customSounds = audioService.getCustomSounds();
console.log("Custom sounds registered:", Object.keys(customSounds));

// Try playing a custom sound
audioService.play('your_sound_type')
  .then(() => console.log("✅ Custom sound played"))
  .catch(e => console.error("❌ Error:", e));
```

---

## 🆘 When to Seek Help

Copy these details when reporting an issue:

1. **What happened**: Describe the issue
2. **Steps to reproduce**: How to trigger the problem
3. **Expected behavior**: What should happen
4. **Browser/Device**: Chrome 99, iPhone 13, etc.
5. **Console errors**: Paste any error messages
6. **Custom sound details**: File name, size, format (if applicable)

---

## 📚 Technical Details

### Supported Formats
- ✅ MP3
- ✅ WAV
- ✅ OGG
- ✅ FLAC
- ❌ M4A (not on all browsers)
- ❌ AAC (limited support)

### Size Limits
- Maximum: 2 MB
- Recommended: < 500 KB
- Optimal: 100-300 KB

### Browser Support
- ✅ Chrome 14+
- ✅ Firefox 25+
- ✅ Safari 14+
- ✅ Edge (all)
- ✅ Opera (all)
- ✅ iOS Safari (all)
- ✅ Android Chrome (all)

### File Encoding
- Bitrate: 128-256 kbps
- Sample rate: 44.1 kHz or 48 kHz
- Duration: Preferably < 2 seconds (for consistency)

---

## ✅ All Issues Fixed (v2.0)

The latest version includes fixes for:
- ✅ Custom sounds not playing → **NOW PLAYS**
- ✅ Volume toggle issue → **NOW RESPECTS SET VOLUME**
- ✅ Async/await handling → **PROPER ERROR HANDLING**
- ✅ Test sequences → **PROPER SEQUENCING**

---

## 📞 Additional Resources

- **Settings Location**: Dashboard → সেটিংস → নোটিফিকেশন সাউন্ড সেটিংস
- **Test Button**: "পরীক্ষা সাউন্ড" to test currently selected sound
- **Volume Control**: Use slider in settings (0-100%)
- **Mute Toggle**: Quick on/off for all notifications

---

**Last Updated**: February 24, 2026
**Status**: All known issues fixed ✅
