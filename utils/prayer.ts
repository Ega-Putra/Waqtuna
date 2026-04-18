import dayjs from 'dayjs';
import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes,
} from 'adhan';

export type PrayerScheduleItem = {
  key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  name: string;
  time: string;
};

export type PrayerSchedule = {
  prayers: PrayerScheduleItem[];
  nextPrayerName: string;
  nextPrayerTime: string;
  nextPrayerHeroTime: string;
  countdownText: string;
};

export function getPrayerSchedule(
  coordinates: { latitude: number; longitude: number },
  date = new Date()
): PrayerSchedule {
  const params = CalculationMethod.Singapore();
  params.madhab = Madhab.Shafi;

  const prayerTimes = new PrayerTimes(
    new Coordinates(coordinates.latitude, coordinates.longitude),
    date,
    params
  );

  const prayers: PrayerScheduleItem[] = [
    createPrayerItem('fajr', 'Subuh', prayerTimes.fajr),
    createPrayerItem('dhuhr', 'Dzuhur', prayerTimes.dhuhr),
    createPrayerItem('asr', 'Ashar', prayerTimes.asr),
    createPrayerItem('maghrib', 'Maghrib', prayerTimes.maghrib),
    createPrayerItem('isha', 'Isya', prayerTimes.isha),
  ];

  const nextPrayer = resolveNextPrayer(prayerTimes, coordinates, date, params);

  return {
    prayers,
    nextPrayerName: getPrayerDisplayName(nextPrayer.key),
    nextPrayerTime: formatTime(nextPrayer.time),
    nextPrayerHeroTime: formatHeroTime(nextPrayer.time),
    countdownText: formatCountdown(nextPrayer.time, date, getPrayerDisplayName(nextPrayer.key)),
  };
}

function createPrayerItem(
  key: PrayerScheduleItem['key'],
  name: string,
  time: Date
): PrayerScheduleItem {
  return {
    key,
    name,
    time: formatTime(time),
  };
}

function resolveNextPrayer(
  prayerTimes: PrayerTimes,
  coordinates: { latitude: number; longitude: number },
  date: Date,
  params: ReturnType<typeof CalculationMethod.Singapore>
) {
  const nextPrayer = prayerTimes.nextPrayer(date);

  if (nextPrayer !== 'none') {
    return {
      key: normalizePrayerKey(nextPrayer),
      time: getPrayerDate(prayerTimes, normalizePrayerKey(nextPrayer)),
    };
  }

  const tomorrowPrayerTimes = new PrayerTimes(
    new Coordinates(coordinates.latitude, coordinates.longitude),
    dayjs(date).add(1, 'day').toDate(),
    params
  );

  return {
    key: 'fajr' as const,
    time: tomorrowPrayerTimes.fajr,
  };
}

function normalizePrayerKey(prayer: string) {
  switch (prayer) {
    case 'fajr':
      return 'fajr' as const;
    case 'dhuhr':
      return 'dhuhr' as const;
    case 'asr':
      return 'asr' as const;
    case 'maghrib':
      return 'maghrib' as const;
    case 'isha':
      return 'isha' as const;
    default:
      return 'fajr' as const;
  }
}

function getPrayerDate(prayerTimes: PrayerTimes, prayer: PrayerScheduleItem['key']) {
  switch (prayer) {
    case 'fajr':
      return prayerTimes.fajr;
    case 'dhuhr':
      return prayerTimes.dhuhr;
    case 'asr':
      return prayerTimes.asr;
    case 'maghrib':
      return prayerTimes.maghrib;
    case 'isha':
      return prayerTimes.isha;
  }
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

function formatTime(date: Date) {
  return dayjs(date).format('HH:mm');
}

function formatHeroTime(date: Date) {
  return formatTime(date).replace(':', '.');
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
