'use no memo';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { FlexWidget, IconWidget, TextWidget } from 'react-native-android-widget';

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
      clickAction="OPEN_APP"
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: '#E7F0DE',
        borderRadius: 24,
        padding: 10,
        justifyContent: 'flex-end',
        flexDirection: 'column',
        flexGap: 10,
      }}
      accessibilityLabel="Widget ringkasan sholat"
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
          paddingHorizontal: 10,
          paddingVertical: 8,
        }}
      >
        <FlexWidget
          style={{
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingRight: 10,
          }}
        >
          <TextWidget
            text={data.title}
            style={{
              color: '#007322',
              fontSize: 32,
              fontFamily: 'Inter',
              fontWeight: '800',
            }}
          />

          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flexGap: 4,
              marginTop: 8,
            }}
          >
            <IconWidget
              icon={getIconGlyph(MaterialCommunityIcons, 'clock-outline')}
              size={18}
              font="MaterialCommunityIcons"
              style={{
                color: '#00813A',
              }}
            />
            <TextWidget
              text={data.countdownText}
              style={{
                color: '#00813A',
                fontSize: 14,
                fontFamily: 'Inter',
                fontWeight: '400',
              }}
              maxLines={1}
              truncate="END"
            />
          </FlexWidget>
        </FlexWidget>

        <FlexWidget
          style={{
            width: 150,
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <FlexWidget
            style={{
              backgroundColor: '#FFF7ED',
              borderWidth: 1,
              borderColor: '#FFEDD5',
              borderRadius: 100,
              paddingHorizontal: 13,
              paddingVertical: 7,
              flexDirection: 'row',
              alignItems: 'center',
              flexGap: 8,
            }}
          >
            <TextWidget
              text="🔥"
              style={{
                fontSize: 14,
                fontFamily: 'Inter',
              }}
            />
            <TextWidget
              text={`${data.streak} Hari Beruntun`}
              style={{
                color: '#C2410C',
                fontSize: 14,
                fontFamily: 'Inter',
                fontWeight: '700',
              }}
            />
          </FlexWidget>

          <FlexWidget
            style={{
              backgroundColor: '#00813A',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              flexGap: 4,
              width: 'match_parent',
              marginTop: 8,
            }}
          >
            <IconWidget
              icon={getIconGlyph(Ionicons, 'location-sharp')}
              size={16}
              font="Ionicons"
              style={{
                color: '#FFFFFF',
              }}
            />
            <TextWidget
              text={data.locationLabel}
              style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontFamily: 'Inter',
                fontWeight: '500',
                textAlign: 'center',
              }}
              maxLines={1}
              truncate="END"
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>

      <FlexWidget
        style={{
          width: 'match_parent',
          height: 80,
          backgroundColor: '#47AC5E',
          borderRadius: 24,
          padding: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexGap: 10,
          }}
        >
          <FlexWidget
            style={{
              width: 48,
              height: 48,
              backgroundColor: '#00813A',
              borderRadius: 100,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconWidget
              icon={getIconGlyph(MaterialCommunityIcons, prayerIcon)}
              size={28}
              font="MaterialCommunityIcons"
              style={{
                color: '#FFFFFF',
              }}
            />
          </FlexWidget>

          <FlexWidget
            style={{
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <TextWidget
              text={data.prayerName}
              style={{
                color: '#FFFFFF',
                fontSize: 24,
                fontFamily: 'Inter',
                fontWeight: '700',
              }}
            />
            <TextWidget
              text={data.prayerTime}
              style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontFamily: 'Inter',
                fontWeight: '300',
                marginTop: 4,
              }}
            />
          </FlexWidget>
        </FlexWidget>

        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexGap: 10,
          }}
        >
          <FlexWidget
            clickAction="OPEN_APP"
            style={{
              width: 30,
              height: 30,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconWidget
              icon={getIconGlyph(MaterialIcons, 'more-time')}
              size={24}
              font="MaterialIcons"
              style={{
                color: '#FFFFFF',
              }}
            />
          </FlexWidget>

          <FlexWidget
            clickAction="TOGGLE_PRAYER_CHECKLIST"
            clickActionData={{ prayerName: data.prayerName }}
            style={{
              width: 30,
              height: 30,
              backgroundColor: data.isChecked ? '#DDF4E4' : '#FFFFFF',
              borderRadius: 100,
              borderWidth: 1,
              borderColor: data.isChecked ? '#007322' : 'rgba(0,0,0,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconWidget
              icon={getIconGlyph(MaterialIcons, 'check')}
              size={20}
              font="MaterialIcons"
              style={{
                color: data.isChecked ? '#007322' : '#97A6A0',
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
