'use client';

import type { AnalyticsEventType, AnalyticsMetadata } from '@/types/analytics';

type TrackEventPayload = {
  type: AnalyticsEventType;
  metadata?: AnalyticsMetadata;
};

export const trackEvent = async (
  type: AnalyticsEventType,
  metadata: AnalyticsMetadata = {},
): Promise<void> => {
  const payload: TrackEventPayload = {
    type,
    metadata,
  };

  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Analytics tracking should never block user flow.
  }
};
