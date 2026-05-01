import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, type RelativePathString } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/src/components/EmptyState';
import { ErrorState } from '@/src/components/ErrorState';
import { SkeletonBox } from '@/src/components/SkeletonBox';
import { QuranService } from '@/src/services/QuranService';
import type { Juz, SearchResult, Surah } from '@/src/types/quran';

type QuranTab = 'surah' | 'juz' | 'search';

const tabs: { key: QuranTab; label: string }[] = [
  { key: 'surah', label: 'Surat' },
  { key: 'juz', label: 'Juz' },
  { key: 'search', label: 'Cari' },
];

const lastReadKey = 'quran:last_read';

export default function QuranScreen() {
  const [activeTab, setActiveTab] = useState<QuranTab>('surah');
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [juzs, setJuzs] = useState<Juz[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [lastReadSurahId, setLastReadSurahId] = useState<number | null>(null);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingSurahs, setIsLoadingSurahs] = useState(true);
  const [isLoadingJuzs, setIsLoadingJuzs] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    void loadSurahs();
    void loadJuzs();
    void loadLastRead();
  }, []);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      void searchAyat(trimmedQuery);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [searchQuery]);

  const surahById = useMemo(
    () => new Map(surahs.map((surah) => [surah.id, surah])),
    [surahs]
  );
  const lastReadSurah = lastReadSurahId ? surahById.get(lastReadSurahId) : null;

  async function loadSurahs() {
    try {
      setErrorMessage(null);
      setIsLoadingSurahs(true);
      const data = await QuranService.getSurahList();
      setSurahs(data);
      setCacheMessage(QuranService.getCacheNotice()?.message ?? null);
    } catch {
      setErrorMessage('Gagal memuat data Al-Quran');
    } finally {
      setIsLoadingSurahs(false);
    }
  }

  async function loadJuzs() {
    try {
      setIsLoadingJuzs(true);
      const data = await QuranService.getJuzList();
      setJuzs(data);
      setCacheMessage(QuranService.getCacheNotice()?.message ?? null);
    } catch {
      setErrorMessage('Gagal memuat data Al-Quran');
    } finally {
      setIsLoadingJuzs(false);
    }
  }

  async function loadLastRead() {
    const rawValue = await AsyncStorage.getItem(lastReadKey);
    const parsedValue = Number(rawValue);

    if (Number.isInteger(parsedValue)) {
      setLastReadSurahId(parsedValue);
    }
  }

  async function openSurah(surahId: number) {
    await AsyncStorage.setItem(lastReadKey, String(surahId));
    setLastReadSurahId(surahId);
    router.push(`./${surahId}` as RelativePathString);
  }

  async function searchAyat(query: string) {
    try {
      setIsSearching(true);
      const data = await QuranService.searchAyat(query);
      setSearchResults(data);
    } catch {
      setSearchResults([]);
      setErrorMessage('Pencarian gagal. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}>
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {cacheMessage ? <Text style={styles.cacheBanner}>Menampilkan data dari cache</Text> : null}
        {errorMessage ? (
          <ErrorState
            message={errorMessage}
            onRetry={() => {
              void loadSurahs();
              void loadJuzs();
            }}
          />
        ) : null}

        {activeTab === 'surah' ? (
          <FlatList
            data={isLoadingSurahs ? [] : surahs}
            keyExtractor={(item) => String(item.id)}
            ListHeaderComponent={
              lastReadSurah ? (
                <Pressable style={styles.resumeCard} onPress={() => void openSurah(lastReadSurah.id)}>
                  <MaterialCommunityIcons name="book-clock-outline" size={22} color="#007322" />
                  <Text style={styles.resumeText}>Lanjut baca {lastReadSurah.nameSimple}</Text>
                </Pressable>
              ) : null
            }
            ListEmptyComponent={
              isLoadingSurahs ? (
                <SkeletonList />
              ) : !errorMessage ? (
                <EmptyState title="Belum ada data surat" subtitle="Coba muat ulang beberapa saat lagi." />
              ) : null
            }
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable style={styles.surahCard} onPress={() => void openSurah(item.id)}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>{item.id}</Text>
                </View>
                <View style={styles.surahTextWrap}>
                  <Text style={styles.surahName}>{item.nameSimple}</Text>
                  <Text style={styles.surahMeta}>
                    {item.versesCount} ayat · {formatRevelationPlace(item.revelationPlace)}
                  </Text>
                </View>
                <Text style={styles.arabicName}>{item.nameArabic}</Text>
              </Pressable>
            )}
          />
        ) : null}

        {activeTab === 'juz' ? (
          <FlatList
            data={isLoadingJuzs ? [] : juzs}
            keyExtractor={(item) => String(item.id)}
            ListEmptyComponent={
              isLoadingJuzs ? (
                <SkeletonList />
              ) : !errorMessage ? (
                <EmptyState title="Belum ada data juz" subtitle="Coba muat ulang beberapa saat lagi." />
              ) : null
            }
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.surahCard}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>{item.juzNumber}</Text>
                </View>
                <View style={styles.surahTextWrap}>
                  <Text style={styles.surahName}>Juz {item.juzNumber}</Text>
                  <Text style={styles.surahMeta}>{formatJuzRange(item, surahById)}</Text>
                </View>
              </View>
            )}
          />
        ) : null}

        {activeTab === 'search' ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.verseKey}
            ListHeaderComponent={
              <View style={styles.searchHeader}>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Cari ayat atau kata"
                  placeholderTextColor="#7C847D"
                  style={styles.searchInput}
                />
                {isSearching ? <Text style={styles.searchHint}>Mencari...</Text> : null}
              </View>
            }
            ListEmptyComponent={
              searchQuery.trim() && !isSearching ? (
                <EmptyState title="Tidak ada hasil" subtitle="Coba kata kunci lain." />
              ) : null
            }
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.searchCard}>
                <Text style={styles.searchVerseKey}>{item.verseKey}</Text>
                <HighlightedText text={item.text || item.translation || ''} query={searchQuery} />
              </View>
            )}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function SkeletonList() {
  return (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: 10 }).map((_, index) => (
        <View key={index} style={styles.skeletonItem}>
          <SkeletonBox width={38} height={38} borderRadius={999} />
          <View style={styles.skeletonTextBlock}>
            <SkeletonBox width="58%" height={14} />
            <SkeletonBox width="76%" height={12} />
          </View>
          <SkeletonBox width={54} height={24} />
        </View>
      ))}
    </View>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return <Text style={styles.searchText}>{text}</Text>;
  }

  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  return (
    <Text style={styles.searchText}>
      {parts.map((part, index) => (
        <Text
          key={`${part}-${index}`}
          style={part.toLowerCase() === trimmedQuery.toLowerCase() ? styles.highlightText : null}>
          {part}
        </Text>
      ))}
    </Text>
  );
}

