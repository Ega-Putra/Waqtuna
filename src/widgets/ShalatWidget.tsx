'use no memo';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { FlexWidget, IconWidget, TextWidget } from 'react-native-android-widget';

import { WidgetClickActions } from './widgetConstants';

export type ShalatWidgetData = {
  title: string;
  countdownText: string;
  streak: number;
  locationLabel: string;
  prayerName: string;
  prayerTime: string;
  isChecked: boolean;
};

type ShalatWidgetProps = {
  data: ShalatWidgetData;
};

export function getDefaultShalatWidgetData(): ShalatWidgetData {
  return {
    title: 'Waqtuna',
    countdownText: '1j 23m hingga dzuhur',
    streak: 7,
    locationLabel: 'Surabaya, Idn',
    prayerName: 'Subuh',
    prayerTime: '04:21',
    isChecked: false,
  };
}

export function ShalatWidget({ data }: ShalatWidgetProps) {
  const prayerIcon = getPrayerIcon(data.prayerName);

  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: '#E7F0DE',
        borderRadius: 24,
        padding: 8,
        justifyContent: 'space-between',
        flexDirection: 'column',
        flexGap: 8,
        overflow: 'hidden',
      }}
      accessibilityLabel="Widget ringkasan sholat"
    >
      <FlexWidget
        clickAction={WidgetClickActions.openApp}
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
          paddingHorizontal: 8,
          paddingVertical: 6,
          overflow: 'hidden',
        }}
      >
        <FlexWidget
          style={{
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingRight: 8,
            overflow: 'hidden',
          }}
        >
          <TextWidget
            text={data.title}
            style={{
              color: '#007322',
              fontSize: 28,
              fontFamily: 'Inter',
              fontWeight: '800',
            }}
            adjustsFontSizeToFit
            maxLines={1}
          />

          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flexGap: 4,
              marginTop: 6,
              overflow: 'hidden',
            }}
          >
            <IconWidget
              icon={getIconGlyph(MaterialCommunityIcons, 'clock-outline')}
              size={16}
              font="MaterialCommunityIcons"
              style={{
                color: '#00813A',
              }}
            />
            <TextWidget
              text={data.countdownText}
              style={{
                color: '#00813A',
                fontSize: 13,
                fontFamily: 'Inter',
                fontWeight: '400',
              }}
              adjustsFontSizeToFit
              maxLines={1}
              truncate="END"
            />
          </FlexWidget>
        </FlexWidget>

        <FlexWidget
          style={{
            flex: 1,
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          <FlexWidget
            style={{
              backgroundColor: '#FFF7ED',
              borderWidth: 1,
              borderColor: '#FFEDD5',
              borderRadius: 100,
              paddingHorizontal: 8,
              paddingVertical: 4,
              flexDirection: 'row',
              alignItems: 'center',
              flexGap: 4,
              maxWidth: 'match_parent',
            }}
          >
            <TextWidget
              text="🔥"
              style={{
                fontSize: 13,
                fontFamily: 'Inter',
              }}
            />
            <TextWidget
              text={`${data.streak} Hari Beruntun`}
              style={{
                color: '#C2410C',
                fontSize: 13,
                fontFamily: 'Inter',
                fontWeight: '700',
              }}
              adjustsFontSizeToFit
              maxLines={1}
            />
          </FlexWidget>

          <FlexWidget
            style={{
              backgroundColor: '#00813A',
              borderRadius: 20,
              paddingHorizontal: 8,
              paddingVertical: 4,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              flexGap: 4,
              width: 'match_parent',
              marginTop: 4,
              overflow: 'hidden',
            }}
          >
            <IconWidget
              icon={getIconGlyph(Ionicons, 'location-sharp')}
              size={14}
              font="Ionicons"
              style={{
                color: '#FFFFFF',
              }}
            />
            <TextWidget
              text={data.locationLabel}
              style={{
                color: '#FFFFFF',
                fontSize: 14,
                fontFamily: 'Inter',
                fontWeight: '500',
                textAlign: 'center',
              }}
              adjustsFontSizeToFit
              maxLines={1}
              truncate="END"
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>

      <FlexWidget
        style={{
          flex: 1,
          width: 'match_parent',
          backgroundColor: '#47AC5E',
          borderRadius: 24,
          paddingHorizontal: 8,
          paddingVertical: 4,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        <FlexWidget
          clickAction={WidgetClickActions.openApp}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            flexGap: 8,
            overflow: 'hidden',
          }}
        >
          <FlexWidget
            style={{
              width: 42,
              height: 42,
              backgroundColor: '#00813A',
              borderRadius: 100,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconWidget
              icon={getIconGlyph(MaterialCommunityIcons, prayerIcon)}
              size={24}
              font="MaterialCommunityIcons"
              style={{
                color: '#FFFFFF',
              }}
            />
          </FlexWidget>

          <FlexWidget
            style={{
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <TextWidget
              text={data.prayerName}
              style={{
                color: '#FFFFFF',
                fontSize: 20,
                fontFamily: 'Inter',
                fontWeight: '700',
              }}
              adjustsFontSizeToFit
              maxLines={1}
            />
            <TextWidget
              text={data.prayerTime}
              style={{
                color: '#FFFFFF',
                fontSize: 14,
                fontFamily: 'Inter',
                fontWeight: '300',
                marginTop: 4,
              }}
              adjustsFontSizeToFit
              maxLines={1}
            />
          </FlexWidget>
        </FlexWidget>

        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexGap: 8,
            marginLeft: 8,
          }}
        >
          <FlexWidget
            clickAction={WidgetClickActions.reschedule}
            clickActionData={{ prayerName: data.prayerName }}
            style={{
              width: 34,
              height: 34,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconWidget
              icon={getIconGlyph(MaterialIcons, 'more-time')}
              size={22}
              font="MaterialIcons"
              style={{
                color: '#FFFFFF',
              }}
            />
          </FlexWidget>

          <FlexWidget
            clickAction={WidgetClickActions.togglePrayerChecklist}
            clickActionData={{ prayerName: data.prayerName }}
            style={{
              width: 34,
              height: 34,
              backgroundColor: data.isChecked ? '#00813A' : '#FFFFFF',
              borderRadius: 100,
              borderWidth: 1,
              borderColor: data.isChecked ? '#00813A' : '#0000001A',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconWidget
              icon={getIconGlyph(MaterialIcons, 'check')}
              size={18}
              font="MaterialIcons"
              style={{
                color: data.isChecked ? '#005325ff' : '#97A6A0',
              }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

function getPrayerIcon(prayerName: string): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (prayerName.toLowerCase()) {
    case 'subuh':
      return 'weather-sunset-up';
    case 'dzuhur':
      return 'white-balance-sunny';
    case 'ashar':
      return 'weather-partly-cloudy';
    case 'maghrib':
      return 'weather-night-partly-cloudy';
    case 'isya':
      return 'moon-waning-crescent';
    default:
      return 'clock-outline';
  }
}

function getIconGlyph(
  iconSet: { glyphMap: Record<string, number | string> },
  name: string
) {
  const glyph = iconSet.glyphMap[name];

  if (typeof glyph === 'number') {
    return String.fromCodePoint(glyph);
  }

  return glyph ?? '';
}
