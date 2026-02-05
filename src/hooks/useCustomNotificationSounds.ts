import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { audioNotificationService } from '../utils/audioNotifications';

/**
 * Hook to load and apply custom notification sounds from settings
 */
export function useCustomNotificationSounds() {
  const storeSettings = useQuery(api.settings.get);
  const customSounds = useQuery(api.settings.getAllCustomSounds);

  useEffect(() => {
    if (!storeSettings) return;

    const settings = storeSettings.notificationSounds || {
      enabled: true,
      masterVolume: 0.8,
      customSounds: {},
    };

    // Apply master settings
    audioNotificationService.toggleSound(settings.enabled);
    audioNotificationService.setVolume(settings.masterVolume || 0.8);
  }, [storeSettings]);

  useEffect(() => {
    if (!customSounds) return;

    // Register all custom sounds
    customSounds.forEach((sound: any) => {
      if (sound.soundData) {
        audioNotificationService.setCustomSound(
          sound.soundType as any,
          sound.soundData
        );
      }
    });
  }, [customSounds]);

  return {
    soundSettings: storeSettings?.notificationSounds,
    customSounds,
    isLoaded: !!storeSettings && !!customSounds,
  };
}
