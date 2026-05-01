import { getDailyChecklist, getStreak } from '@/services/PrayerChecklistService';
import { getAppPreferences, getSelectedCityCode } from '@/services/PreferenceService';
import {
  defaultIndonesiaCity,
  findCityByCode,
} from '@/shared/utils/location';
import { getPrayerSchedule, type PrayerScheduleItem } from '@/shared/utils/prayer';

import {
  getDefaultShalatWidgetData,
  type ShalatWidgetData,
} from './ShalatWidget';

export async function getShalatWidgetData(date = new Date()): Promise<ShalatWidgetData> {
  try {
    const [preferences, selectedCityCode, checklist, streak] = await Promise.all([
      getAppPreferences(),
      getSelectedCityCode(),
      getDailyChecklist(date),
      getStreak(date),
    ]);

    const city = selectedCityCode
      ? findCityByCode(selectedCityCode) ?? defaultIndonesiaCity
      : defaultIndonesiaCity;

    const schedule = getPrayerSchedule(
      {
        latitude: city.latitude,
        longitude: city.longitude,
      },
      date,
      {
        calculationMethod: preferences.calculationMethod,
        asrMadhab: preferences.asrMadhab,
        clockFormat: preferences.clockFormat,
      }
    );

    const prayer = getCurrentPrayerWindow(schedule.prayers, date);

    return {
      title: 'Waqtuna',
      countdownText: formatCountdownLabel(schedule.countdownText),
      streak,
      locationLabel: formatLocationLabel(city.city),
      prayerName: prayer.name,
      prayerTime: prayer.time,
      isChecked: Boolean(checklist[prayer.name]),
    };
  } catch {
    return getDefaultShalatWidgetData();
  }
}

function getCurrentPrayerWindow(prayers: PrayerScheduleItem[], date: Date) {
  const currentPrayer = prayers
    .slice()
    .reverse()
    .find((prayer) => createPrayerDate(prayer.time24h, date) <= date);

  return currentPrayer ?? prayers[prayers.length - 1] ?? prayers[0];
}

function formatCountdownLabel(value: string) {
  const [prefix, prayerName] = value.split(' hingga ');

  if (!prayerName) {
    return value;
  }

  return `${prefix} hingga ${prayerName.toLowerCase()}`;
}

function formatLocationLabel(cityName: string) {
  const sanitized = cityName
    .replace(/^Kabupaten\s+/i, '')
    .replace(/^Kota\s+/i, '')
    .trim();

  return `${sanitized}, Idn`;
}

function createPrayerDate(time: string, baseDate: Date) {
  const [hourRaw, minuteRaw] = time.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const date = new Date(baseDate);

  date.setHours(Number.isFinite(hour) ? hour : 0, Number.isFinite(minute) ? minute : 0, 0, 0);

  return date;
}
