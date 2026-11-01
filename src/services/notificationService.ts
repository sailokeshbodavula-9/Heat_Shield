/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HeatAlert {
  id: string;
  timestamp: string;
  title: string;
  placeName: string;
  cityName: string;
  riskScore: number;
  apparentTempC: number;
  nearestFacilityName?: string;
  nearestFacilityDistanceKm?: number;
  stressHours?: string;
  read: boolean;
}

/**
 * Plays an emergency chime via Web Audio API.
 * Uses a gentle, authoritative dual-tone chime (587 Hz -> 880 Hz).
 */
export function playEmergencyAlertSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Tone 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.2);
    gain2.gain.setValueAtTime(0, now + 0.2);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.75);
  } catch (err) {
    console.warn('Audio playback error (browser policy):', err);
  }
}

/**
 * Requests permission for HTML5 Web Notifications.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  return await Notification.requestPermission();
}

/**
 * Dispatches a native desktop / browser notification to the user.
 */
export function sendDesktopNotification(title: string, body: string, tag = 'severe-heat-alert'): boolean {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        tag,
        icon: 'https://cdn-icons-png.flaticon.com/512/785/785116.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/785/785116.png',
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    } catch (err) {
      console.warn('Could not display system notification:', err);
    }
  }
  return false;
}
