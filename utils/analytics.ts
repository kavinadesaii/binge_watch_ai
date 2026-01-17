
import { TrackingPayload, ElementType } from '../types';

/**
 * Sends structured events to the Vercel API route for logging.
 */
export const captureEvent = async (payload: TrackingPayload) => {
  try {
    // Only fire in production or if explicitly testing
    // In local dev, we still log to console for visibility
    console.debug(`[Analytics] Dispatched: ${payload.event}`, payload.params);

    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Use keepalive to ensure the request completes even if page navigates
      keepalive: true,
    });
  } catch (err) {
    console.error('[Analytics] Failed to send event:', err);
  }
};

/**
 * Helper to track element clicks
 */
export const trackClick = (type: ElementType, label: string) => {
  captureEvent({
    event: 'click_event',
    params: {
      element_type: type,
      element_id: label,
      page_url: window.location.href,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Helper to calculate metrics for a text submission without storing the text
 */
export const trackPromptSubmission = (id: string, text: string, timeToSubmit: number) => {
  const cleanText = text.trim();
  captureEvent({
    event: 'prompt_submitted',
    params: {
      input_id: id,
      text_length: cleanText.length,
      word_count: cleanText.split(/\s+/).filter(Boolean).length,
      time_to_submit_ms: timeToSubmit,
      page_url: window.location.href,
      timestamp: new Date().toISOString()
    }
  });
};

export const trackTypingStarted = (id: string) => {
  captureEvent({
    event: 'prompt_typing_started',
    params: {
      input_id: id,
      page_url: window.location.href,
      timestamp: new Date().toISOString()
    }
  });
};
