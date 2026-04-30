import { toHijri } from 'hijri-date/lib/safe.js';

export type HijriDateParts = {
  day: number;
  month: number;
  year: number;
};

export type IslamicEventType = 'major' | 'virtue';

export type IslamicCalendarEvent = {
  id: string;
  title: string;
  hijriDay: number;
  hijriMonth: number;
  hijriYear: number;
  gregorianDate: Date;
  type: IslamicEventType;
  shouldScheduleReminder: boolean;
};

export type IslamicCalendarDay = {
  date: Date;
  gregorianDay: number;
  hijri: HijriDateParts;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: IslamicCalendarEvent[];
};

export type IslamicCalendarMonth = {
  monthDate: Date;
  title: string;
  days: IslamicCalendarDay[];
};

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

const islamicEvents = [
  { id: 'new-year', day: 1, month: 1, title: 'Tahun Baru Islam', type: 'major', reminder: false },
  { id: 'ashura', day: 10, month: 1, title: 'Asyura', type: 'major', reminder: false },
  { id: 'mawlid', day: 12, month: 3, title: 'Maulid Nabi', type: 'major', reminder: true },
  { id: 'isra-miraj', day: 27, month: 7, title: "Isra Mi'raj", type: 'major', reminder: true },
  { id: 'ramadan-start', day: 1, month: 9, title: 'Awal Puasa', type: 'major', reminder: false },
  { id: 'eid-fitr', day: 1, month: 10, title: 'Idul Fitri', type: 'major', reminder: true },
  { id: 'eid-adha', day: 10, month: 12, title: 'Idul Adha', type: 'major', reminder: true },
] as const;

export const IslamicCalendarService = {
  getMonthCalendar(monthDate = new Date()): IslamicCalendarMonth {
    const normalizedMonth = startOfMonth(monthDate);
    const firstVisibleDate = addDays(normalizedMonth, -normalizedMonth.getDay());
    const days = Array.from({ length: 42 }, (_, index) => {
      const date = addDays(firstVisibleDate, index);
      const hijri = getHijriDateParts(date);

      return {
        date,
        gregorianDay: date.getDate(),
        hijri,
        isCurrentMonth: date.getMonth() === normalizedMonth.getMonth(),
        isToday: isSameDay(date, new Date()),
        events: getEventsForDate(date),
      };
    });

    return {
      monthDate: normalizedMonth,
      title: formatMonthTitle(normalizedMonth),
      days,
    };
  },

  getUpcomingEvents(daysAhead = 30, fromDate = new Date()): IslamicCalendarEvent[] {
    const startDate = startOfDay(fromDate);
    const events: IslamicCalendarEvent[] = [];

    for (let offset = 0; offset <= daysAhead; offset += 1) {
      events.push(...getEventsForDate(addDays(startDate, offset)));
    }

    return events.sort((first, second) => first.gregorianDate.getTime() - second.gregorianDate.getTime());
  },

  getReminderEvents(daysAhead = 370, fromDate = new Date()): IslamicCalendarEvent[] {
    return this.getUpcomingEvents(daysAhead, fromDate).filter((event) => event.shouldScheduleReminder);
  },

  formatHijriDate(hijri: HijriDateParts) {
    return `${hijri.day} ${hijriMonthNames[hijri.month] ?? ''} ${hijri.year}`;
  },
};

function getEventsForDate(date: Date): IslamicCalendarEvent[] {
  const hijri = getHijriDateParts(date);
  const matchedEvents = islamicEvents
    .filter((event) => event.day === hijri.day && event.month === hijri.month)
    .map((event) => createEvent(event.id, event.title, hijri, date, event.type, event.reminder));

  if (hijri.month === 12 && hijri.day >= 1 && hijri.day <= 10) {
    matchedEvents.push(
      createEvent('best-days-dhulhijjah', '10 Hari Terbaik', hijri, date, 'virtue', false)
    );
  }

  return matchedEvents;
}

function createEvent(
  id: string,
  title: string,
  hijri: HijriDateParts,
  date: Date,
  type: IslamicEventType,
  shouldScheduleReminder: boolean
): IslamicCalendarEvent {
  return {
    id: `${id}-${hijri.year}`,
    title,
    hijriDay: hijri.day,
    hijriMonth: hijri.month,
    hijriYear: hijri.year,
    gregorianDate: startOfDay(date),
    type,
    shouldScheduleReminder,
  };
}

function getHijriDateParts(date: Date): HijriDateParts {
  const hijri = toHijri(date);

  return {
    day: hijri.getDate(),
    month: hijri.getMonth(),
    year: hijri.getFullYear(),
  };
}

function formatMonthTitle(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}
