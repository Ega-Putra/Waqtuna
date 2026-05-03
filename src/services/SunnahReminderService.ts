import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { PrayerSchedule } from '@/shared/utils/prayer';

export const sunnahPrayerDefinitions = [
  {
    key: 'tahajud',
    name: 'Tahajud',
    timeDescription: 'Sepertiga malam terakhir, sekitar 02:00-03:30',
    rakaat: '2-12 rakaat',
  },
  {
    key: 'subuh-qobliyah',
    name: 'Subuh Qobliyah',
    timeDescription: '2 rakaat sebelum Subuh',
    rakaat: '2 rakaat',
  },
  {
    key: 'dhuha',
    name: 'Dhuha',
    timeDescription: 'Setelah matahari terbit hingga sebelum Dzuhur',
    rakaat: '2-12 rakaat',
  },
  {
    key: 'dzuhur-qobliyah',
    name: 'Dzuhur Qobliyah',
    timeDescription: 'Sebelum Dzuhur',
    rakaat: '2-4 rakaat',
  },
  {
    key: 'dzuhur-badiyah',
    name: "Dzuhur Ba'diyah",
    timeDescription: 'Setelah Dzuhur',
    rakaat: '2 rakaat',
  },
  {
    key: 'ashar-qobliyah',
    name: 'Ashar Qobliyah',
    timeDescription: 'Sebelum Ashar',
    rakaat: '2-4 rakaat',
  },
  {
    key: 'maghrib-badiyah',
    name: "Maghrib Ba'diyah",
    timeDescription: 'Setelah Maghrib',
    rakaat: '2 rakaat',
  },
  {
    key: 'isya-badiyah',
    name: "Isya Ba'diyah",
    timeDescription: 'Setelah Isya',
    rakaat: '2 rakaat',
  },
  {
    key: 'tarawih',
    name: 'Tarawih',
    timeDescription: 'Setelah Isya di bulan Ramadhan',
    rakaat: '8-20 rakaat',
  },
  {
    key: 'witir',
    name: 'Witir',
    timeDescription: 'Malam hari',
    rakaat: '1-11 rakaat',
  },
] as const;

export type SunnahPrayerKey = (typeof sunnahPrayerDefinitions)[number]['key'];

const SUNNAH_NOTIFICATION_CHANNEL_ID = 'waqtuna-sunnah-prayers';
const sunnahNotificationCategory = 'sunnah-prayer-reminder';

export const SunnahReminderService = {
  async scheduleAll(
    enabledKeys: string[],
    prayerSchedule: PrayerSchedule,
    date = new Date()
  ): Promise<string[]> {
    await cancelAll();

    const enabledKeySet = new Set(enabledKeys);

    if (enabledKeySet.size === 0) {
      return [];
    }

    const hasPermission = await requestPermission();

    if (!hasPermission) {
      return [];
    }

    await ensureNotificationChannel();

    const now = new Date();
    const notificationDates = getSunnahNotificationDates(prayerSchedule, date);
    const scheduledIds: string[] = [];

    for (const definition of sunnahPrayerDefinitions) {
      if (!enabledKeySet.has(definition.key)) {
        continue;
      }

      const rawNotificationDate = notificationDates[definition.key];
      const notificationDate = rawNotificationDate
        ? normalizeUpcomingDate(rawNotificationDate, now)
        : null;

      if (!notificationDate) {
        continue;
      }

      const scheduledId = await Notifications.scheduleNotificationAsync({
        identifier: `sunnah-${definition.key}-${formatDateKey(notificationDate)}`,
        content: {
          title: `Reminder ${definition.name}`,
          body: `${definition.timeDescription} - ${definition.rakaat}`,
          sound: 'default',
          data: {
            category: sunnahNotificationCategory,
            key: definition.key,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationDate,
          channelId: SUNNAH_NOTIFICATION_CHANNEL_ID,
        },
      });

      scheduledIds.push(scheduledId);
    }

    return scheduledIds;
  },

  async cancelAll(): Promise<void> {
    await cancelAll();
  },

  getReminderDate(
    key: SunnahPrayerKey,
    prayerSchedule: PrayerSchedule,
    date = new Date()
  ): Date | null {
    return getSunnahNotificationDates(prayerSchedule, date)[key] ?? null;
  },
};

function getSunnahNotificationDates(
  prayerSchedule: PrayerSchedule,
  date: Date
): Partial<Record<SunnahPrayerKey, Date | null>> {
  const fajr = findPrayerTime(prayerSchedule, 'fajr', date);
  const dhuhr = findPrayerTime(prayerSchedule, 'dhuhr', date);
  const asr = findPrayerTime(prayerSchedule, 'asr', date);
  const maghrib = findPrayerTime(prayerSchedule, 'maghrib', date);
  const isha = findPrayerTime(prayerSchedule, 'isha', date);

  return {
    tahajud: setTime(date, 2, 30),
    'subuh-qobliyah': fajr ? addMinutes(fajr, -15) : null,
    dhuha: fajr ? clampDate(addMinutes(fajr, 90), setTime(date, 7, 0), setTime(date, 11, 0)) : null,
    'dzuhur-qobliyah': dhuhr ? addMinutes(dhuhr, -10) : null,
    'dzuhur-badiyah': dhuhr ? addMinutes(dhuhr, 15) : null,
    'ashar-qobliyah': asr ? addMinutes(asr, -10) : null,
    'maghrib-badiyah': maghrib ? addMinutes(maghrib, 15) : null,
    'isya-badiyah': isha ? addMinutes(isha, 15) : null,
    tarawih: isha ? addMinutes(isha, 45) : null,
    witir: setTime(date, 3, 0),
  };
}

async function cancelAll() {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const sunnahNotifications = scheduledNotifications.filter(
    (notification) => notification.content.data?.category === sunnahNotificationCategory
  );

  await Promise.all(
    sunnahNotifications.map((notification) =>
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

  await Notifications.setNotificationChannelAsync(SUNNAH_NOTIFICATION_CHANNEL_ID, {
    name: 'Reminder Sholat Sunnah',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
}

function findPrayerTime(
  prayerSchedule: PrayerSchedule,
  key: PrayerSchedule['prayers'][number]['key'],
  date: Date
) {
  const prayer = prayerSchedule.prayers.find((item) => item.key === key);

  return prayer ? createPrayerDate(prayer.time24h, date) : null;
}

function createPrayerDate(time: string, baseDate: Date) {
  const [hourRaw, minuteRaw] = time.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const date = new Date(baseDate);

  date.setHours(Number.isFinite(hour) ? hour : 0, Number.isFinite(minute) ? minute : 0, 0, 0);

  return date;
}

function setTime(date: Date, hour: number, minute: number) {
  const nextDate = new Date(date);

  nextDate.setHours(hour, minute, 0, 0);

  return nextDate;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function clampDate(date: Date, minDate: Date, maxDate: Date) {
  if (date < minDate) {
    return minDate;
  }

  if (date > maxDate) {
    return maxDate;
  }

  return date;
}

function normalizeUpcomingDate(date: Date, now: Date) {
  if (date > now) {
    return date;
  }

  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + 1);

  return nextDate;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
