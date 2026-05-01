import React from 'react';
import { FlexWidget, TextWidget, type WidgetRepresentation } from 'react-native-android-widget';

import {
  getPrayerInitial,
  getPrayerWidgetData,
  sortPrayers,
  type PrayerWidgetData,
} from '@/widgets/WidgetDataService';
import { WidgetClickActions } from '@/widgets/widgetConstants';

const colors = {
  green: '#007322',
  greenDark: '#005C1C',
  greenSoft: '#DDF4E4',
  surface: '#F8FFF6',
  text: '#203025',
  muted: '#66736B',
  white: '#FFFFFF',
  border: '#CFE4D3',
} as const;

export async function renderNextPrayerWidget(): Promise<WidgetRepresentation> {
  const data = await getPrayerWidgetData();

  return <NextPrayerWidget data={data} />;
}

export async function renderDailyPrayerWidget(): Promise<WidgetRepresentation> {
  const data = await getPrayerWidgetData();

  return <DailyPrayerWidget data={data} />;
}

export async function renderChecklistWidget(): Promise<WidgetRepresentation> {
  const data = await getPrayerWidgetData();

  return <ChecklistWidget data={data} />;
}

function NextPrayerWidget({ data }: { data: PrayerWidgetData }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel="Buka Waqtuna"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        backgroundColor: colors.green,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      <FlexWidget style={{ flex: 1 }}>
        <TextWidget
          text={data.nextPrayerName}
          maxLines={1}
          truncate="END"
          style={{ color: colors.white, fontSize: 18, fontWeight: '800' }}
        />
        <TextWidget
          text={data.cityName}
          maxLines={1}
          truncate="END"
          style={{ color: '#D9F7DF', fontSize: 12, marginTop: 2 }}
        />
      </FlexWidget>
      <FlexWidget style={{ alignItems: 'flex-end' }}>
        <TextWidget
          text={data.countdown}
          maxLines={1}
          style={{ color: colors.white, fontSize: 20, fontWeight: '800' }}
        />
        <TextWidget
          text={data.nextPrayerTime}
          maxLines={1}
          style={{ color: '#D9F7DF', fontSize: 11, marginTop: 2 }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

function DailyPrayerWidget({ data }: { data: PrayerWidgetData }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel="Buka Waqtuna"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        padding: 12,
        borderRadius: 18,
        backgroundColor: colors.surface,
      }}>
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextWidget
          text="Jadwal Sholat"
          style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}
        />
        <TextWidget
          text={data.cityName}
          maxLines={1}
          truncate="END"
          style={{ color: colors.muted, fontSize: 11 }}
        />
      </FlexWidget>

      <FlexWidget style={{ flex: 1, marginTop: 8, flexGap: 5 }}>
        {sortPrayers(data.prayers).map((prayer) => {
          const isNext = prayer.key === data.nextPrayerKey;

          return (
            <FlexWidget
              key={prayer.key}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 9,
                backgroundColor: isNext ? colors.greenSoft : '#FFFFFF00',
                borderWidth: isNext ? 1 : 0,
                borderColor: colors.green,
              }}>
              <TextWidget
                text={prayer.name}
                style={{
                  color: isNext ? colors.greenDark : colors.text,
                  fontSize: 12,
                  fontWeight: isNext ? '800' : '600',
                }}
              />
              <TextWidget
                text={prayer.time}
                style={{
                  color: isNext ? colors.greenDark : colors.muted,
                  fontSize: 12,
                  fontWeight: '800',
                }}
              />
            </FlexWidget>
          );
        })}
      </FlexWidget>
    </FlexWidget>
  );
}

function ChecklistWidget({ data }: { data: PrayerWidgetData }) {
  const checkedCount = data.prayers.filter((prayer) => data.checklist[prayer.name]).length;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        padding: 10,
        borderRadius: 18,
        backgroundColor: colors.surface,
      }}>
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextWidget text="Checklist" style={{ color: colors.text, fontSize: 14, fontWeight: '800' }} />
        <TextWidget
          text={`${checkedCount}/5`}
          style={{ color: colors.green, fontSize: 13, fontWeight: '800' }}
        />
      </FlexWidget>

      <FlexWidget style={{ flex: 1, marginTop: 8, flexDirection: 'row', flexGap: 5 }}>
        {sortPrayers(data.prayers).map((prayer) => {
          const isChecked = Boolean(data.checklist[prayer.name]);

          return (
            <FlexWidget
              key={prayer.key}
              clickAction={WidgetClickActions.togglePrayer}
              clickActionData={{ prayerName: prayer.name }}
              accessibilityLabel={`Toggle ${prayer.name}`}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isChecked ? colors.green : colors.white,
                borderWidth: 1,
                borderColor: isChecked ? colors.greenDark : colors.border,
              }}>
              <TextWidget
                text={isChecked ? 'OK' : getPrayerInitial(prayer.key)}
                maxLines={1}
                style={{
                  color: isChecked ? colors.white : colors.greenDark,
                  fontSize: isChecked ? 12 : 16,
                  fontWeight: '800',
                  textAlign: 'center',
                }}
              />
            </FlexWidget>
          );
        })}
      </FlexWidget>

      <TextWidget
        text="Buka Waqtuna"
        clickAction="OPEN_APP"
        accessibilityLabel="Buka Waqtuna"
        style={{ color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 6 }}
      />
    </FlexWidget>
  );
}
