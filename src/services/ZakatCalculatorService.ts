const zakatRate = 0.025;
const maalNisabGoldGram = 85;
const incomeNisabRiceKg = 520;

export type ZakatCalculationResult = {
  isObligatory: boolean;
  zakatableAmount: number;
  nisab: number;
  zakat: number;
};

export type GoldKarat = '24K' | '22K' | '18K' | '14K';

const goldPurity: Record<GoldKarat, number> = {
  '24K': 1,
  '22K': 0.917,
  '18K': 0.75,
  '14K': 0.583,
};

export const ZakatCalculatorService = {
  calculateMaal({
    totalAssets,
    totalDebt,
    goldPricePerGram,
  }: {
    totalAssets: number;
    totalDebt: number;
    goldPricePerGram: number;
  }): ZakatCalculationResult {
    const nisab = maalNisabGoldGram * goldPricePerGram;
    const zakatableAmount = Math.max(totalAssets - totalDebt, 0);
    const isObligatory = zakatableAmount >= nisab;

    return {
      isObligatory,
      zakatableAmount,
      nisab,
      zakat: isObligatory ? zakatableAmount * zakatRate : 0,
    };
  },

  calculateIncome({
    monthlyIncome,
    ricePricePerKg,
  }: {
    monthlyIncome: number;
    ricePricePerKg: number;
  }): ZakatCalculationResult {
    const nisab = incomeNisabRiceKg * ricePricePerKg;
    const zakatableAmount = Math.max(monthlyIncome, 0);
    const isObligatory = zakatableAmount >= nisab;

    return {
      isObligatory,
      zakatableAmount,
      nisab,
      zakat: isObligatory ? zakatableAmount * zakatRate : 0,
    };
  },

  calculateGold({
    goldWeightGram,
    karat,
    goldPricePerGram,
  }: {
    goldWeightGram: number;
    karat: GoldKarat;
    goldPricePerGram: number;
  }): ZakatCalculationResult & { equivalentPureGoldGram: number } {
    const equivalentPureGoldGram = Math.max(goldWeightGram, 0) * goldPurity[karat];
    const nisab = maalNisabGoldGram;
    const isObligatory = equivalentPureGoldGram >= nisab;
    const zakatableAmount = equivalentPureGoldGram * goldPricePerGram;

    return {
      isObligatory,
      equivalentPureGoldGram,
      zakatableAmount,
      nisab,
      zakat: isObligatory ? zakatableAmount * zakatRate : 0,
    };
  },
};
