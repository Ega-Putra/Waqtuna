import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { togglePrayer } from '@/services/PrayerChecklistService';

import { ShalatWidget } from './ShalatWidget';
import { getShalatWidgetData } from './shalatWidgetData';

const nameToWidget = {
  Hello: ShalatWidget,
  Shalat: ShalatWidget,
};

async function renderCurrentWidget(props: WidgetTaskHandlerProps) {
  const Widget = nameToWidget[props.widgetInfo.widgetName as keyof typeof nameToWidget];

  if (!Widget) {
    return;
  }

  const data = await getShalatWidgetData();
  props.renderWidget(<Widget data={data} />);
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      await renderCurrentWidget(props);
      break;

    case 'WIDGET_CLICK':
      if (
        props.clickAction === 'TOGGLE_PRAYER_CHECKLIST' &&
        typeof props.clickActionData?.prayerName === 'string'
      ) {
        await togglePrayer(new Date(), props.clickActionData.prayerName);
      }

      await renderCurrentWidget(props);
      break;

    case 'WIDGET_DELETED':
    default:
      break;
  }
}
