import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '@/src/components/ErrorState';
import { SkeletonBox } from '@/src/components/SkeletonBox';
import { QuranService } from '@/src/services/QuranService';
import type { Ayah, Surah, SurahDetail } from '@/src/types/quran';

const bookmarksKey = 'quran:bookmarks';
const arabicFontSizeKey = 'quran:arabic_font_size';
const basmalahText = 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ';
const fontSizes = [26, 30, 34, 38, 42];

export default function SurahReaderScreen() {
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const parsedSurahId = Number(surahId);
  const scrollRef = useRef<ScrollView | null>(null);
  const [surahDetail, setSurahDetail] = useState<SurahDetail | null>(null);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [arabicFontSize, setArabicFontSize] = useState(34);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRestoredScroll, setHasRestoredScroll] = useState(false);

  const currentSurah = useMemo(
    () => surahs.find((surah) => surah.id === parsedSurahId) ?? null,
    [parsedSurahId, surahs]
  );

  const loadReaderState = useCallback(async () => {
    try {
      setErrorMessage(null);
      setIsLoading(true);
      setHasRestoredScroll(false);

      const [surahData, surahList, bookmarkValues, fontSizeValue, storedScrollOffset] =
        await Promise.all([
          QuranService.getSurah(parsedSurahId),
          QuranService.getSurahList(),
          getBookmarks(),
          AsyncStorage.getItem(arabicFontSizeKey),
          AsyncStorage.getItem(getScrollKey(parsedSurahId)),
        ]);

      setSurahDetail(surahData);
      setSurahs(surahList);
      setBookmarks(new Set(bookmarkValues));
      setArabicFontSize(parseFontSize(fontSizeValue));
      setScrollOffset(Number(storedScrollOffset) || 0);
      setCacheMessage(QuranService.getCacheNotice()?.message ?? null);
    } catch {
      setErrorMessage('Gagal memuat surat ini');
    } finally {
      setIsLoading(false);
    }
  }, [parsedSurahId]);

  useEffect(() => {
    void loadReaderState();
  }, [loadReaderState]);

  useEffect(() => {
    if (!surahDetail || hasRestoredScroll) {
      return;
    }

    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: scrollOffset, animated: false });
      setHasRestoredScroll(true);
    }, 250);

    return () => {
      clearTimeout(timeout);
    };
  }, [hasRestoredScroll, scrollOffset, surahDetail]);

  async function handleSetArabicFontSize(size: number) {
    setArabicFontSize(size);
    await AsyncStorage.setItem(arabicFontSizeKey, String(size));
  }

  async function toggleBookmark(ayah: Ayah) {
    const nextBookmarks = new Set(bookmarks);

    if (nextBookmarks.has(ayah.verseKey)) {
      nextBookmarks.delete(ayah.verseKey);
    } else {
      nextBookmarks.add(ayah.verseKey);
    }

    setBookmarks(nextBookmarks);
    await AsyncStorage.setItem(bookmarksKey, JSON.stringify(Array.from(nextBookmarks)));
  }

  async function persistScrollOffset(offset: number) {
    await AsyncStorage.setItem(getScrollKey(parsedSurahId), String(Math.max(offset, 0)));
  }

  const ayahs = surahDetail?.ayahs ?? [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        scrollEventThrottle={700}
        onScroll={(event) => void persistScrollOffset(event.nativeEvent.contentOffset.y)}>
        <View style={styles.headerCard}>
          <Text style={styles.surahTitle}>{currentSurah?.nameSimple ?? `Surat ${parsedSurahId}`}</Text>
          <Text style={styles.surahMeta}>
            {currentSurah ? `${currentSurah.versesCount} ayat · ${formatRevelationPlace(currentSurah.revelationPlace)}` : ''}
          </Text>
        </View>

        {cacheMessage ? <Text style={styles.cacheBanner}>Menampilkan data dari cache</Text> : null}

        <View style={styles.fontControlCard}>
          <Text style={styles.controlTitle}>Ukuran font Arab</Text>
          <View style={styles.fontSlider}>
            {fontSizes.map((size) => (
              <Pressable
                key={size}
                style={[styles.fontStep, arabicFontSize === size && styles.fontStepActive]}
                onPress={() => void handleSetArabicFontSize(size)}>
                <Text
                  style={[styles.fontStepText, arabicFontSize === size && styles.fontStepTextActive]}>
                  {size}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {isLoading ? (
          <AyahSkeletonList />
        ) : null}

        {errorMessage ? (
          <ErrorState message={errorMessage} onRetry={() => void loadReaderState()} />
        ) : null}

        {!isLoading && parsedSurahId !== 9 ? (
          <Text style={[styles.basmalahText, { fontSize: arabicFontSize }]}>{basmalahText}</Text>
        ) : null}

        {ayahs.map((ayah) => (
          <View key={ayah.verseKey} style={styles.ayahCard}>
            <View style={styles.ayahHeader}>
              <Pressable
                style={[styles.ayahNumber, bookmarks.has(ayah.verseKey) && styles.ayahNumberBookmarked]}
                onPress={() => void toggleBookmark(ayah)}>
                <Text style={styles.ayahNumberText}>{ayah.verseNumber}</Text>
              </Pressable>

              <Pressable
                style={styles.audioButton}
                onPress={() => void openAudio(getGlobalAyahNumber(surahs, parsedSurahId, ayah.verseNumber))}>
                <MaterialCommunityIcons name="volume-high" size={18} color="#007322" />
                <Text style={styles.audioText}>Audio</Text>
              </Pressable>
            </View>

            <Text style={[styles.arabicText, { fontSize: arabicFontSize }]}>
              {ayah.textArabic}
            </Text>
            <Text style={styles.translationText}>{ayah.translation}</Text>

            {bookmarks.has(ayah.verseKey) ? (
              <View style={styles.bookmarkRow}>
                <MaterialIcons name="bookmark" size={16} color="#007322" />
                <Text style={styles.bookmarkText}>Ditandai</Text>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function AyahSkeletonList() {
  return (
    <View style={styles.ayahSkeletonWrap}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.ayahSkeletonCard}>
          <View style={styles.ayahSkeletonHeader}>
            <SkeletonBox width={36} height={36} borderRadius={999} />
            <SkeletonBox width={82} height={34} borderRadius={999} />
          </View>
          <SkeletonBox width="92%" height={28} style={styles.ayahSkeletonArabic} />
          <SkeletonBox width="100%" height={14} />
          <SkeletonBox width="84%" height={14} />
        </View>
      ))}
    </View>
  );
}

async function getBookmarks(): Promise<string[]> {
  const rawValue = await AsyncStorage.getItem(bookmarksKey);

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

async function openAudio(globalAyahNumber: number) {
  const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;

  await Linking.openURL(url);
}

function getGlobalAyahNumber(surahs: Surah[], surahId: number, verseNumber: number) {
  const previousAyahCount = surahs
    .filter((surah) => surah.id < surahId)
    .reduce((total, surah) => total + surah.versesCount, 0);

  return previousAyahCount + verseNumber;
}

function getScrollKey(surahId: number) {
  return `quran:last_scroll:${surahId}`;
}

function parseFontSize(value: string | null) {
  const size = Number(value);

  return fontSizes.includes(size) ? size : 34;
}

function formatRevelationPlace(value: string) {
  return value === 'makkah' ? 'Makkiyah' : 'Madaniyah';
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
  headerCard: {
    backgroundColor: '#007322',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  surahTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  surahMeta: {
    color: '#DFF2E1',
    fontSize: 14,
    marginTop: 4,
  },
  cacheBanner: {
    color: '#7A4E00',
    backgroundColor: '#FFF7D6',
    borderWidth: 1,
    borderColor: '#F2D17A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  fontControlCard: {
    backgroundColor: '#F5FAEF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7E6CB',
    padding: 12,
    marginBottom: 14,
  },
  controlTitle: {
    color: '#1D2A21',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  fontSlider: {
    flexDirection: 'row',
    gap: 8,
  },
  fontStep: {
    flex: 1,
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: '#E3ECD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontStepActive: {
    backgroundColor: '#007322',
  },
  fontStepText: {
    color: '#4D5A4F',
    fontSize: 13,
    fontWeight: '900',
  },
  fontStepTextActive: {
    color: '#FFFFFF',
  },
  ayahSkeletonWrap: {
    gap: 12,
  },
  ayahSkeletonCard: {
    backgroundColor: '#F5FAEF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7E6CB',
    padding: 14,
    gap: 12,
  },
  ayahSkeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ayahSkeletonArabic: {
    alignSelf: 'flex-end',
  },
  basmalahText: {
    color: '#007322',
    textAlign: 'center',
    lineHeight: 58,
    marginBottom: 12,
    writingDirection: 'rtl',
  },
  ayahCard: {
    backgroundColor: '#F5FAEF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7E6CB',
    padding: 14,
    marginBottom: 12,
  },
  ayahHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ayahNumber: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#007322',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahNumberBookmarked: {
    backgroundColor: '#F6D365',
  },
  ayahNumberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  audioButton: {
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: '#E3ECD9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  audioText: {
    color: '#007322',
    fontSize: 12,
    fontWeight: '900',
  },
  arabicText: {
    color: '#1D2A21',
    lineHeight: 58,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  translationText: {
    color: '#4D5A4F',
    fontSize: 15,
    lineHeight: 24,
    marginTop: 12,
  },
  bookmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  bookmarkText: {
    color: '#007322',
    fontSize: 12,
    fontWeight: '800',
  },
});
