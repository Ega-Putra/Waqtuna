import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { IslamicCalendarEvent } from '@/src/services/IslamicCalendarService';
import type { PrayerScheduleItem } from '@/utils/prayer';

const PRAYER_NOTIFICATION_CHANNEL_ID = 'waqtuna-prayer-times';
const ISLAMIC_EVENT_NOTIFICATION_CHANNEL_ID = 'waqtuna-islamic-events';

export type PrayerNotificationKey = 'subuh' | 'dzuhur' | 'ashar' | 'maghrib' | 'isya';

export type PrayerNotificationSettings = {
  isEnabled: boolean;
  enabledPrayers: Record<PrayerNotificationKey, boolean>;
  reminderMinutes: number;
};

export type PrayerNotificationTime = Pick<PrayerScheduleItem, 'key' | 'name' | 'time'>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(PRAYER_NOTIFICATION_CHANNEL_ID, {
      name: 'Pengingat Sholat',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();

  if (currentPermission.granted) {
    return true;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync();

  return requestedPermission.granted;
}

export async function schedulePrayerNotifications(
  prayerTimes: PrayerNotificationTime[],
  settings: PrayerNotificationSettings
): Promise<string[]> {
  if (!settings.isEnabled) {
    return [];
  }

  const hasPermission = await requestPermission();

  if (!hasPermission) {
    return [];
  }

  const now = new Date();
  const scheduledNotificationIds: string[] = [];

  for (const prayerTime of prayerTimes) {
    const notificationKey = toNotificationKey(prayerTime.key);

    if (!settings.enabledPrayers[notificationKey]) {
      continue;
    }

    const prayerDate = createPrayerDate(prayerTime.time, now);
    const triggerDate = new Date(
      prayerDate.getTime() - Math.max(settings.reminderMinutes, 0) * 60_000
    );

    if (triggerDate <= now) {
      continue;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Waktunya ${prayerTime.name}`,
        body: `${prayerTime.time} - Segera bersiap untuk sholat`,
        sound: 'default',
        data: {
          prayerKey: notificationKey,
          prayerTime: prayerTime.time,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: PRAYER_NOTIFICATION_CHANNEL_ID,
      },
    });

    scheduledNotificationIds.push(notificationId);
  }

  return scheduledNotificationIds;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function rescheduleAll(
  prayerTimes: PrayerNotificationTime[] = [],
  settings?: PrayerNotificationSettings
): Promise<string[]> {
  await cancelAllNotifications();

  if (!settings || prayerTimes.length === 0) {
    return [];
  }

  return schedulePrayerNotifications(prayerTimes, settings);
}

export async function scheduleIslamicEventNotifications(
  events: IslamicCalendarEvent[]
): Promise<string[]> {
  const hasPermission = await requestPermission();

  if (!hasPermission) {
    return [];
  }

  await ensureIslamicEventChannel();
  await cancelIslamicEventNotifications();

  const now = new Date();
  const scheduledNotificationIds: string[] = [];

  for (const event of events) {
    const triggerDate = new Date(event.gregorianDate);

    triggerDate.setDate(triggerDate.getDate() - 1);
    triggerDate.setHours(8, 0, 0, 0);

    if (triggerDate <= now) {
      continue;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Besok ${event.title}`,
        body: 'Jangan lupa persiapkan amalan terbaik.',
        sound: 'default',
        data: {
          category: 'islamic-event',
          eventId: event.id,
          eventTitle: event.title,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: ISLAMIC_EVENT_NOTIFICATION_CHANNEL_ID,
      },
    });

    scheduledNotificationIds.push(notificationId);
  }

  return scheduledNotificationIds;
}

async function cancelIslamicEventNotifications() {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const eventNotifications = scheduledNotifications.filter(
    (notification) => notification.content.data?.category === 'islamic-event'
  );

  await Promise.all(
    eventNotifications.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier)
    )
  );
}

async function ensureIslamicEventChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(ISLAMIC_EVENT_NOTIFICATION_CHANNEL_ID, {
    name: 'Hari Besar Islam',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
}

function toNotificationKey(prayerKey: PrayerScheduleItem['key']): PrayerNotificationKey {
  switch (prayerKey) {
    case 'fajr':
      return 'subuh';
    case 'dhuhr':
      return 'dzuhur';
    case 'asr':
      return 'ashar';
    case 'maghrib':
      return 'maghrib';
    case 'isha':
      return 'isya';
  }
}

function createPrayerDate(time: string, baseDate: Date): Date {
  const [hourRaw, minuteRaw] = time.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const date = new Date(baseDate);

  date.setHours(Number.isFinite(hour) ? hour : 0, Number.isFinite(minute) ? minute : 0, 0, 0);

  return date;
}
