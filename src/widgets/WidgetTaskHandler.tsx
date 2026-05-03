import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { rescheduleAll } from '@/services/NotificationService';
import { togglePrayer } from '@/services/PrayerChecklistService';
import {
  getPrayerNotificationSettings,
  getSelectedCityCode,
} from '@/services/PreferenceService';
import {
  defaultIndonesiaCity,
  findCityByCode,
} from '@/shared/utils/location';
import { getPrayerSchedule } from '@/shared/utils/prayer';

import { ShalatWidget } from './ShalatWidget';
import { getShalatWidgetData } from './shalatWidgetData';
import { WidgetClickActions } from './widgetConstants';

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
        props.clickAction === WidgetClickActions.reschedule
      ) {
        const cityCode = await getSelectedCityCode();
        const city = cityCode
          ? findCityByCode(cityCode) ?? defaultIndonesiaCity
          : defaultIndonesiaCity;
        const schedule = getPrayerSchedule({
          latitude: city.latitude,
          longitude: city.longitude,
        });
        const notificationSettings = await getPrayerNotificationSettings();

        await rescheduleAll(schedule.prayers, notificationSettings);
        await renderCurrentWidget(props);
        return;
      }

      if (
        props.clickAction === WidgetClickActions.togglePrayerChecklist &&
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
