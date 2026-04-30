import HijriDate, { toHijri } from 'hijri-date/lib/safe.js';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  getFastingReminderSettings,
  type FastingReminderSettings,
} from '@/src/services/PreferenceService';

const FASTING_NOTIFICATION_CHANNEL_ID = 'waqtuna-fasting-reminders';
const fastingNotificationCategory = 'fasting-reminder';

const hijriMonthNames = [
  '',
  'Muharram',
  'Safar',
  'Rabiul Awal',
  'Rabiul Akhir',
  'Jumadil Awal',
  'Jumadil Akhir',
  'Rajab',
  "Sya'ban",
  'Ramadhan',
  'Syawal',
  "Dzulqa'dah",
  'Dzulhijjah',
];

type FastingNotificationInput = {
  identifier: string;
  title: string;
  body: string;
  date: Date;
};

export const PuasaReminderService = {
  async scheduleAll(settings?: FastingReminderSettings): Promise<string[]> {
    const resolvedSettings = settings ?? (await getFastingReminderSettings());

    await cancelFastingNotifications();

    if (!resolvedSettings.mondayThursdayEnabled && !resolvedSettings.ayyamulBidhEnabled) {
      return [];
    }

    const hasPermission = await requestPermission();

    if (!hasPermission) {
      return [];
    }

    await ensureNotificationChannel();

    const notifications: FastingNotificationInput[] = [];

    if (resolvedSettings.mondayThursdayEnabled) {
      notifications.push(...getMondayThursdayNotifications());
    }

    if (resolvedSettings.ayyamulBidhEnabled) {
      notifications.push(...getAyyamulBidhNotifications());
    }

    const now = new Date();
    const scheduledIds: string[] = [];

    for (const notification of notifications) {
      if (notification.date <= now) {
        continue;
      }

      const scheduledId = await Notifications.scheduleNotificationAsync({
        identifier: notification.identifier,
        content: {
          title: notification.title,
          body: notification.body,
          sound: 'default',
          data: {
            category: fastingNotificationCategory,
            id: notification.identifier,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notification.date,
          channelId: FASTING_NOTIFICATION_CHANNEL_ID,
        },
      });

      scheduledIds.push(scheduledId);
    }

    return scheduledIds;
  },
};

function getMondayThursdayNotifications() {
  const notifications: FastingNotificationInput[] = [];
  const today = startOfDay(new Date());

  for (let offset = 1; offset <= 14; offset += 1) {
    const date = addDays(today, offset);
    const weekday = date.getDay();

    if (weekday !== 1 && weekday !== 4) {
      continue;
    }

    const dayName = weekday === 1 ? 'Senin' : 'Kamis';
    const dateKey = formatDateKey(date);

    notifications.push({
      identifier: `fasting-${dateKey}-night`,
      title: `Besok hari ${dayName}`,
      body: `Besok hari ${dayName}, jangan lupa puasa sunnah 🌙`,
      date: setTime(addDays(date, -1), 21, 0),
    });
    notifications.push({
      identifier: `fasting-${dateKey}-sahur`,
      title: `Waktu sahur puasa ${dayName}`,
      body: `Waktu sahur puasa ${dayName} - segera makan sahur`,
      date: setTime(date, 3, 30),
    });
  }

  return notifications;
}

function getAyyamulBidhNotifications() {
  const today = new Date();
  const hijriToday = toHijri(today);
  const currentHijriMonth = hijriToday.getMonth();
  const currentHijriYear = hijriToday.getFullYear();
  const startGregorianDate = new HijriDate(currentHijriYear, currentHijriMonth, 13).toGregorian();
  const reminderDate = setTime(addDays(startGregorianDate, -1), 21, 0);
  const monthName = hijriMonthNames[currentHijriMonth] ?? '';

  return [
    {
      identifier: `fasting-ayyamul-bidh-${currentHijriYear}-${currentHijriMonth}`,
      title: 'Besok mulai Ayyamul Bidh',
      body: `Besok mulai Ayyamul Bidh (tanggal 13-15 ${monthName})`,
      date: reminderDate,
    },
  ];
}

async function cancelFastingNotifications() {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const fastingNotifications = scheduledNotifications.filter(
    (notification) => notification.content.data?.category === fastingNotificationCategory
  );

  await Promise.all(
    fastingNotifications.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier)
    )
  );
}

async function requestPermission() {
  const currentPermission = await Notifications.getPermissionsAsync();

  if (currentPermission.granted) {
    return true;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync();

  return requestedPermission.granted;
}

async function ensureNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(FASTING_NOTIFICATION_CHANNEL_ID, {
    name: 'Reminder Puasa Sunnah',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function setTime(date: Date, hour: number, minute: number) {
  const nextDate = new Date(date);

  nextDate.setHours(hour, minute, 0, 0);

  return nextDate;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
