import React from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { logger } from './logger';

export type ShareCardContent = {
  type: 'reflection' | 'verse';
  text: string;
  sanskrit?: string;
  reference: string;
  dayNumber: number;
};

export async function captureAndShare(viewRef: React.RefObject<View | null>): Promise<void> {
  try {
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });

    const Sharing = await import('expo-sharing');
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        UTI: 'public.png',
      });
    }
  } catch (e) {
    logger.error('shareCard', e);
  }
}
