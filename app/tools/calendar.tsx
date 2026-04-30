import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  IslamicCalendarService,
  type IslamicCalendarDay,
  type IslamicCalendarEvent,
} from '@/src/services/IslamicCalendarService';
import { scheduleIslamicEventNotifications } from '@/src/services/NotificationService';

const weekdayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function IslamicCalendarScreen() {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const calendar = useMemo(
    () => IslamicCalendarService.getMonthCalendar(visibleMonth),
    [visibleMonth]
  );
  const upcomingEvents = useMemo(() => IslamicCalendarService.getUpcomingEvents(30), []);

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
          <Text style={styles.monthTitle}>{calendar.title}</Text>
          <Pressable style={styles.navButton} onPress={() => handleChangeMonth(1)}>
            <MaterialIcons name="chevron-right" size={28} color="#007322" />
          </Pressable>
        </View>

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
              <CalendarDayCell key={day.date.toISOString()} day={day} />
            ))}
          </View>
        </View>

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
            <Text style={styles.emptyText}>Tidak ada hari besar dalam 30 hari ke depan.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CalendarDayCell({ day }: { day: IslamicCalendarDay }) {
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
      <Text style={[styles.hijriDayText, !day.isCurrentMonth && styles.mutedText]}>
        {day.hijri.day}
      </Text>
      {primaryEvent ? (
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
    padding: 16,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F5FAEF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D7E6CB',
  },
  monthTitle: {
    color: '#1D2A21',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  calendarCard: {
    backgroundColor: '#F5FAEF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D7E6CB',
    padding: 10,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
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
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '900',
  },
  hijriDayText: {
    color: '#66706A',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  mutedText: {
    color: '#8A928C',
  },
  eventDot: {
    position: 'absolute',
    bottom: 6,
    width: 6,
    height: 6,
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
  emptyText: {
    color: '#66706A',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
  },
});
