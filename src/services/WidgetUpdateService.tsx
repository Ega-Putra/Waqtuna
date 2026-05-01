import React from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { ShalatWidget } from '@/widgets/ShalatWidget';
import { getShalatWidgetData } from '@/widgets/shalatWidgetData';

const WIDGET_NAMES = ['Shalat', 'Hello'] as const;

async function updateWidgetByName(widgetName: (typeof WIDGET_NAMES)[number]) {
  await requestWidgetUpdate({
    widgetName,
    renderWidget: async () => {
      const data = await getShalatWidgetData();
      return <ShalatWidget data={data} />;
    },
  });
}

export async function updateAllHomeWidgets() {
  await Promise.all(WIDGET_NAMES.map((widgetName) => updateWidgetByName(widgetName)));
}

export async function updateChecklistWidget() {
  await updateAllHomeWidgets();
}
