import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/src/components/EmptyState';
import { SkeletonBox } from '@/src/components/SkeletonBox';
import {
  IslamicCalendarService,
  type IslamicCalendarDay,
  type IslamicCalendarEvent,
  type IslamicCalendarMonth,
} from '@/src/services/IslamicCalendarService';
import { scheduleIslamicEventNotifications } from '@/src/services/NotificationService';

const weekdayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function IslamicCalendarScreen() {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);
  const [isGregorianFallback, setIsGregorianFallback] = useState(false);
  const [calendar, setCalendar] = useState<IslamicCalendarMonth>(() =>
    createGregorianFallbackCalendar(new Date())
  );
  const upcomingEvents = useMemo(
    () => {
      if (isGregorianFallback) {
        return [];
      }

      try {
        return IslamicCalendarService.getUpcomingEvents(30);
      } catch {
        return [];
      }
    },
    [isGregorianFallback]
  );

  useEffect(() => {
    let isActive = true;

    setIsLoadingCalendar(true);

    const timeout = setTimeout(() => {
      try {
        const nextCalendar = IslamicCalendarService.getMonthCalendar(visibleMonth);

        if (isActive) {
          setCalendar(nextCalendar);
          setIsGregorianFallback(false);
        }
      } catch {
        if (isActive) {
          setCalendar(createGregorianFallbackCalendar(visibleMonth));
          setIsGregorianFallback(true);
        }
      } finally {
        if (isActive) {
          setIsLoadingCalendar(false);
        }
      }
    }, 120);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [visibleMonth]);

  useEffect(() => {
    const reminderEvents = IslamicCalendarService.getReminderEvents();

    void scheduleIslamicEventNotifications(reminderEvents);
  }, []);

  function handleChangeMonth(direction: -1 | 1) {
    setVisibleMonth((currentMonth) => {
      const nextMonth = new Date(currentMonth);

      nextMonth.setMonth(nextMonth.getMonth() + direction);

      return nextMonth;
    });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.navButton} onPress={() => handleChangeMonth(-1)}>
            <MaterialIcons name="chevron-left" size={28} color="#007322" />
          </Pressable>
          <Text numberOfLines={1} style={styles.monthTitle}>
            {calendar.title}
          </Text>
          <Pressable style={styles.navButton} onPress={() => handleChangeMonth(1)}>
            <MaterialIcons name="chevron-right" size={28} color="#007322" />
          </Pressable>
        </View>

        {isLoadingCalendar ? (
          <CalendarGridSkeleton />
        ) : (
          <View style={styles.calendarCard}>
            <View style={styles.weekdayRow}>
              {weekdayLabels.map((label) => (
                <Text key={label} style={styles.weekdayText}>
                  {label}
                </Text>
              ))}
            </View>

            <View style={styles.dayGrid}>
              {calendar.days.map((day) => (
                <CalendarDayCell
                  key={day.date.toISOString()}
                  day={day}
                  hideHijri={isGregorianFallback}
                />
              ))}
            </View>
          </View>
        )}

        {isGregorianFallback ? (
          <Text style={styles.fallbackBanner}>
            Konversi Hijriah gagal. Menampilkan kalender Masehi saja.
          </Text>
        ) : null}

        <View style={styles.legendRow}>
          <LegendDot color="#007322" label="Hari besar" />
          <LegendDot color="#F6D365" label="Keutamaan" />
        </View>

        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="calendar-star" size={22} color="#007322" />
          <Text style={styles.sectionTitle}>30 Hari Mendatang</Text>
        </View>

        <View style={styles.eventList}>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => <EventCard key={`${event.id}-${event.hijriDay}`} event={event} />)
          ) : (
            <EmptyState title="Tidak ada hari besar" subtitle="Tidak ada hari besar dalam 30 hari ke depan." />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CalendarDayCell({ day, hideHijri }: { day: IslamicCalendarDay; hideHijri?: boolean }) {
  const primaryEvent = day.events[0] ?? null;

  return (
    <View
      style={[
        styles.dayCell,
        !day.isCurrentMonth && styles.dayCellMuted,
        day.isToday && styles.dayCellToday,
      ]}>
      <Text style={[styles.gregorianDayText, !day.isCurrentMonth && styles.mutedText]}>
        {day.gregorianDay}
      </Text>
      {!hideHijri ? (
        <Text style={[styles.hijriDayText, !day.isCurrentMonth && styles.mutedText]}>
          {day.hijri.day}
        </Text>
      ) : null}
      {primaryEvent && !hideHijri ? (
        <View
          style={[
            styles.eventDot,
            primaryEvent.type === 'major' ? styles.majorEventDot : styles.virtueEventDot,
          ]}
        />
      ) : null}
    </View>
  );
}

function CalendarGridSkeleton() {
  return (
    <View style={styles.calendarCard}>
      <View style={styles.weekdayRow}>
        {weekdayLabels.map((label) => (
          <Text key={label} style={styles.weekdayText}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.dayGrid}>
        {Array.from({ length: 42 }).map((_, index) => (
          <View key={index} style={styles.dayCell}>
            <SkeletonBox width={24} height={16} borderRadius={6} />
            <SkeletonBox width={18} height={10} borderRadius={5} style={styles.calendarSkeletonLine} />
          </View>
        ))}
      </View>
    </View>
  );
}

function createGregorianFallbackCalendar(monthDate: Date) {
  const normalizedMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const firstVisibleDate = new Date(normalizedMonth);
  const today = new Date();

  firstVisibleDate.setDate(normalizedMonth.getDate() - normalizedMonth.getDay());

  return {
    monthDate: normalizedMonth,
    title: new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
    }).format(normalizedMonth),
    days: Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstVisibleDate);

      date.setDate(firstVisibleDate.getDate() + index);

      return {
        date,
        gregorianDay: date.getDate(),
        hijri: { day: 0, month: 0, year: 0 },
        isCurrentMonth: date.getMonth() === normalizedMonth.getMonth(),
        isToday:
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate(),
        events: [],
      };
    }),
  };
}

