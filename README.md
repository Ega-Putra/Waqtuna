# Waqtuna

Waqtuna adalah aplikasi Expo/React Native untuk kebutuhan ibadah harian: jadwal sholat, pengingat, kalender Islam, Al-Quran, kiblat, zakat, dan widget Android.

## Menjalankan proyek

```bash
npm install
npm run start
```

Shortcut lain:

- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run lint`

## Struktur proyek

- `app/` hanya untuk Expo Router dan wrapper route
- `src/features/` screen dan logic per fitur
- `src/shared/` shared UI, hooks, constants, utils, dan types
- `src/services/` service layer aplikasi
- `src/theme/` token dan helper tema
- `src/widgets/` integrasi widget Android

## Catatan

- Gunakan alias `@/` untuk import dari dalam `src`
- Hindari menambah logic aplikasi baru di root selain `app/` dan file konfigurasi
