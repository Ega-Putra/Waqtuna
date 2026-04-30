import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { togglePrayer } from '@/src/services/PrayerChecklistService';
import {
  renderChecklistWidget,
  renderDailyPrayerWidget,
  renderNextPrayerWidget,
} from '@/src/widgets/PrayerWidgets';
import { WidgetClickActions, WidgetNames } from '@/src/widgets/widgetConstants';

registerWidgetTaskHandler(
  async ({ widgetInfo, widgetAction, clickAction, clickActionData, renderWidget }) => {
    if (widgetAction === 'WIDGET_CLICK' && clickAction === WidgetClickActions.togglePrayer) {
      const prayerName = clickActionData?.prayerName;

      if (typeof prayerName === 'string') {
        await togglePrayer(new Date(), prayerName);
      }
    }

    if (widgetInfo.widgetName === WidgetNames.nextPrayer) {
      renderWidget(await renderNextPrayerWidget());
      return;
    }

    if (widgetInfo.widgetName === WidgetNames.dailyPrayer) {
      renderWidget(await renderDailyPrayerWidget());
      return;
    }

    if (widgetInfo.widgetName === WidgetNames.checklist) {
      renderWidget(await renderChecklistWidget());
    }
  }
);
