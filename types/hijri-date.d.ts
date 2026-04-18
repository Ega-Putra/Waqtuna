declare module 'hijri-date/lib/safe.js' {
  export type HijriDateLike = {
    getDate(): number;
    getMonth(): number;
    getFullYear(): number;
  };

  export function toHijri(date: Date): HijriDateLike;
}
