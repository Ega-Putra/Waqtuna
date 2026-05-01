import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Juz, QuranCacheNotice, SearchResult, Surah, SurahDetail } from '@/shared/types/quran';

const baseUrl = 'https://api.quran.com/api/v4';
const cacheMaxAgeMs = 7 * 24 * 60 * 60 * 1000;
const surahListCacheKey = 'quran:surah_list';
const juzListCacheKey = 'quran:juz_list';

let lastCacheNotice: QuranCacheNotice | null = null;

type CachedPayload<TData> = {
  timestamp: number;
  data: TData;
};

type QuranChapterResponse = {
  chapters?: {
    id: number;
    name_arabic: string;
    name_simple: string;
    verses_count: number;
    revelation_place: string;
  }[];
};

type QuranVersesResponse = {
  verses?: {
    id: number;
    verse_number: number;
    verse_key: string;
    juz_number?: number;
    text_uthmani?: string;
    words?: {
      char_type_name?: string;
      text_uthmani?: string;
    }[];
    translations?: {
      text?: string;
    }[];
  }[];
};

type QuranJuzResponse = {
  juzs?: {
    id: number;
    juz_number: number;
    verse_mapping: Record<string, string>;
  }[];
};

type QuranSearchResponse = {
  search?: {
    results?: {
      verse_key: string;
      text?: string;
      highlighted?: string;
      translations?: {
        text?: string;
      }[];
    }[];
  };
};

export const QuranService = {
  getCacheNotice() {
    return lastCacheNotice;
  },

  async getSurahList(): Promise<Surah[]> {
    return getCachedOrFetch(surahListCacheKey, `${baseUrl}/chapters?language=id`, mapSurahList);
  },

  async getSurah(surahId: number): Promise<SurahDetail> {
    const cacheKey = `quran:surah:${surahId}`;
    const url = `${baseUrl}/verses/by_chapter/${surahId}?language=id&words=true&translations=33&per_page=286`;

    return getCachedOrFetch<QuranVersesResponse, SurahDetail>(cacheKey, url, (response) =>
      mapSurahDetail(surahId, response)
    );
  },

  async getJuzList(): Promise<Juz[]> {
    return getCachedOrFetch(juzListCacheKey, `${baseUrl}/juzs`, mapJuzList);
  },

  async searchAyat(query: string): Promise<SearchResult[]> {
    const url = `${baseUrl}/search?q=${encodeURIComponent(query)}&size=20&language=id`;
    const response = await fetchJson<QuranSearchResponse>(url);

    return mapSearchResults(response);
  },
};

async function getCachedOrFetch<TResponse, TData>(
  cacheKey: string,
  url: string,
  mapper: (response: TResponse) => TData
): Promise<TData> {
  const cachedPayload = await getCachedPayload<TData>(cacheKey);
  const isCacheFresh = cachedPayload ? Date.now() - cachedPayload.timestamp < cacheMaxAgeMs : false;

  if (cachedPayload && isCacheFresh) {
    lastCacheNotice = {
      key: cacheKey,
      isFromCache: true,
      isExpired: false,
      message: null,
    };
    return cachedPayload.data;
  }

  try {
    const response = await fetchJson<TResponse>(url);
    const data = mapper(response);
    await setCachedPayload(cacheKey, data);
    lastCacheNotice = {
      key: cacheKey,
      isFromCache: false,
      isExpired: false,
      message: null,
    };

    return data;
  } catch (error) {
    if (cachedPayload) {
      lastCacheNotice = {
        key: cacheKey,
        isFromCache: true,
        isExpired: true,
        message: 'Menampilkan data dari cache. Data mungkin tidak terbaru.',
      };
      return cachedPayload.data;
    }

    throw error;
  }
}

async function fetchJson<TResponse>(url: string): Promise<TResponse> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Quran API error ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

async function getCachedPayload<TData>(cacheKey: string): Promise<CachedPayload<TData> | null> {
  const rawValue = await AsyncStorage.getItem(cacheKey);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<CachedPayload<TData>>;

    if (typeof parsed.timestamp === 'number' && parsed.data !== undefined) {
      return parsed as CachedPayload<TData>;
    }
  } catch {
    return null;
  }

  return null;
}

async function setCachedPayload<TData>(cacheKey: string, data: TData) {
  const payload: CachedPayload<TData> = {
    timestamp: Date.now(),
    data,
  };

  await AsyncStorage.setItem(cacheKey, JSON.stringify(payload));
}

function mapSurahList(response: QuranChapterResponse): Surah[] {
  return (response.chapters ?? []).map((chapter) => ({
    id: chapter.id,
    nameArabic: chapter.name_arabic,
    nameSimple: chapter.name_simple,
    versesCount: chapter.verses_count,
    revelationPlace: chapter.revelation_place,
  }));
}

function mapSurahDetail(surahId: number, response: QuranVersesResponse): SurahDetail {
  return {
    surahId,
    ayahs: (response.verses ?? []).map((verse) => ({
      id: verse.id,
      verseNumber: verse.verse_number,
      verseKey: verse.verse_key,
      juzNumber: verse.juz_number,
      textArabic: verse.text_uthmani ?? mapWordsToArabicText(verse.words ?? []),
      translation: stripHtml(verse.translations?.[0]?.text ?? ''),
    })),
  };
}

function mapWordsToArabicText(words: NonNullable<QuranVersesResponse['verses']>[number]['words']) {
  return (words ?? [])
    .map((word) => word.text_uthmani)
    .filter(Boolean)
    .join(' ');
}

function mapJuzList(response: QuranJuzResponse): Juz[] {
  return (response.juzs ?? []).map((juz) => {
    const entries = Object.entries(juz.verse_mapping);
    const [firstSurahIdRaw, firstRange = '1-1'] = entries[0] ?? ['1', '1-1'];
    const [lastSurahIdRaw, lastRange = '1-1'] = entries[entries.length - 1] ?? ['1', '1-1'];
    const [firstVerseRaw] = firstRange.split('-');
    const [, lastVerseRaw = firstVerseRaw] = lastRange.split('-');

    return {
      id: juz.id,
      juzNumber: juz.juz_number,
      verseMapping: juz.verse_mapping,
      firstSurahId: Number(firstSurahIdRaw),
      firstVerse: Number(firstVerseRaw),
      lastSurahId: Number(lastSurahIdRaw),
      lastVerse: Number(lastVerseRaw),
    };
  });
}

function mapSearchResults(response: QuranSearchResponse): SearchResult[] {
  return (response.search?.results ?? []).map((result) => {
    const [surahIdRaw, verseNumberRaw] = result.verse_key.split(':');

    return {
      verseKey: result.verse_key,
      surahId: Number(surahIdRaw),
      verseNumber: Number(verseNumberRaw),
      text: stripHtml(result.text ?? ''),
      highlightedText: result.highlighted,
      translation: stripHtml(result.translations?.[0]?.text ?? ''),
    };
  });
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
