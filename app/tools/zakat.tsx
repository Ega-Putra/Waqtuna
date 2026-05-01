import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type GoldKarat,
  type ZakatCalculationResult,
  ZakatCalculatorService,
} from '@/src/services/ZakatCalculatorService';

type ActiveTab = 'maal' | 'income' | 'gold';

const tabs: { key: ActiveTab; label: string }[] = [
  { key: 'maal', label: 'Maal' },
  { key: 'income', label: 'Penghasilan' },
  { key: 'gold', label: 'Emas' },
];

const karatOptions: { value: GoldKarat; label: string }[] = [
  { value: '24K', label: '24K' },
  { value: '22K', label: '22K' },
  { value: '18K', label: '18K' },
  { value: '14K', label: '14K' },
];

export default function ZakatScreen() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('maal');
  const [totalAssets, setTotalAssets] = useState('');
  const [totalDebt, setTotalDebt] = useState('');
  const [goldPrice, setGoldPrice] = useState('1500000');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [ricePrice, setRicePrice] = useState('12000');
  const [goldWeight, setGoldWeight] = useState('');
  const [goldKarat, setGoldKarat] = useState<GoldKarat>('24K');
  const maalErrors = useMemo(
    () => ({
      totalAssets: validateNumberInput(totalAssets),
      totalDebt: validateNumberInput(totalDebt),
      goldPrice: validateNumberInput(goldPrice),
    }),
    [goldPrice, totalAssets, totalDebt]
  );
  const incomeErrors = useMemo(
    () => ({
      monthlyIncome: validateNumberInput(monthlyIncome),
      ricePrice: validateNumberInput(ricePrice),
    }),
    [monthlyIncome, ricePrice]
  );
  const goldErrors = useMemo(
    () => ({
      goldWeight: validateNumberInput(goldWeight),
      goldPrice: validateNumberInput(goldPrice),
    }),
    [goldPrice, goldWeight]
  );

  const maalResult = useMemo(
    () =>
      ZakatCalculatorService.calculateMaal({
        totalAssets: parseNumber(totalAssets),
        totalDebt: parseNumber(totalDebt),
        goldPricePerGram: parseNumber(goldPrice),
      }),
    [goldPrice, totalAssets, totalDebt]
  );

  const incomeResult = useMemo(
    () =>
      ZakatCalculatorService.calculateIncome({
        monthlyIncome: parseNumber(monthlyIncome),
        ricePricePerKg: parseNumber(ricePrice),
      }),
    [monthlyIncome, ricePrice]
  );

  const goldResult = useMemo(
    () =>
      ZakatCalculatorService.calculateGold({
        goldWeightGram: parseNumber(goldWeight),
        karat: goldKarat,
        goldPricePerGram: parseNumber(goldPrice),
      }),
    [goldKarat, goldPrice, goldWeight]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Kalkulator lokal untuk estimasi zakat. Masukkan harga emas atau beras sesuai kondisi hari ini.
        </Text>

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

        {activeTab === 'maal' ? (
          <>
            <View style={styles.formCard}>
              <ZakatInput
                label="Total Harta"
                description="Tabungan, investasi, dan piutang"
                value={totalAssets}
                onChangeText={setTotalAssets}
                suffix="Rp"
                placeholder="Contoh: 100000000"
                errorMessage={maalErrors.totalAssets}
              />
              <ZakatInput
                label="Total Hutang"
                description="Hutang jatuh tempo yang mengurangi harta"
                value={totalDebt}
                onChangeText={setTotalDebt}
                suffix="Rp"
                placeholder="Contoh: 10000000"
                errorMessage={maalErrors.totalDebt}
              />
              <ZakatInput
                label="Harga Emas per Gram"
                value={goldPrice}
                onChangeText={setGoldPrice}
                suffix="Rp"
                placeholder="1500000"
                errorMessage={maalErrors.goldPrice}
              />
            </View>
            <ZakatResult
              result={maalResult}
              rows={[
                ['Nisab', formatRupiah(maalResult.nisab)],
                ['Harta zakatable', formatRupiah(maalResult.zakatableAmount)],
              ]}
            />
          </>
        ) : null}

        {activeTab === 'income' ? (
          <>
            <View style={styles.formCard}>
              <ZakatInput
                label="Penghasilan per Bulan"
                value={monthlyIncome}
                onChangeText={setMonthlyIncome}
                suffix="Rp"
                placeholder="Contoh: 8000000"
                errorMessage={incomeErrors.monthlyIncome}
              />
              <ZakatInput
                label="Harga Beras per Kg"
                value={ricePrice}
                onChangeText={setRicePrice}
                suffix="Rp"
                placeholder="12000"
                errorMessage={incomeErrors.ricePrice}
              />
            </View>
            <ZakatResult
              result={incomeResult}
              rows={[
                ['Nisab 520 kg beras', formatRupiah(incomeResult.nisab)],
                ['Penghasilan zakatable', formatRupiah(incomeResult.zakatableAmount)],
              ]}
            />
          </>
        ) : null}

        {activeTab === 'gold' ? (
          <>
            <View style={styles.formCard}>
              <ZakatInput
                label="Berat Emas"
                value={goldWeight}
                onChangeText={setGoldWeight}
                suffix="gram"
                placeholder="Contoh: 100"
                errorMessage={goldErrors.goldWeight}
              />
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kadar Emas</Text>
                <View style={styles.optionGrid}>
                  {karatOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.optionButton,
                        goldKarat === option.value && styles.optionButtonActive,
                      ]}
                      onPress={() => setGoldKarat(option.value)}>
                      <Text
                        style={[
                          styles.optionText,
                          goldKarat === option.value && styles.optionTextActive,
                        ]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <ZakatInput
                label="Harga Emas 24K per Gram"
                value={goldPrice}
                onChangeText={setGoldPrice}
                suffix="Rp"
                placeholder="1500000"
                errorMessage={goldErrors.goldPrice}
              />
            </View>
            <ZakatResult
              result={goldResult}
              rows={[
                ['Setara emas 24K', `${formatNumber(goldResult.equivalentPureGoldGram)} gram`],
                ['Nisab emas 24K', `${formatNumber(goldResult.nisab)} gram`],
                ['Nilai emas zakatable', formatRupiah(goldResult.zakatableAmount)],
              ]}
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ZakatInput({
  label,
  description,
  value,
  onChangeText,
  suffix,
  placeholder,
  errorMessage,
}: {
  label: string;
  description?: string;
  value: string;
  onChangeText: (value: string) => void;
  suffix: string;
  placeholder: string;
  errorMessage?: string | null;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      {description ? <Text style={styles.inputDescription}>{description}</Text> : null}
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor="#7C847D"
          style={styles.input}
        />
        <Text style={styles.inputSuffix}>{suffix}</Text>
      </View>
      {errorMessage ? <Text style={styles.inputError}>{errorMessage}</Text> : null}
    </View>
  );
}

function ZakatResult({
  result,
  rows,
}: {
  result: ZakatCalculationResult;
  rows: [string, string][];
}) {
  return (
    <View style={styles.resultCard}>
      <View
        style={[
          styles.statusBadge,
          result.isObligatory ? styles.statusBadgeRequired : styles.statusBadgeNotRequired,
        ]}>
        <Text style={styles.statusText}>
          {result.isObligatory ? 'Wajib zakat' : 'Belum wajib zakat'}
        </Text>
      </View>

      {rows.map(([label, value]) => (
        <ResultRow key={label} label={label} value={value} />
      ))}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Jumlah zakat</Text>
        <Text style={styles.totalValue}>{formatRupiah(result.zakat)}</Text>
      </View>
    </View>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

function parseNumber(value: string) {
  const numericValue = Number(value.replace(/[^\d-]/g, ''));

  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
}

function validateNumberInput(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 'Masukkan nominal terlebih dahulu';
  }

  const numericValue = Number(trimmedValue.replace(/[^\d-]/g, ''));

  if (Number.isFinite(numericValue) && numericValue < 0) {
    return 'Angka tidak boleh negatif';
  }

  return null;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(value);
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
  description: {
    color: '#5E636A',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#D7E6CB',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
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
    fontSize: 13,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  formCard: {
    backgroundColor: '#F5FAEF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7E6CB',
    padding: 14,
    gap: 14,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: '#1D2A21',
    fontSize: 14,
    fontWeight: '800',
  },
  inputDescription: {
    color: '#66706A',
    fontSize: 12,
    lineHeight: 17,
    marginTop: -4,
  },
  inputWrap: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#E3ECD9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: '#1D2A21',
    fontSize: 16,
    paddingVertical: 10,
  },
  inputSuffix: {
    color: '#66706A',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },
  inputError: {
    color: '#B42318',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8D7BE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  optionButtonActive: {
    backgroundColor: '#007322',
    borderColor: '#007322',
  },
  optionText: {
    color: '#2F3334',
    fontSize: 13,
    fontWeight: '800',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  resultCard: {
    backgroundColor: '#00813A',
    borderRadius: 18,
    padding: 14,
    gap: 10,
    marginTop: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 2,
  },
  statusBadgeRequired: {
    backgroundColor: '#F6D365',
  },
  statusBadgeNotRequired: {
    backgroundColor: '#DFF2E1',
  },
  statusText: {
    color: '#1D2A21',
    fontSize: 13,
    fontWeight: '900',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultLabel: {
    color: '#DFF2E1',
    fontSize: 14,
    flex: 1,
  },
  resultValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    flex: 1,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.28)',
    paddingTop: 12,
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  totalValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
