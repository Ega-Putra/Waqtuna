import dayjs from 'dayjs';
import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes,
} from 'adhan';

import type { AppPreferences } from '@/services/PreferenceService';

export type PrayerScheduleItem = {
  key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  name: string;
  time: string;
  time24h: string;
};

export type PrayerSchedule = {
  prayers: PrayerScheduleItem[];
  nextPrayerName: string;
  nextPrayerTime: string;
  nextPrayerTime24h: string;
  nextPrayerHeroTime: string;
  countdownText: string;
};

type PrayerSchedulePreferences = Partial<
  Pick<AppPreferences, 'calculationMethod' | 'asrMadhab' | 'clockFormat'>
>;

export function getPrayerSchedule(
  coordinates: { latitude: number; longitude: number },
  date = new Date(),
  preferences?: PrayerSchedulePreferences
): PrayerSchedule {
  const params = getCalculationParameters(preferences?.calculationMethod);
  params.madhab = preferences?.asrMadhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;

  const prayerTimes = new PrayerTimes(
    new Coordinates(coordinates.latitude, coordinates.longitude),
    date,
    params
  );

  const prayers: PrayerScheduleItem[] = [
    createPrayerItem('fajr', 'Subuh', prayerTimes.fajr, preferences?.clockFormat),
    createPrayerItem('dhuhr', 'Dzuhur', prayerTimes.dhuhr, preferences?.clockFormat),
    createPrayerItem('asr', 'Ashar', prayerTimes.asr, preferences?.clockFormat),
    createPrayerItem('maghrib', 'Maghrib', prayerTimes.maghrib, preferences?.clockFormat),
    createPrayerItem('isha', 'Isya', prayerTimes.isha, preferences?.clockFormat),
  ];

  const nextPrayer = resolveNextPrayer(prayers, coordinates, date, preferences);

  return {
    prayers,
    nextPrayerName: getPrayerDisplayName(nextPrayer.key),
    nextPrayerTime: formatPrayerTime(nextPrayer.time, preferences?.clockFormat ?? '24h'),
    nextPrayerTime24h: formatPrayerTime(nextPrayer.time, '24h'),
    nextPrayerHeroTime: formatHeroTime(nextPrayer.time),
    countdownText: formatCountdown(nextPrayer.time, date, getPrayerDisplayName(nextPrayer.key)),
  };
}

function getCalculationParameters(
  method: PrayerSchedulePreferences['calculationMethod'] | undefined
) {
  switch (method) {
    case 'muslimWorldLeague':
      return CalculationMethod.MuslimWorldLeague();
    case 'isna':
      return CalculationMethod.NorthAmerica();
    case 'egypt':
      return CalculationMethod.Egyptian();
    case 'karachi':
      return CalculationMethod.Karachi();
    case 'kemenag':
    default:
      // Adhan has no dedicated Kemenag preset; Singapore is closest for Indonesia.
      return CalculationMethod.Singapore();
  }
}

function createPrayerItem(
  key: PrayerScheduleItem['key'],
  name: string,
  time: Date,
  clockFormat: AppPreferences['clockFormat'] | undefined
): PrayerScheduleItem {
  return {
    key,
    name,
    time: formatPrayerTime(time, clockFormat ?? '24h'),
    time24h: formatPrayerTime(time, '24h'),
  };
}

function resolveNextPrayer(
  prayers: PrayerScheduleItem[],
  coordinates: { latitude: number; longitude: number },
  date: Date,
  preferences: PrayerSchedulePreferences | undefined
) {
  const nextPrayer = prayers.find((prayer) => {
    const prayerDate = createPrayerDate(prayer.time24h, date);
    return prayerDate > date;
  });

  if (nextPrayer) {
    return {
      key: nextPrayer.key,
      time: createPrayerDate(nextPrayer.time24h, date),
    };
  }

  const tomorrowParams = getCalculationParameters(preferences?.calculationMethod);
  tomorrowParams.madhab =
    preferences?.asrMadhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;

  const tomorrowPrayerTimes = new PrayerTimes(
    new Coordinates(coordinates.latitude, coordinates.longitude),
    dayjs(date).add(1, 'day').toDate(),
    tomorrowParams
  );

  return {
    key: 'fajr' as const,
    time: createPrayerDate(
      formatPrayerTime(tomorrowPrayerTimes.fajr, '24h'),
      dayjs(date).add(1, 'day').toDate()
    ),
  };
}

function getPrayerDisplayName(prayer: PrayerScheduleItem['key']) {
  switch (prayer) {
    case 'fajr':
      return 'Subuh';
    case 'dhuhr':
      return 'Dzuhur';
    case 'asr':
      return 'Ashar';
    case 'maghrib':
      return 'Maghrib';
    case 'isha':
      return 'Isya';
  }
}

export function formatPrayerTime(date: Date, clockFormat: AppPreferences['clockFormat']) {
  if (clockFormat === '12h') {
    return dayjs(date).format('hh:mm A');
  }

  return dayjs(date).format('HH:mm');
}

function formatHeroTime(date: Date) {
  return formatPrayerTime(date, '24h').replace(':', '.');
}

function formatCountdown(targetDate: Date, now: Date, prayerName: string) {
  const diffMinutes = Math.max(dayjs(targetDate).diff(now, 'minute'), 0);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours === 0 && minutes === 0) {
    return `Kurang dari 1m hingga ${prayerName}`;
  }

  if (hours === 0) {
    return `${minutes}m hingga ${prayerName}`;
  }

  return `${hours}j ${minutes}m hingga ${prayerName}`;
}

function createPrayerDate(time: string, baseDate: Date) {
  const [hourRaw, minuteRaw] = time.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const date = new Date(baseDate);

  date.setHours(Number.isFinite(hour) ? hour : 0, Number.isFinite(minute) ? minute : 0, 0, 0);

  return date;
}