function EventCard({ event }: { event: IslamicCalendarEvent }) {
  return (
    <View style={styles.eventCard}>
      <View
        style={[
          styles.eventIcon,
          event.type === 'major' ? styles.majorEventIcon : styles.virtueEventIcon,
        ]}>
        <MaterialCommunityIcons
          name={event.type === 'major' ? 'star-crescent' : 'star-outline'}
          size={20}
          color={event.type === 'major' ? '#FFFFFF' : '#1D2A21'}
        />
      </View>
      <View style={styles.eventTextWrap}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDate}>
          {formatGregorianDate(event.gregorianDate)} ·{' '}
          {IslamicCalendarService.formatHijriDate({
            day: event.hijriDay,
            month: event.hijriMonth,
            year: event.hijriYear,
          })}
        </Text>
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function formatGregorianDate(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E7F0DE',
  },
  container: {
    flex: 1,
    backgroundColor: '#E7F0DE',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  navButton: {
    width: 56,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F5FAEF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D7E6CB',
  },
  monthTitle: {
    flex: 1,
    color: '#1D2A21',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  calendarCard: {
    backgroundColor: '#F5FAEF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D7E6CB',
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 10,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekdayText: {
    flex: 1,
    color: '#66706A',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 6,
  },
  dayCell: {
    width: `${100 / 7}%`,
    minHeight: 58,
    paddingTop: 6,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: 12,
    position: 'relative',
  },
  dayCellMuted: {
    opacity: 0.38,
  },
  dayCellToday: {
    backgroundColor: '#DFF2E1',
    borderWidth: 1,
    borderColor: '#007322',
  },
  gregorianDayText: {
    color: '#1D2A21',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  hijriDayText: {
    color: '#66706A',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 0,
  },
  mutedText: {
    color: '#8A928C',
  },
  eventDot: {
    position: 'absolute',
    bottom: 7,
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  majorEventDot: {
    backgroundColor: '#007322',
  },
  virtueEventDot: {
    backgroundColor: '#F6D365',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 12,
    marginBottom: 18,
  },
  fallbackBanner: {
    color: '#7A4E00',
    backgroundColor: '#FFF7D6',
    borderWidth: 1,
    borderColor: '#F2D17A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  calendarSkeletonLine: {
    marginTop: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  legendText: {
    color: '#66706A',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#1D2A21',
    fontSize: 18,
    fontWeight: '900',
  },
  eventList: {
    gap: 10,
  },
  eventCard: {
    backgroundColor: '#F5FAEF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7E6CB',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventIcon: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  majorEventIcon: {
    backgroundColor: '#007322',
  },
  virtueEventIcon: {
    backgroundColor: '#F6D365',
  },
  eventTextWrap: {
    flex: 1,
  },
  eventTitle: {
    color: '#1D2A21',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  eventDate: {
    color: '#66706A',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
});
