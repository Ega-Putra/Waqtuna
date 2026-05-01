declare module 'hijri-date/lib/safe.js' {
  export type HijriDateLike = {
    getDate(): number;
    getMonth(): number;
    getFullYear(): number;
    toGregorian(): Date;
  };

  export default class HijriDate implements HijriDateLike {
    constructor(year?: number, month?: number, date?: number);
    getDate(): number;
    getMonth(): number;
    getFullYear(): number;
    toGregorian(): Date;
  }

  export function toHijri(date: Date): HijriDateLike;
}
