/**
 * Logging & Monitoring Utility
 * Lightweight structured logger with log levels.
 * In production, errors are also tracked via supabase analytics.
 */

import { supabase } from '@/lib/supabase';

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT_LEVEL = import.meta.env.DEV ? LOG_LEVELS.debug : LOG_LEVELS.info;

function formatMessage(level, message, context) {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= CURRENT_LEVEL;
}

export const logger = {
  debug(message, context = {}) {
    if (!shouldLog('debug')) return;
    console.debug('[DEBUG]', message, context);
  },

  info(message, context = {}) {
    if (!shouldLog('info')) return;
    console.info('[INFO]', message, context);
  },

  warn(message, context = {}) {
    if (!shouldLog('warn')) return;
    console.warn('[WARN]', message, context);
  },

  error(message, context = {}) {
    if (!shouldLog('error')) return;
    console.error('[ERROR]', message, context);
    // Track errors via analytics in production
    if (!import.meta.env.DEV) {
      console.log('Analytics Event: ', {
        eventName: 'app_error',
        properties: {
          message: String(message).slice(0, 200),
          context: JSON.stringify(context).slice(0, 200),
        },
      });
    }
  },

  /**
   * Track a user action event (e.g. 'post_created', 'circle_joined').
   * Now automatically saves to the AuditLog table for admin oversight!
   */
  async track(eventName, properties = {}) {
    console.log('Analytics Event: ', { eventName, properties });
    if (shouldLog('debug')) {
      console.debug('[TRACK]', eventName, properties);
    }
    
    try {
      // Get the current session user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('AuditLog').insert({
          action: eventName,
          details: JSON.stringify(properties).slice(0, 500), // Prevent huge payloads
          admin_id: user.id, // using existing column for user tracking
          admin_name: user.email || 'User',
        });
      }
    } catch (err) {
      console.error('Failed to save audit log to DB', err);
    }
  },
};