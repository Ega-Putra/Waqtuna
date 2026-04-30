import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const zakatRate = 0.025;
const defaultGoldPrice = 1_200_000;
const nisabGoldGram = 85;

export default function ZakatScreen() {
  const [cashValue, setCashValue] = useState('');
  const [goldValue, setGoldValue] = useState('');
  const [incomeValue, setIncomeValue] = useState('');

  const result = useMemo(() => {
    const cash = parseCurrency(cashValue);
    const goldGram = parseCurrency(goldValue);
    const monthlyIncome = parseCurrency(incomeValue);
    const goldAsset = goldGram * defaultGoldPrice;
    const maalBase = cash + goldAsset;
    const nisabValue = nisabGoldGram * defaultGoldPrice;
    const maalZakat = maalBase >= nisabValue ? maalBase * zakatRate : 0;
    const incomeZakat = monthlyIncome >= nisabValue / 12 ? monthlyIncome * zakatRate : 0;

    return {
      maalBase,
      nisabValue,
      maalZakat,
      incomeZakat,
      total: maalZakat + incomeZakat,
    };
  }, [cashValue, goldValue, incomeValue]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Kalkulator lokal sederhana dengan nisab 85 gram emas dan zakat 2.5%.
        </Text>

        <View style={styles.formCard}>
          <CurrencyInput
            label="Tabungan / Aset Lancar"
            placeholder="Contoh: 15000000"
            value={cashValue}
            onChangeText={setCashValue}
            suffix="Rp"
          />
          <CurrencyInput
            label="Emas yang Dimiliki"
            placeholder="Contoh: 10"
            value={goldValue}
            onChangeText={setGoldValue}
            suffix="gram"
          />
          <CurrencyInput
            label="Penghasilan Bulanan"
            placeholder="Contoh: 8000000"
            value={incomeValue}
            onChangeText={setIncomeValue}
            suffix="Rp"
          />
        </View>

        <View style={styles.resultCard}>
          <ResultRow label="Total aset maal" value={formatRupiah(result.maalBase)} />
          <ResultRow label="Nisab" value={formatRupiah(result.nisabValue)} />
          <ResultRow label="Zakat maal" value={formatRupiah(result.maalZakat)} />
          <ResultRow label="Zakat penghasilan" value={formatRupiah(result.incomeZakat)} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total zakat</Text>
            <Text style={styles.totalValue}>{formatRupiah(result.total)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CurrencyInput({
  label,
  placeholder,
  value,
  onChangeText,
  suffix,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  suffix: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
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

function parseCurrency(value: string) {
  const numericValue = Number(value.replace(/[^\d]/g, ''));

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
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
  resultCard: {
    backgroundColor: '#00813A',
    borderRadius: 18,
    padding: 14,
    gap: 10,
    marginTop: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultLabel: {
    color: '#DFF2E1',
    fontSize: 14,
  },
  resultValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
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
