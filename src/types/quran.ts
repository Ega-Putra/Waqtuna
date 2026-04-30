export type RevelationPlace = 'makkah' | 'madinah' | string;

export type Surah = {
  id: number;
  nameArabic: string;
  nameSimple: string;
  versesCount: number;
  revelationPlace: RevelationPlace;
};

export type Ayah = {
  id: number;
  verseNumber: number;
  verseKey: string;
  juzNumber?: number;
  textArabic: string;
  translation: string;
};

export type SurahDetail = {
  surahId: number;
  ayahs: Ayah[];
};

export type Juz = {
  id: number;
  juzNumber: number;
  verseMapping: Record<string, string>;
  firstSurahId: number;
  firstVerse: number;
  lastSurahId: number;
  lastVerse: number;
};

export type SearchResult = {
  verseKey: string;
  surahId: number;
  verseNumber: number;
  text: string;
  highlightedText?: string;
  translation?: string;
};

export type QuranCacheNotice = {
  key: string;
  isFromCache: boolean;
  isExpired: boolean;
  message: string | null;
};
