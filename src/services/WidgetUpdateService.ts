import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import {
  renderChecklistWidget,
  renderDailyPrayerWidget,
  renderNextPrayerWidget,
} from '@/widgets/PrayerWidgets';
import { WidgetNames } from '@/widgets/widgetConstants';

export async function updateNextPrayerWidget(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await safeRequestWidgetUpdate({
    widgetName: WidgetNames.nextPrayer,
    renderWidget: renderNextPrayerWidget,
  });
}

export async function updateDailyPrayerWidget(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await safeRequestWidgetUpdate({
    widgetName: WidgetNames.dailyPrayer,
    renderWidget: renderDailyPrayerWidget,
  });
}

export async function updateChecklistWidget(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await safeRequestWidgetUpdate({
    widgetName: WidgetNames.checklist,
    renderWidget: renderChecklistWidget,
  });
}

export async function updateAllHomeWidgets(): Promise<void> {
  await Promise.all([
    updateNextPrayerWidget(),
    updateDailyPrayerWidget(),
    updateChecklistWidget(),
  ]);
}

async function safeRequestWidgetUpdate(
  props: Parameters<typeof requestWidgetUpdate>[0]
): Promise<void> {
  try {
    await requestWidgetUpdate(props);
  } catch {
    // Widgets only work in an Android dev/release build, not Expo Go.
  }
}
