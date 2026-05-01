import { getDailyChecklist, type PrayerChecklist } from '@/services/PrayerChecklistService';
import { getSelectedCityCode } from '@/services/PreferenceService';
import { defaultIndonesiaCity, findCityByCode, getLocationLabel } from '@/shared/utils/location';
import { getPrayerSchedule, type PrayerScheduleItem } from '@/shared/utils/prayer';

export type PrayerWidgetData = {
  cityName: string;
  prayers: PrayerScheduleItem[];
  nextPrayerName: string;
  nextPrayerKey: PrayerScheduleItem['key'];
  nextPrayerTime: string;
  countdown: string;
  checklist: PrayerChecklist;
};

const PRAYER_ORDER: PrayerScheduleItem['key'][] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export async function getPrayerWidgetData(date = new Date()): Promise<PrayerWidgetData> {
  const selectedCityCode = await getSelectedCityCode();
  const city = selectedCityCode
    ? findCityByCode(selectedCityCode) ?? defaultIndonesiaCity
    : defaultIndonesiaCity;
  const schedule = getPrayerSchedule(
    {
      latitude: city.latitude,
      longitude: city.longitude,
    },
    date
  );
  const nextPrayerKey = getPrayerKeyByName(schedule.prayers, schedule.nextPrayerName);
  const nextPrayerDate = resolveNextPrayerDate(schedule.prayers, nextPrayerKey, date);
  const checklist = await getDailyChecklist(date);

  return {
    cityName: getLocationLabel(city),
    prayers: schedule.prayers,
    nextPrayerName: schedule.nextPrayerName,
    nextPrayerKey,
    nextPrayerTime: schedule.nextPrayerTime,
    countdown: formatCountdown(nextPrayerDate, date),
    checklist,
  };
}

function getPrayerKeyByName(
  prayers: PrayerScheduleItem[],
  prayerName: string
): PrayerScheduleItem['key'] {
  return prayers.find((prayer) => prayer.name === prayerName)?.key ?? 'fajr';
}

function resolveNextPrayerDate(
  prayers: PrayerScheduleItem[],
  nextPrayerKey: PrayerScheduleItem['key'],
  date: Date
) {
  const prayer = prayers.find((item) => item.key === nextPrayerKey);
  const prayerDate = createDateFromTime(prayer?.time ?? '00:00', date);

  if (prayerDate > date) {
    return prayerDate;
  }

  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return createDateFromTime(prayer?.time ?? '00:00', tomorrow);
}

function createDateFromTime(time: string, baseDate: Date) {
  const [hourRaw, minuteRaw] = time.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const date = new Date(baseDate);

  date.setHours(
    Number.isFinite(hour) ? hour : 0,
    Number.isFinite(minute) ? minute : 0,
    0,
    0
  );

  return date;
}

function formatCountdown(targetDate: Date, date: Date) {
  const diffMinutes = Math.max(
    Math.ceil((targetDate.getTime() - date.getTime()) / 60_000),
    0
  );
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function getPrayerInitial(key: PrayerScheduleItem['key']) {
  const initials: Record<PrayerScheduleItem['key'], string> = {
    fajr: 'S',
    dhuhr: 'D',
    asr: 'A',
    maghrib: 'M',
    isha: 'I',
  };

  return initials[key];
}

export function sortPrayers(prayers: PrayerScheduleItem[]) {
  return [...prayers].sort(
    (first, second) => PRAYER_ORDER.indexOf(first.key) - PRAYER_ORDER.indexOf(second.key)
  );
}
