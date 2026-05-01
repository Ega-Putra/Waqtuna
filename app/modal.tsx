import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { indonesiaCities, type IndonesiaCity } from '@/constants/indonesia-cities';
import { EmptyState } from '@/src/components/EmptyState';
import { Text } from '@/src/components/ui/Text';
import { getSelectedCityCode } from '@/src/services/PreferenceService';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import { getLocationLabel, persistSelectedCityCode } from '@/utils/location';

type CitySection = {
  title: string;
  data: IndonesiaCity[];
};

export default function CityPickerModal() {
  const inputRef = useRef<TextInput | null>(null);
  const [query, setQuery] = useState('');
  const [selectedCityCode, setSelectedCityCode] = useState<string | null>(null);
  const sections = useMemo(() => buildCitySections(query), [query]);

  useEffect(() => {
    let isMounted = true;

    async function loadSelectedCity() {
      const cityCode = await getSelectedCityCode();

      if (isMounted) {
        setSelectedCityCode(cityCode);
      }
    }

    const focusTimer = setTimeout(() => inputRef.current?.focus(), 280);

    void loadSelectedCity();

    return () => {
      isMounted = false;
      clearTimeout(focusTimer);
    };
  }, []);

  async function handleSelectCity(city: IndonesiaCity) {
    await persistSelectedCityCode(city.code);
    setSelectedCityCode(city.code);
    router.back();
  }

  return (
    <View style={styles.screen}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />

      <View style={styles.sheet}>
        <View style={styles.handleBar} />
        <Text preset="subheading" style={styles.title}>
          Pilih Kota/Kabupaten
        </Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Cari kota atau kabupaten..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query ? (
            <Pressable style={styles.clearButton} onPress={() => setQuery('')}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.code}
          stickySectionHeadersEnabled
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <EmptyState
              icon={<Ionicons name="map-outline" size={42} color={colors.textMuted} />}
              title="Kota tidak ditemukan"
              subtitle="Coba kata kunci lain"
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text preset="label" style={styles.sectionHeaderText}>
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const isSelected = item.code === selectedCityCode;

            return (
              <Pressable
                style={({ pressed }) => [
                  styles.cityItem,
                  pressed && styles.cityItemPressed,
                  isSelected && styles.cityItemSelected,
                ]}
                onPress={() => void handleSelectCity(item)}>
                <View style={styles.cityTextWrap}>
                  <Text
                    preset="body"
                    numberOfLines={1}
                    style={[styles.cityName, isSelected && styles.cityNameSelected]}>
                    {item.city}
                  </Text>
                  <Text preset="caption" numberOfLines={1} style={styles.cityProvince}>
                    {item.province}
                  </Text>
                </View>

                {isSelected ? (
                  <MaterialIcons name="check-circle" size={22} color={colors.primary} />
                ) : (
                  <Text preset="caption" numberOfLines={1} style={styles.cityRightProvince}>
                    {item.province}
                  </Text>
                )}
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  );
}

function buildCitySections(query: string): CitySection[] {
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCities = normalizedQuery
    ? indonesiaCities.filter((city) => {
        const cityName = city.city.toLowerCase();
        const provinceName = city.province.toLowerCase();

        return cityName.includes(normalizedQuery) || provinceName.includes(normalizedQuery);
      })
    : indonesiaCities;
  const groupedCities = filteredCities.reduce<Record<string, IndonesiaCity[]>>((groups, city) => {
    groups[city.province] = [...(groups[city.province] ?? []), city];

    return groups;
  }, {});

  return Object.entries(groupedCities)
    .sort(([firstProvince], [secondProvince]) => firstProvince.localeCompare(secondProvince))
    .map(([province, cities]) => ({
      title: province.toUpperCase(),
      data: cities.sort((first, second) => getLocationLabel(first).localeCompare(getLocationLabel(second))),
    }));
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  sheet: {
    maxHeight: '82%',
    minHeight: '62%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    ...shadows.lg,
  },
  handleBar: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.md,
  },
  searchWrap: {
    minHeight: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSizeMD,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionHeaderText: {
    color: colors.textSecondary,
    letterSpacing: 0,
  },
  cityItem: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  cityItemPressed: {
    backgroundColor: colors.primarySoft,
  },
  cityItemSelected: {
    backgroundColor: colors.primarySoft,
  },
  cityTextWrap: {
    flex: 1,
  },
  cityName: {
    color: colors.textPrimary,
  },
  cityNameSelected: {
    fontWeight: typography.fontWeightExtraBold,
  },
  cityProvince: {
    marginTop: 2,
  },
  cityRightProvince: {
    color: colors.textMuted,
    maxWidth: 92,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.sm,
  },
});
