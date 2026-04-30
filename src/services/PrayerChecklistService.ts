import AsyncStorage from '@react-native-async-storage/async-storage';

const CHECKLIST_KEY_PREFIX = 'checklist:';
const DAILY_PRAYER_TOTAL = 5;
const RETENTION_DAYS = 30;

export type PrayerChecklist = Record<string, boolean>;

export type DailyProgress = {
  checked: number;
  total: number;
};

export async function togglePrayer(date: Date, prayerName: string): Promise<PrayerChecklist> {
  await cleanupOldChecklistData(date);

  const checklist = await readDailyChecklist(date);
  const nextChecklist = {
    ...checklist,
    [prayerName]: !checklist[prayerName],
  };

  await AsyncStorage.setItem(getChecklistKey(date), JSON.stringify(nextChecklist));

  return nextChecklist;
}

export async function getDailyChecklist(date: Date): Promise<PrayerChecklist> {
  await cleanupOldChecklistData(date);

  return readDailyChecklist(date);
}

export async function getDailyProgress(date: Date): Promise<DailyProgress> {
  const checklist = await getDailyChecklist(date);

  return {
    checked: Math.min(countCheckedPrayers(checklist), DAILY_PRAYER_TOTAL),
    total: DAILY_PRAYER_TOTAL,
  };
}

export async function getStreak(date = new Date()): Promise<number> {
  await cleanupOldChecklistData(date);

  let streak = 0;
  let currentDate = startOfDay(date);
  const todayChecklist = await readDailyChecklist(currentDate);

  if (!isComplete(todayChecklist)) {
    currentDate = addDays(currentDate, -1);
  }

  for (let dayOffset = 0; dayOffset < RETENTION_DAYS; dayOffset += 1) {
    const checklist = await readDailyChecklist(currentDate);

    if (!isComplete(checklist)) {
      break;
    }

    streak += 1;
    currentDate = addDays(currentDate, -1);
  }

  return streak;
}

async function readDailyChecklist(date: Date): Promise<PrayerChecklist> {
  const rawValue = await AsyncStorage.getItem(getChecklistKey(date));

  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue) as Record<string, unknown>;

    return Object.fromEntries(
      Object.entries(parsed).filter(([, isChecked]) => typeof isChecked === 'boolean')
    ) as PrayerChecklist;
  } catch {
    return {};
  }
}

function countCheckedPrayers(checklist: PrayerChecklist) {
  return Object.values(checklist).filter(Boolean).length;
}

function isComplete(checklist: PrayerChecklist) {
  return countCheckedPrayers(checklist) >= DAILY_PRAYER_TOTAL;
}

async function cleanupOldChecklistData(referenceDate: Date): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const thresholdDate = startOfDay(addDays(referenceDate, -RETENTION_DAYS));
  const keysToRemove = keys.filter((key) => {
    if (!key.startsWith(CHECKLIST_KEY_PREFIX)) {
      return false;
    }

    const date = parseDateKey(key);

    return date ? date < thresholdDate : false;
  });

  if (keysToRemove.length > 0) {
    await AsyncStorage.multiRemove(keysToRemove);
  }
}

function getChecklistKey(date: Date) {
  return `${CHECKLIST_KEY_PREFIX}${formatDateKey(date)}`;
}

function parseDateKey(key: string): Date | null {
  const value = key.replace(CHECKLIST_KEY_PREFIX, '');
  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date) {
  const nextDate = new Date(date);

  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}
