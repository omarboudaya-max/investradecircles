// Haptic touch feedback helper for mobile devices
export function triggerHaptic(type = 'light') {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      if (type === 'light') {
        navigator.vibrate(10);
      } else if (type === 'medium') {
        navigator.vibrate(25);
      } else if (type === 'success') {
        navigator.vibrate([15, 30, 15]);
      } else if (type === 'warning') {
        navigator.vibrate([40, 50, 40]);
      }
    } catch (e) {
      // Haptics not allowed or unsupported
    }
  }
}
