import { supabase } from '@/lib/supabase';

// Request push notification permissions (Web Push / Expo / Production FCM)
export async function requestPushPermission(userId) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('Push notifications not supported on this browser');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Push notification permission granted!');
      
      // Save preference to profiles table if userId provided
      if (userId) {
        await supabase.from('profiles').update({ push_enabled: true }).eq('id', userId);
      }
      return true;
    } else {
      console.log('Push notification permission denied');
      return false;
    }
  } catch (err) {
    console.error('Error requesting push permission:', err);
    return false;
  }
}

// Send local in-app push alert notification
export function showLocalNotification(title, options = {}) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  }
}