function formatRevelationPlace(value: string) {
  return value === 'makkah' ? 'Makkiyah' : 'Madaniyah';
}

function formatJuzRange(juz: Juz, surahById: Map<number, Surah>) {
  const firstSurah = surahById.get(juz.firstSurahId)?.nameSimple ?? `Surah ${juz.firstSurahId}`;
  const lastSurah = surahById.get(juz.lastSurahId)?.nameSimple ?? `Surah ${juz.lastSurahId}`;

  return `${firstSurah} ${juz.firstVerse} s.d ${lastSurah} ${juz.lastVerse}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E7F0DE',
  },
  container: {
    flex: 1,
    backgroundColor: '#E7F0DE',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#D7E6CB',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#007322',
  },
  tabText: {
    color: '#4D5A4F',
    fontSize: 14,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  cacheBanner: {
    color: '#7A4E00',
    backgroundColor: '#FFF7D6',
    borderWidth: 1,
    borderColor: '#F2D17A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  listContent: {
    paddingBottom: 24,
    gap: 10,
  },
  resumeCard: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#F5FAEF',
    borderWidth: 1,
    borderColor: '#B9D8BD',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  resumeText: {
    color: '#007322',
    fontSize: 14,
    fontWeight: '800',
  },
  surahCard: {
    minHeight: 72,
    borderRadius: 18,
    backgroundColor: '#F5FAEF',
    borderWidth: 1,
    borderColor: '#D7E6CB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  numberBadge: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#007322',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  surahTextWrap: {
    flex: 1,
  },
  surahName: {
    color: '#1D2A21',
    fontSize: 16,
    fontWeight: '900',
  },
  surahMeta: {
    color: '#66706A',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  arabicName: {
    color: '#007322',
    fontSize: 23,
    fontWeight: '800',
  },
  skeletonWrap: {
    gap: 10,
  },
  skeletonItem: {
    height: 72,
    borderRadius: 18,
    backgroundColor: '#F5FAEF',
    borderWidth: 1,
    borderColor: '#D7E6CB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  skeletonTextBlock: {
    flex: 1,
    gap: 9,
  },
  searchHeader: {
    marginBottom: 10,
  },
  searchInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F5FAEF',
    borderWidth: 1,
    borderColor: '#D7E6CB',
    paddingHorizontal: 14,
    color: '#1D2A21',
    fontSize: 16,
  },
  searchHint: {
    color: '#66706A',
    fontSize: 13,
    marginTop: 8,
  },
  searchCard: {
    borderRadius: 16,
    backgroundColor: '#F5FAEF',
    borderWidth: 1,
    borderColor: '#D7E6CB',
    padding: 12,
  },
  searchVerseKey: {
    color: '#007322',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
  },
  searchText: {
    color: '#1D2A21',
    fontSize: 15,
    lineHeight: 22,
  },
  highlightText: {
    backgroundColor: '#F6D365',
    color: '#1D2A21',
    fontWeight: '900',
  },
});
