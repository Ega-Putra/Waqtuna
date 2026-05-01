import dayjs from 'dayjs';
import 'dayjs/locale/id.js';
import { toHijri } from 'hijri-date/lib/safe.js';

dayjs.locale('id');

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
  'Ramadan',
  'Syawal',
  "Dzulqa'dah",
  'Dzulhijjah',
];

export type CalendarDateParts = {
  gregorianDate: string;
  hijriDate: string;
};

export function getCalendarDateParts(date = new Date()): CalendarDateParts {
  const gregorianDate = capitalize(dayjs(date).format('dddd, D MMM'));
  const hijri = toHijri(date);
  const hijriMonth = hijriMonthNames[hijri.getMonth()] ?? '';
  const hijriDate = `${hijri.getDate()} ${hijriMonth}, ${hijri.getFullYear()}`;

  return {
    gregorianDate,
    hijriDate,
  };
}

function capitalize(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}
